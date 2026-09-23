# Existing Duelist Volcano stall

Read-only review of corrected-baseline-followup-01, Duelist seed 101033 at 22a349bf. No new combat. Exact external sample path/hash and bounded extraction are in duelist-historical-stall.json.

Between the 300,000 and 600,000 ms endpoints, kills remained 35, useful HP damage 61,286, absorption 3,252 and damage events 353. Last damage and kill were at 161,100 ms. There were no unfinished damaged targets in the terminal survey. This is zero useful HP progress as well as zero kills, so the retained evidence does not support a durable-target damage explanation.

All 300 one-second samples in the last five minutes have a null attack target, OUT_OF_COMBAT state and an empty blocked-approach marker. Positions change at every sample, movement is present, Auto Intent requests an attack, and three selected navigation targets appear. The owner is full HP and barrier at both endpoints. This is consistent with ongoing approach/target-acquisition movement without attack delivery. It is not evidence of intentional waiting, productive farming, or a proven navigation root cause. Sampling is not proof of uninterrupted disengagement or exact Heat loss.

Carry this as a shared navigation/engagement watch item. The new run preserves target, position, motion, selected target, damage-progress gaps and terminal unfinished targets. If a comparable stall recurs, label its impact before making a class coefficient verdict; leave any correctness diagnosis/repair for a separate designer decision. Do not repair or rerun the sealed life.
