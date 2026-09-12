/** A study changes one declared input, with all other runner settings shared. */
export function validateStudy(value) {
  if (!value || value.schemaVersion !== 1 || !["route", "policy", "choice"].includes(value.factor) ||
      !Array.isArray(value.arms) || value.arms.length < 2 || value.arms.length > 8) {
    throw new Error("study requires schemaVersion 1, factor route|policy|choice, and 2..8 arms");
  }
  const allowed = (obj, keys) => {
    for (const k of Object.keys(obj)) if (!keys.includes(k)) throw new Error(`unknown study field ${k}`);
  };
  allowed(value, ["schemaVersion", "question", "factor", "choiceId", "arms"]);
  if (typeof value.question !== "string" || !value.question.trim()) throw new Error("study needs a question");
  const id = x => typeof x === "string" && /^[a-z][a-z0-9-]*$/.test(x);
  if (value.factor === "choice" && !id(value.choiceId)) throw new Error("choice study needs choiceId");
  const arms = value.arms.map(a => {
    allowed(a, ["id", "route", "policy", "choices"]);
    if (![a.id, a.route, a.policy].every(id)) throw new Error("invalid arm ID, route or policy");
    const choices = a.choices ?? {};
    if (!choices || typeof choices !== "object" || Array.isArray(choices) ||
        Object.entries(choices).some(([k, v]) => !id(k) || !id(v))) throw new Error("invalid arm choices");
    return { id: a.id, route: a.route, policy: a.policy, choices: Object.fromEntries(Object.entries(choices).sort()) };
  });
  if (new Set(arms.map(a => a.id)).size !== arms.length) throw new Error("duplicate arm IDs");
  const fixed = a => JSON.stringify({ route: value.factor === "route" ? null : a.route,
    policy: value.factor === "policy" ? null : a.policy,
    choices: Object.fromEntries(Object.entries(a.choices).filter(([k]) => value.factor !== "choice" || k !== value.choiceId)) });
  if (arms.some(a => fixed(a) !== fixed(arms[0]))) throw new Error("study changes more than the declared factor");
  const treatment = a => value.factor === "choice" ? a.choices[value.choiceId] : a[value.factor];
  if (arms.some(a => !treatment(a)) || new Set(arms.map(treatment)).size !== arms.length) throw new Error("arms must have distinct explicit treatments");
  return { schemaVersion: 1, question: value.question, factor: value.factor, ...(value.factor === "choice" ? { choiceId: value.choiceId } : {}), arms };
}
