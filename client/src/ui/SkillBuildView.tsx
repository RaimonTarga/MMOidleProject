import { skillBuildSummary } from './skillBuildSummary';
import { skillNodeLines, passiveLines } from './describe';
import { DetailLines } from './describe/DetailLines';
import { ClassIdentity } from './ClassIdentity';
import { SkillCharacterPreview } from './SkillCharacterPreview';
import { SkillEmblem } from './SkillEmblem';

export function SkillBuildView({ owned }: { owned: string[] }) {
  const summary = skillBuildSummary(owned);
  const { stats } = skillNodeLines(summary);
  const mechanics = passiveLines(summary.mechanicEffects).map(line => ({ ...line, key: `passive:${line.key}` }));
  const latest = summary.nodes.at(-1);
  if (!latest) return <div className="skill-build-view"><h3>Your build starts here</h3><p>Choose a class to begin. Your unlocked choices and their combined bonuses will appear here.</p></div>;
  return <div className="skill-build-view">
    <div className="skill-build-intro">
      <SkillCharacterPreview node={latest} owned={owned} />
      <div><h3>Your passive build</h3><p>{summary.nodes.filter(n => !n.description.startsWith('[Placeholder]')).map(n => n.name).join(' → ')}</p>
        <p>Combined bonuses from unlocked tree choices. Equipment, stances and temporary effects are shown in your Character sheet.</p></div>
    </div>
    <ClassIdentity classId={latest.classId ?? latest.id} expanded={false} />
    <div className="skill-build-columns">
      <DetailLines title="Combined stat bonuses" lines={stats} empty="No stat bonuses yet." />
      <div>
        <DetailLines title="Defense & recovery" lines={mechanics.filter(l => l.key.startsWith('passive:defense.'))} explain />
        <DetailLines title="Combat & movement" lines={mechanics.filter(l => !l.key.startsWith('passive:defense.'))} explain />
      </div>
    </div>
    <h3>Your choices</h3>
    {summary.nodes.map(node => <details key={node.id} className="skill-build-choice">
      <summary><SkillEmblem node={node} size={24} />{node.description.startsWith('[Placeholder]') ? `Tier ${node.tier} · In development` : node.name}</summary>
      <p>{node.description.startsWith('[Placeholder]') ? 'This choice currently grants no effects.' : node.description}</p>
      <DetailLines title="Mechanics added by this choice" lines={skillNodeLines(node).mechanics} explain />
    </details>)}
  </div>;
}
