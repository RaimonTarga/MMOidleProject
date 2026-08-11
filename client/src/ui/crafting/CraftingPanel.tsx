import { useAtomValue } from 'jotai';
import { MakeTab } from './MakeTab';
import { UpgradeTab } from './UpgradeTab';
import { playerIdAtom } from '../../hud/atoms';
import { DialogHeader, DialogTab, DialogTabs, GameDialog } from '../../hud/primitives';
import { GameIcon } from '../GameIcon';
import { craftingSectionIconSource, type CraftingSectionIcon } from '../systemIcons';
import '../crafting.css';

/**
 * Crafting owns everything the player *makes*. The `make` tab covers gear and
 * technique recipes alike; `upgrade` is separate because it acts on owned items
 * rather than recipes.
 *
 * A third `progress` tab used to report biome mastery. It went when its two
 * jobs found better homes: biome levels are the Mastery dialog's (V4), and the
 * locked-recipe ladder is the craft list's, behind its "Show locked" filter.
 * Its third section listed "ultimate" gear, a scrapped feature whose recipes
 * were never registered and have since been deleted outright.
 *
 * The tab id stays `make` while the label reads "Craft": the id is persisted in
 * the craft-tab atom and the overlay stack, and renaming it would buy nothing a
 * player can see.
 */
export type CraftTab = 'make' | 'upgrade';

const SECTIONS: { tab: CraftTab; label: string; icon: CraftingSectionIcon }[] = [
  { tab: 'make', label: 'Craft', icon: 'forge' },
  { tab: 'upgrade', label: 'Upgrade', icon: 'upgrade' },
];

interface Props {
  tab: CraftTab;
  onTabChange: (tab: CraftTab) => void;
  onClose: () => void;
}

export function CraftingPanel({ tab, onTabChange, onClose }: Props) {
  const playerId = useAtomValue(playerIdAtom);

  return (
    <GameDialog size="wide" className="crafting-dialog" onClose={onClose}>
      <DialogHeader
        title="Crafting"
        icon={
          <GameIcon
            source={craftingSectionIconSource('forge')}
            size={22}
            fallback={null}
            decorative
          />
        }
        closeLabel="Close crafting"
      />
      <DialogTabs label="Crafting sections">
        {SECTIONS.map((section) => (
          <DialogTab
            key={section.tab}
            selected={tab === section.tab}
            controls={`craft-panel-${section.tab}`}
            icon={
              <GameIcon
                source={craftingSectionIconSource(section.icon)}
                size={18}
                fallback={null}
                decorative
              />
            }
            onSelect={() => onTabChange(section.tab)}
          >
            {section.label}
          </DialogTab>
        ))}
      </DialogTabs>

      {/* The modifier is what lets Craft own its own scrolling (the recipe list
          scrolls, the craft controls stay put) while Upgrade keeps scrolling as
          one page — it has no persistent control to protect. */}
      <div
        id={`craft-panel-${tab}`}
        className={`crafting-dialog__content crafting-dialog__content--${tab}`}
        role="tabpanel"
      >
        {playerId ? (
          tab === 'make' ? <MakeTab /> : <UpgradeTab />
        ) : (
          <div className="craft-empty">Not connected.</div>
        )}
      </div>
    </GameDialog>
  );
}
