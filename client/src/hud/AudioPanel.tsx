import { useId, useState } from 'react';
import { useAtomValue } from 'jotai';
import { HudPanel, DisclosureHeader } from './primitives';
import { musicMutedAtom, musicVolumeAtom, sfxMutedAtom, sfxVolumeAtom } from '../audio/audioSettings';
import { setMusicMuted, setMusicVolume, setSfxMuted, setSfxVolume } from '../audio/audioEngine';
import './audioPanel.css';

const EXPANDED_KEY = 'mmo_idle.desktop.audio_expanded';
export function AudioPanel() {
  const [expanded, setExpanded] = useState(() => {
    try { return localStorage.getItem(EXPANDED_KEY) !== 'false'; } catch { return true; }
  });
  const detailsId = useId();
  const music = useAtomValue(musicVolumeAtom);
  const sfx = useAtomValue(sfxVolumeAtom);
  const musicMuted = useAtomValue(musicMutedAtom);
  const sfxMuted = useAtomValue(sfxMutedAtom);
  const toggle = () => setExpanded(previous => {
    const next = !previous;
    try { localStorage.setItem(EXPANDED_KEY, String(next)); } catch { /* Session-only disclosure. */ }
    return next;
  });
  return <HudPanel className="sidebar-panel audio-panel">
    <DisclosureHeader className="panel-title panel-title--collapsible" title="Audio"
      expanded={expanded} controls={detailsId} onToggle={toggle} />
    {expanded && <div id={detailsId} className="audio-panel__controls">
      <div className="audio-panel__row">
        <label>Music <input aria-label="Music volume" type="range" min="0" max="1" step="0.05"
          value={music} onChange={e => setMusicVolume(Number(e.target.value))} />
          <span>{Math.round(music * 100)}%</span></label>
        <label className="audio-panel__mute"><input type="checkbox" checked={musicMuted}
          onChange={e => setMusicMuted(e.target.checked)} />Mute music</label>
      </div>
      <div className="audio-panel__row">
        <label>Effects <input aria-label="Sound effects volume" type="range" min="0" max="1" step="0.05"
          value={sfx} onChange={e => setSfxVolume(Number(e.target.value))} />
          <span>{Math.round(sfx * 100)}%</span></label>
        <label className="audio-panel__mute"><input type="checkbox" checked={sfxMuted}
          onChange={e => setSfxMuted(e.target.checked)} />Mute effects</label>
      </div>
    </div>}
  </HudPanel>;
}
