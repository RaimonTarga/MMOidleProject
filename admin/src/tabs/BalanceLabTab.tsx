import { useEffect, useMemo, useState } from 'react';
import type { BalanceLabBiomeRow, BalanceLabEncounterRow, BalanceLabProgressionFit, BalanceLabThreatStatus } from '@mmo-idle/shared';
import { useAtomValue } from 'jotai';
import { FlaskConical, RefreshCw, Search, ShieldAlert, Skull, Swords } from 'lucide-react';
import { balanceLabAtom } from '../state';
import { requestBalanceLab } from '../socket';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type SortKey = 'threat' | 'hp' | 'reward';

export function BalanceLabTab() {
  const snapshot = useAtomValue(balanceLabAtom);
  const [tier, setTier] = useState(1);
  const [sort, setSort] = useState<SortKey>('threat');
  const [search, setSearch] = useState('');
  const [bossesOnly, setBossesOnly] = useState(false);
  const [selectedMonsterId, setSelectedMonsterId] = useState<string | null>(null);

  useEffect(() => requestBalanceLab(), []);
  useEffect(() => {
    if (snapshot && !snapshot.tiers.includes(tier)) setTier(snapshot.tiers[0] ?? 1);
  }, [snapshot, tier]);

  const biomeRows = useMemo(() => {
    const rows = snapshot?.biomes.filter((row) => row.biomeTier === tier) ?? [];
    return [...rows].sort((a, b) => {
      if (sort === 'hp') return b.meanHp - a.meanHp;
      if (sort === 'reward') return b.rewardThreatRatio - a.rewardThreatRatio;
      return b.threatIndex - a.threatIndex;
    });
  }, [snapshot, tier, sort]);

  const encounters = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    return (snapshot?.encounters ?? []).filter((row) =>
      row.biomeTier === tier
      && (!bossesOnly || row.isBoss)
      && (!needle || `${row.name} ${row.biomeName} ${row.role} ${row.specials.join(' ')}`.toLocaleLowerCase().includes(needle))
    );
  }, [snapshot, tier, search, bossesOnly]);

  const selected = encounters.find((row) => row.monsterId === selectedMonsterId)
    ?? encounters[0]
    ?? null;
  const entryProfile = snapshot?.referenceProfiles.find((profile) => profile.biomeTier === tier && profile.label.startsWith('Entry'));
  const progressionPolicy = snapshot?.progressionPolicies.find((policy) => policy.tier === tier);
  const progressionRows = (snapshot?.progression ?? []).filter((row) => row.biomeTier === tier).sort((a, b) => a.order - b.order);
  const blocked = biomeRows.filter((row) => row.status === 'Blocked').length;
  const maxSpread = biomeRows.length > 0
    ? Math.max(...biomeRows.map((row) => row.threatIndex)) / Math.max(0.01, Math.min(...biomeRows.map((row) => row.threatIndex)))
    : 0;

  if (!snapshot) {
    return (
      <Card>
        <CardHeader><CardTitle>Balance Lab</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-red-100/55">Waiting for the authored-data snapshot.</p>
          <Button onClick={requestBalanceLab}><RefreshCw className="h-4 w-4" /> Load snapshot</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-orange-300" />
            <h2 className="text-2xl font-semibold">Balance Lab</h2>
            <Badge variant="secondary">read-only MVP</Badge>
          </div>
          <p className="mt-1 text-sm text-red-100/55">
            Authored monster pressure, reward drift, and reference matchups · snapshot {new Date(snapshot.generatedAt).toLocaleTimeString()}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-red-950/70 bg-[#120404]/75 p-1">
            {snapshot.tiers.map((value) => (
              <button
                key={value}
                type="button"
                className={`rounded-md px-4 py-2 text-sm font-semibold ${tier === value ? 'bg-orange-500 text-black' : 'text-red-100/55 hover:text-orange-100'}`}
                onClick={() => { setTier(value); setSelectedMonsterId(null); }}
              >
                T{value}
              </button>
            ))}
          </div>
          <Button variant="outline" onClick={requestBalanceLab}><RefreshCw className="h-4 w-4" /> Refresh</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Entry reference" value={entryProfile?.gearLabel ?? '—'} detail={`${entryProfile ? format(entryProfile.maxHp) : '—'} HP · ${entryProfile ? format(entryProfile.planningDps) : '—'} DPS`} />
        <MetricCard label="Biomes represented" value={biomeRows.length} detail={`${encounters.filter((row) => !row.isBoss).length} authored encounters`} />
        <MetricCard label="Threat spread" value={`${format(maxSpread)}×`} detail="weakest → strongest biome" tone={maxSpread >= 4 ? 'warning' : 'default'} />
        <MetricCard label="Entry blockers" value={blocked} detail="analytical signals, not verdicts" tone={blocked > 0 ? 'danger' : 'default'} />
      </div>

      {progressionPolicy && progressionRows.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2"><CardTitle>Declared Progression · T{tier}</CardTitle><Badge variant="secondary">{progressionPolicy.status}</Badge></div>
                <p className="text-sm text-red-100/45">{progressionPolicy.name}. Overall pressure is an analytical encounter-burden proxy until runtime benches replace it.</p>
              </div>
              <Badge variant="warning">Plains locked</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-5 gap-2">
              {progressionRows.map((row, index) => (
                <div key={row.biomeId} className="relative rounded-lg border border-red-950/70 bg-black/15 p-3">
                  {index > 0 && <span className="absolute -left-3 top-1/2 z-10 -translate-y-1/2 text-orange-400">→</span>}
                  <div className="flex items-center justify-between gap-2"><span className="font-semibold text-orange-50">{row.biomeName}</span><ProgressionBadge fit={row.fit} /></div>
                  <div className="mt-2 text-2xl font-semibold text-orange-100">{format(row.currentVsBaseline)}×</div>
                  <div className="text-xs text-red-100/35">vs locked Plains · {percent(row.encounterBurdenPctHp)} HP burden</div>
                  {row.minimumVsBaseline !== null && <div className="mt-2 text-xs text-orange-200/70">minimum {format(row.minimumVsBaseline)}×</div>}
                </div>
              ))}
            </div>
            <div className="admin-scrollbar overflow-x-auto rounded-lg border border-red-950/70">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-[#180606] text-xs uppercase tracking-wide text-red-200/40"><tr><Th>Biome</Th><Th>Fit</Th><Th>Overall vs Plains</Th><Th>Encounter burden</Th><Th>Incoming DPS</Th><Th>Planning TTK</Th><Th>Worst spike</Th><Th>Density</Th></tr></thead>
                <tbody>{progressionRows.map((row) => <tr key={row.biomeId} className="border-t border-red-950/60"><Td><span className="font-semibold text-orange-50">{row.biomeName}</span>{row.locked && <span className="ml-2 text-xs text-red-100/35">locked</span>}</Td><Td><ProgressionBadge fit={row.fit} /></Td><Td>{format(row.currentVsBaseline)}×</Td><Td>{percent(row.encounterBurdenPctHp)} HP</Td><Td>{format(row.meanIncomingDps)}</Td><Td>{seconds(row.meanPlanningTtkSec)}</Td><Td>{percent(row.worstSpikePctHp)}</Td><Td>{row.density ?? '—'}</Td></tr>)}</tbody>
              </table>
            </div>
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-200/40">Hand-authoring briefs</h4>
              <div className="grid grid-cols-5 gap-2">
                {progressionPolicy.authoringBriefs.map((brief) => (
                  <div key={brief.biomeId} className="rounded-lg border border-red-950/70 bg-black/15 p-3">
                    <div className="font-semibold capitalize text-orange-50">{brief.biomeId}</div>
                    <p className="mt-1 text-xs leading-relaxed text-red-100/55">{brief.identity}</p>
                    <p className="mt-2 text-xs text-orange-200/65"><span className="font-semibold">Player test:</span> {brief.playerTest}</p>
                    <div className="mt-2 flex flex-wrap gap-1">{brief.mechanicLevers.map((lever) => <Badge key={lever} variant="secondary">{lever}</Badge>)}</div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-red-100/40">Burden estimates damage received during one average encounter. Read its component columns before proposing changes: a biome can be hard through attrition, durability, spikes, density, or mechanics.</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>World Overview · T{tier}</CardTitle>
            <p className="text-sm text-red-100/45">Threat is relative to the tier median. Reward efficiency is comparative, not a target.</p>
          </div>
          <select
            aria-label="Sort world overview"
            className="h-10 rounded-md border border-red-900/80 bg-[#0f0303]/80 px-3 text-sm text-orange-50"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
          >
            <option value="threat">Sort: threat</option>
            <option value="hp">Sort: health</option>
            <option value="reward">Sort: reward efficiency</option>
          </select>
        </CardHeader>
        <CardContent>
          <div className="admin-scrollbar overflow-x-auto rounded-lg border border-red-950/70">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-[#180606] text-xs uppercase tracking-wide text-red-200/40">
                <tr>
                  <Th>Biome</Th><Th>Signal</Th><Th>Threat</Th><Th>HP mean/max</Th><Th>Incoming mean/max</Th><Th>Worst spike</Th><Th>Density</Th><Th>Essence / XP</Th><Th>Reward ÷ threat</Th><Th>Drift</Th>
                </tr>
              </thead>
              <tbody>
                {biomeRows.map((row) => <BiomeRow key={row.biomeId} row={row} />)}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)] gap-4">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Encounter Roster</CardTitle>
                <p className="text-sm text-red-100/45">Select an encounter to inspect authored and derived values.</p>
              </div>
              <label className="flex items-center gap-2 text-sm text-red-100/55">
                <input type="checkbox" checked={bossesOnly} onChange={(event) => setBossesOnly(event.target.checked)} /> Bosses only
              </label>
            </div>
            <div className="relative pt-2">
              <Search className="pointer-events-none absolute left-3 top-5 h-4 w-4 text-red-200/30" />
              <Input className="pl-9" placeholder="Search monster, biome, role, mechanic…" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="admin-scrollbar max-h-[580px] overflow-auto rounded-lg border border-red-950/70">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-[#180606] text-xs uppercase text-red-200/40">
                  <tr><Th>Encounter</Th><Th>Role</Th><Th>HP</Th><Th>Raw DPS</Th><Th>Player TTL</Th><Th>Planning TTK</Th></tr>
                </thead>
                <tbody>
                  {encounters.map((row) => (
                    <tr
                      key={`${row.monsterId}-${row.biomeTier}`}
                      className={`cursor-pointer border-t border-red-950/60 transition-colors hover:bg-red-950/30 ${selected?.monsterId === row.monsterId ? 'bg-orange-500/10' : ''}`}
                      onClick={() => setSelectedMonsterId(row.monsterId)}
                    >
                      <Td><div className="font-medium text-orange-50">{row.name}</div><div className="text-xs text-red-100/35">{row.biomeName}{row.isBoss ? ' · boss' : row.isElite ? ' · elite' : row.poolWeight > 1 ? ` · weight ${row.poolWeight}` : ''}</div></Td>
                      <Td>{row.role}</Td><Td>{format(row.hp)}</Td><Td>{format(row.rawDps)}</Td><Td>{seconds(row.playerTtlSec)}</Td><Td>{seconds(row.planningTtkSec)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {encounters.length === 0 && <div className="p-8 text-center text-sm text-red-100/40">No encounters match these filters.</div>}
            </div>
          </CardContent>
        </Card>

        <EncounterInspector encounter={selected} />
      </div>

      <Card>
        <CardContent className="grid grid-cols-3 gap-4 p-4 text-xs text-red-100/45">
          {snapshot.caveats.map((caveat) => <p key={caveat}>{caveat}</p>)}
        </CardContent>
      </Card>
    </div>
  );
}

function BiomeRow({ row }: { row: BalanceLabBiomeRow }) {
  return (
    <tr className="border-t border-red-950/60">
      <Td><div className="font-semibold text-orange-50">{row.biomeName}</div><div className="text-xs text-red-100/35">{row.uniqueMonsters} types · {row.rosterSize} pool slots</div></Td>
      <Td><StatusBadge status={row.status} /></Td>
      <Td><div className="flex items-center gap-2"><div className="h-2 w-20 overflow-hidden rounded-full bg-red-950"><div className="h-full bg-orange-400" style={{ width: `${Math.min(100, row.threatIndex * 45)}%` }} /></div><span className="font-mono">{format(row.threatIndex)}×</span></div></Td>
      <Td>{format(row.meanHp)} / {format(row.maxHp)}</Td>
      <Td>{format(row.meanIncomingDps)} / {format(row.maxIncomingDps)}</Td>
      <Td><div>{percent(row.worstSpikePctHp)}</div><div className="max-w-36 truncate text-xs text-red-100/35" title={row.worstSpikeMonster}>{row.worstSpikeMonster}</div></Td>
      <Td>{row.density ?? '—'}</Td>
      <Td>{format(row.meanEssence)} / {format(row.meanBiomeXp)}</Td>
      <Td>{format(row.rewardThreatRatio)}</Td>
      <Td>{row.deviationSignals > 0 ? <Badge variant="warning">{row.deviationSignals} signals</Badge> : <span className="text-emerald-300/70">within siblings</span>}</Td>
    </tr>
  );
}

function EncounterInspector({ encounter }: { encounter: BalanceLabEncounterRow | null }) {
  if (!encounter) return <Card><CardContent className="p-8 text-center text-red-100/40">Select an encounter.</CardContent></Card>;
  return (
    <Card className="self-start">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div><CardTitle>{encounter.name}</CardTitle><p className="text-sm text-red-100/45">{encounter.biomeName} T{encounter.biomeTier} · {encounter.role} · {encounter.damageType}</p></div>
          <StatusBadge status={encounter.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-3 gap-2">
          <MiniMetric icon={<ShieldAlert className="h-4 w-4" />} label="Player TTL" value={seconds(encounter.playerTtlSec)} />
          <MiniMetric icon={<Swords className="h-4 w-4" />} label="Planning TTK" value={seconds(encounter.planningTtkSec)} />
          <MiniMetric icon={<Skull className="h-4 w-4" />} label="Spike" value={percent(encounter.spikePctHp)} />
        </div>
        <section><h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-200/40">Authored combat</h4><DefinitionGrid rows={[
          ['HP', format(encounter.hp)], ['Attack', format(encounter.attack)], ['APS', format(encounter.attacksPerSecond)], ['Raw DPS', format(encounter.rawDps)], ['DoT DPS', format(encounter.dotDps)], ['Spike multiplier', `${format(encounter.spikeMultiplier)}×`], ['Plating', format(encounter.plating)], ['Damage reduction', percent(encounter.damageReduction)], ['Speed', format(encounter.speed)], ['Range', format(encounter.range)],
        ]} /></section>
        <section><h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-200/40">Rewards</h4><DefinitionGrid rows={[
          ['Essence', format(encounter.essence)], ['Biome XP', format(encounter.biomeXp)], ['Catalyst weight', format(encounter.catalystWeight)], ['Pool weight', String(encounter.poolWeight)],
        ]} /></section>
        <section><h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-200/40">Mechanics</h4><div className="flex flex-wrap gap-2">{encounter.specials.length > 0 ? encounter.specials.map((special) => <Badge key={special} variant="secondary">{special}</Badge>) : <span className="text-sm text-red-100/40">No special mechanics.</span>}</div></section>
      </CardContent>
    </Card>
  );
}

function DefinitionGrid({ rows }: { rows: Array<[string, string]> }) {
  return <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-red-950/70 bg-black/15 p-3">{rows.map(([label, value]) => <div key={label} className="flex items-center justify-between gap-2 border-b border-red-950/40 pb-1"><dt className="text-xs text-red-100/40">{label}</dt><dd className="font-mono text-sm text-orange-50">{value}</dd></div>)}</dl>;
}

function MetricCard({ label, value, detail, tone = 'default' }: { label: string; value: string | number; detail: string; tone?: 'default' | 'warning' | 'danger' }) {
  const toneClass = tone === 'danger' ? 'text-red-300' : tone === 'warning' ? 'text-orange-300' : 'text-orange-50';
  return <Card><CardContent className="p-4"><div className="text-xs uppercase tracking-wide text-red-200/40">{label}</div><div className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</div><div className="mt-1 text-xs text-red-100/35">{detail}</div></CardContent></Card>;
}

function MiniMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-lg border border-red-950/70 bg-black/15 p-3"><div className="flex items-center gap-1 text-red-200/40">{icon}<span className="text-[10px] uppercase">{label}</span></div><div className="mt-1 font-mono text-lg text-orange-50">{value}</div></div>;
}

function StatusBadge({ status }: { status: BalanceLabThreatStatus }) {
  if (status === 'Blocked') return <Badge variant="danger">Blocked</Badge>;
  if (status === 'Risky') return <Badge variant="warning">Risky</Badge>;
  return <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-200">Safe</Badge>;
}

function ProgressionBadge({ fit }: { fit: BalanceLabProgressionFit }) {
  if (fit === 'Locked baseline') return <Badge variant="secondary">Baseline</Badge>;
  if (fit === 'Fits declared intent') return <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-200">Fits</Badge>;
  return <Badge variant="danger">{fit}</Badge>;
}

function Th({ children }: { children: React.ReactNode }) { return <th className="whitespace-nowrap px-3 py-3">{children}</th>; }
function Td({ children }: { children: React.ReactNode }) { return <td className="px-3 py-3 text-red-100/70">{children}</td>; }
function format(value: number): string { return Math.abs(value) >= 100 ? value.toFixed(0) : Math.abs(value) >= 10 ? value.toFixed(1) : value.toFixed(2); }
function percent(value: number): string { return `${format(value * 100)}%`; }
function seconds(value: number | null): string { return value === null ? 'survives' : `${format(value)}s`; }
