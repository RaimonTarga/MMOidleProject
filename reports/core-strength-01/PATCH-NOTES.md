# Core strength pass — experimental patch notes

These changes follow defense candidate `9159de97`; they are not deployed. Volcano encounters and hazards are outside this pass. The only edit in the Volcanic recipe file concerns Catalyst Core.

## Retained changes

- **Force:** damage bonus increases from 18% to **22%**. No maximum-HP penalty.
- **Scout:** damage bonus increases from 12% to **18%**. Retains +25% movement and 25% mobility cooldown reduction, with no maximum-HP penalty.
- **Sniper:** damage bonus increases from 25% to **30%**. No maximum-HP or plating penalties.
- **Catalyst:** removes the **15% generic damage penalty**. Retains +115% existing on-hit damage; grants no on-hit damage to a build without it. Corrected its description/comments so they no longer imply armor bypass.
- **Bruiser and Duelist:** unchanged. Their melee health bonuses and existing offensive identities remain intact.

Against the pre-redesign game, Force retains its original 22% damage while losing the HP penalty; Scout changes from 24% to 18% damage and loses its HP penalty; Sniper changes from 40% to 30% damage and loses both HP/plating penalties. This pass's paired tests compare against the already HP-repaired defense candidate, not the production game.

## Tested, then reverted

- **Juggernaut:** tested 20% → 30% HP. Reverted to the defense candidate's 20%; the eight baseline cases already had no deaths and never fell below 72.8% HP. Clear outcomes and times did not change. This is not a recommendation to import the wider defense candidate's Juggernaut nerf into production independently.
- **Controller:** tested debuff potency 25% → 40%, keeping duration at 35%. Reverted: the general and Frost-specialist samples showed no meaningful improvement. Its role and effect coverage need attention before another coefficient increase.
- **Tempered, Survivalist, Arcanist and Accelerant:** unchanged. The screen does not establish a need for universal buffs.

## New core concepts — proposed, not implemented

- **Warden:** amplifies equipped Guards, starting with potency alone. No free Guard, HP, plating, automatic heal or simultaneous offensive bonus. Avoid adding cooldown reduction in its first experiment; test against excessive Guard stacking with Mountain armor. Intended for builds that invest in timed protection and accept losing an offensive core.
- **Affliction:** amplifies existing outgoing DoT damage without creating a DoT, extending control effects or affecting incoming damage debt. A provisional +35% DoT-only damage candidate could be compared against Force's +22% general damage on the same build. This fills a different role from Controller, which scales a named debuff registry rather than every poison/burn effect.

Neither concept has bot evidence yet. Start with Warden if the priority remains defensive choice; Affliction is the clearer missing offensive specialization.
