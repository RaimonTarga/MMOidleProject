import { nodeName, nodeDescription } from './skillNodePresentation';
import { useState } from 'react';
import type { SkillNode } from '@mmo-idle/shared';
import { skillNodeLines, type DetailLine } from './describe';
import { SkillCharacterPreview } from './SkillCharacterPreview';
import { ClassIdentity } from './ClassIdentity';

export function SkillComparison({ nodes, primary, owned, onInspect }: { nodes: SkillNode[]; primary: SkillNode; owned: string[]; onInspect: (node: SkillNode) => void }) {
  const [leftId, setLeftId] = useState(primary.id);
  const [rightId, setRightId] = useState(nodes.find(n => n.id !== primary.id)?.id ?? primary.id);
  const selected = [nodes.find(n => n.id === leftId) ?? primary, nodes.find(n => n.id === rightId) ?? primary];
  const columns = selected.map(node => ({ node, ...skillNodeLines(node) }));
  const rows = (kind: 'stats' | 'mechanics') => {
    const lines = new Map<string, DetailLine>();
    for (const column of columns) for (const line of column[kind]) if (!lines.has(line.key)) lines.set(line.key, line);
    return [...lines.values()];
  };
  return <div className="skill-comparison">
    <p>Compare what each choice grants at this tier. These are node bonuses, not final character totals. “—” means this choice adds none of that effect. Shaded rows differ between choices.</p>
    <div className="skill-compare-selectors">
      <label>First choice<select value={leftId} onChange={e => setLeftId(e.target.value)}>{nodes.map(n => <option key={n.id} value={n.id}>{nodeName(n)}</option>)}</select></label>
      <label>Second choice<select value={rightId} onChange={e => setRightId(e.target.value)}>{nodes.map(n => <option key={n.id} value={n.id}>{nodeName(n)}</option>)}</select></label>
    </div>
    <table>
      <caption>Same-tier choice comparison</caption>
      <thead><tr><th scope="col">Choice</th>{columns.map(({ node }, index) => <th scope="col" key={index}>
        <SkillCharacterPreview node={node} owned={owned} />
        <button type="button" className="skill-compare-inspect" onClick={() => onInspect(node)}>Inspect {nodeName(node)}</button>
        <div>{node.cost} skill point{node.cost === 1 ? '' : 's'}{owned.includes(node.id) ? ' · Unlocked' : ''}</div>
      </th>)}</tr></thead>
      <tbody>
        <tr><th scope="row">Identity</th>{columns.map(({ node }, index) => <td key={index}><p>{nodeDescription(node)}</p>{node.tier === 0 && <ClassIdentity classId={node.classId ?? node.id} expanded />}</td>)}</tr>
        {(['stats', 'mechanics'] as const).map(kind => rows(kind).map(row => <tr key={`${kind}:${row.key}`} className={new Set(columns.map(c => { const line = c[kind].find(l => l.key === row.key); return line ? `${line.value}|${line.detail ?? ''}` : ''; })).size > 1 ? 'skill-comparison__different' : undefined}>
          <th scope="row">{row.label}{row.help && <details><summary>How it works</summary><p>{row.help}</p></details>}</th>
          {columns.map((column, index) => {
            const value = column[kind].find(line => line.key === row.key);
            return <td key={index}>{value ? <><strong>{value.value}</strong>{value.detail && <p>{value.detail}</p>}</> : <span aria-label="No contribution">—</span>}</td>;
          })}
        </tr>))}
      </tbody>
    </table>
  </div>;
}
