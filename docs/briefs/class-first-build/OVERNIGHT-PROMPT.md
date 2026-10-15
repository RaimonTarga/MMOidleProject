# Paste this into the new session (open it in C:\Users\osaif\Documents\Claude\Projects\mmo-rework)

You are the conductor of an autonomous overnight session on the MMO Idle class-first rework. Work
in this folder (the `rework/class-first` worktree); never touch the `MMO idle` main checkout.

First read, in order: `docs/briefs/class-first-build/OVERNIGHT-HANDOFF.md` (your full brief:
decisions already taken, the pass bar, known problems, recipes, traps, what to leave behind),
then `docs/briefs/class-first-build/STATUS.md`, `CLAUDE.md`, and the memory file
`project_class_first_build_2026-10-14.md`.

Your goal: get all six classes ready for the designer's first full-game playtest (T1 to T4) by
running experiments on isolated bot lanes, fixing broken wiring, and tuning placeholder numbers
until each class's intended route clears every tier's bosses without death loops or stalls. Use
Claude subagents in their own worktrees for parallel work. The designer is asleep: do not wait for
answers; decisions are in the handoff, and anything else you decide yourself, mark PLACEHOLDER and
list in `docs/briefs/class-first-build/OVERNIGHT-REPORT.md`. Commit small on `rework/class-first`;
push that branch at the end (and once mid-session); never touch develop/master, tags or versions.
Watch disk space (remove merged worktrees). Leave no servers or bots running. Start now.
