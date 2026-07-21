import { useAtomValue } from 'jotai';
import { BiomeTab } from './BiomeTab';
import { ForgeTab } from './ForgeTab';
import { UpgradeTab } from './UpgradeTab';
import { playerIdAtom } from '../../hud/atoms';
import { DialogHeader, DialogTab, DialogTabs, GameDialog } from '../../hud/primitives';
import '../crafting.css';

export type CraftTab = 'biome' | 'forge' | 'upgrade';

interface Props {
  tab: CraftTab;
  onTabChange: (tab: CraftTab) => void;
  onClose: () => void;
}

export function CraftingPanel({ tab, onTabChange, onClose }: Props) {
  const playerId = useAtomValue(playerIdAtom);

  return (
    <GameDialog size="compact" className="crafting-dialog" onClose={onClose}>
      <DialogHeader title="Crafting" closeLabel="Close crafting" />
      <DialogTabs label="Crafting sections">
        <DialogTab selected={tab === 'biome'} controls="craft-panel-biome" onSelect={() => onTabChange('biome')}>
          Biome Progress
        </DialogTab>
        <DialogTab selected={tab === 'forge'} controls="craft-panel-forge" onSelect={() => onTabChange('forge')}>
          Forge
        </DialogTab>
        <DialogTab selected={tab === 'upgrade'} controls="craft-panel-upgrade" onSelect={() => onTabChange('upgrade')}>
          Upgrade
        </DialogTab>
      </DialogTabs>

      <div id={`craft-panel-${tab}`} className="crafting-dialog__content" role="tabpanel">
        {playerId ? (
          tab === 'biome'
            ? <BiomeTab />
            : tab === 'forge'
              ? <ForgeTab />
              : <UpgradeTab />
        ) : (
          <div className="craft-empty">Not connected.</div>
        )}
      </div>
    </GameDialog>
  );
}
