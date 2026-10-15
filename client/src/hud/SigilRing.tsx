import './sigilRing.css';

/** The Apprentice's three schools (bible §9.5): the sigils take their colour. */
export type SigilSchool = 'poison' | 'fire' | 'frost';

/** The school of a T2 discipline id (`apprentice-poison`), or null before the pick. */
export function sigilSchoolOf(disciplineId: string | null | undefined): SigilSchool | null {
  const school = disciplineId?.replace('apprentice-', '');
  return school === 'poison' || school === 'fire' || school === 'frost' ? school : null;
}

/** The mastery budget plus the weapon's already-resolved cap bonus. */
export function sigilCap(budget: number, passives: Record<string, number>): number {
  return Math.max(1, budget + Math.round(passives['apprentice.cap-extra'] ?? 0));
}

/** A neutral T1 ring: empty pips show room, filled pips show the enemy's sigils. */
export function SigilRing({ cap, stacks, enemy = false, school = null }: { cap: number; stacks: number; enemy?: boolean; school?: SigilSchool | null }) {
  const size = 72 + cap * 4;
  const center = size / 2;
  return (
    <svg
      className={`sigil-ring${school ? ` sigil-ring--${school}` : ''}`}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${stacks} of ${cap} sigils`}
    >
      {enemy && (
        <g className="sigil-ring__enemy" aria-hidden="true">
          <circle cx={center} cy={center - 11} r={9} />
          <path d={`M ${center - 16} ${center + 19} Q ${center - 15} ${center + 1} ${center} ${center + 1} Q ${center + 15} ${center + 1} ${center + 16} ${center + 19} Z`} />
        </g>
      )}
      {Array.from({ length: cap }, (_, index) => {
        const angle = (index / cap) * Math.PI * 2 - Math.PI / 2;
        return (
          <circle
            key={index}
            className={`sigil-ring__pip${index < stacks ? ' sigil-ring__pip--filled' : ''}`}
            cx={center + Math.cos(angle) * (center - 6)}
            cy={center + Math.sin(angle) * (center - 6)}
            r={3.5}
          />
        );
      })}
    </svg>
  );
}
