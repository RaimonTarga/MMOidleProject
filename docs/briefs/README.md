# Briefs and evidence

This directory is a dated evidence set, not a second current-state source. It
contains operator packets, implementation ledgers, experiment reports,
handoffs, audits, and raw-study sidecars. Most files are intentionally retained
because they preserve what was measured at a particular source revision.

Use these rules:

- Read the status block at the top of a brief. OPEN, READY, or NOT LAUNCHED
  means it may still be an operating input; COMPLETE, CLOSED, SUPERSEDED,
  HISTORICAL, or a finished report means it is evidence.
- Check the branch, source revision, manifest, and raw-artifact path before
  applying a conclusion. A report is scoped to the matchup and endpoint it
  actually measured.
- Never use an old packet to infer current mechanics when the source or a
  current-state page has changed.
- Keep failed, censored, and not-run rows. They are part of the receipt and
  should not be rewritten as success.
- Move a completed plan into docs/archive/ only when its durable facts have
  been folded into a current-state page. Keep dated measurements here or in
  docs/archive/briefs/ when they remain useful as historical evidence.
- New feature ideas belong in docs/future-plans.md. New mechanics need a
  current-state page after they ship.

The current operational entry point is
[playtest-followup-command-center-2026-09-25.md](playtest-followup-command-center-2026-09-25.md).
The root [documentation index](../README.md) intentionally links only to
active or high-value briefs; the rest are searchable evidence, not implied
work orders.
