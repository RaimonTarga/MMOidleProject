import { useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import {
  BIOME_DATABASE,
  NODE_BIOMES,
  validateCharacterName,
  type CharacterSummary,
} from '@mmo-idle/shared';
import { loginWithDiscord } from '../net/session';
import {
  authMessageAtom,
  authPhaseAtom,
  characterActionBusyAtom,
  charactersAtom,
  createLobbyCharacter,
  deleteLobbyCharacter,
  selectLobbyCharacter,
  spectatorStatusAtom,
} from './lobbyState';
import './authGate.css';
import { CharacterPortrait } from './CharacterPortrait';

const relativeTime = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

function lastPlayedLabel(timestamp: number): string {
  if (!timestamp) return 'Never played';
  const seconds = Math.round((timestamp - Date.now()) / 1_000);
  const magnitude = Math.abs(seconds);
  if (magnitude < 60) return relativeTime.format(seconds, 'second');
  if (magnitude < 3_600) return relativeTime.format(Math.round(seconds / 60), 'minute');
  if (magnitude < 86_400) return relativeTime.format(Math.round(seconds / 3_600), 'hour');
  if (magnitude < 2_592_000) return relativeTime.format(Math.round(seconds / 86_400), 'day');
  return relativeTime.format(Math.round(seconds / 2_592_000), 'month');
}

function biomeLabel(nodeId: string): string {
  const node = NODE_BIOMES[nodeId];
  if (!node) return 'Unknown reaches';
  return BIOME_DATABASE.get(node.biomeGroup)?.name ?? node.displayName;
}

function CharacterCard({
  character,
  busy,
}: {
  character: CharacterSummary;
  busy: boolean;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const canDelete = confirmName.trim() === character.name;
  const archetype = character.combatArchetype ?? 'classless';

  return (
    <article className={`auth-character-card auth-character-card--${archetype}`}>
      <CharacterPortrait character={character} />
      <div className="auth-character-card__body">
        <div className="auth-character-card__heading">
          <div>
            <span className="auth-character-card__kicker">Adventurer</span>
            <h2>{character.name}</h2>
          </div>
          <div className="auth-character-card__class">
            <span>Current path</span>
            <strong>{character.classDisplayName}</strong>
          </div>
        </div>
        <div className="auth-character-card__details" aria-label="Character details">
          <div className="auth-character-card__stat auth-character-card__stat--mastery">
            <span>Global Mastery</span>
            <strong>{character.globalMastery}</strong>
          </div>
          <div className="auth-character-card__stat auth-character-card__stat--location">
            <span>Last known location</span>
            <strong>{biomeLabel(character.nodeId)}</strong>
          </div>
        </div>
        {confirmingDelete ? (
          <div className="auth-delete-confirm">
            <label htmlFor={`delete-${character.id}`}>
              Type <strong>{character.name}</strong> to delete
            </label>
            <input
              id={`delete-${character.id}`}
              value={confirmName}
              onChange={(event) => setConfirmName(event.target.value)}
              autoComplete="off"
              autoFocus
            />
            <div className="auth-delete-confirm__actions">
              <button
                type="button"
                className="auth-button auth-button--quiet"
                onClick={() => { setConfirmingDelete(false); setConfirmName(''); }}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="button"
                className="auth-button auth-button--danger"
                onClick={() => deleteLobbyCharacter(character.id)}
                disabled={busy || !canDelete}
              >
                Delete forever
              </button>
            </div>
          </div>
        ) : (
          <div className="auth-character-card__actions">
            <span className="auth-character-card__last-played">
              Last played {lastPlayedLabel(character.lastPlayedAt)}
            </span>
            <button
              type="button"
              className="auth-button auth-button--danger-link"
              onClick={() => setConfirmingDelete(true)}
              disabled={busy}
            >
              Delete
            </button>
            <button
              type="button"
              className="auth-button auth-button--primary"
              onClick={() => selectLobbyCharacter(character.id)}
              disabled={busy}
            >
              Enter World <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export function AuthGate() {
  const phase = useAtomValue(authPhaseAtom);
  const characters = useAtomValue(charactersAtom);
  const busy = useAtomValue(characterActionBusyAtom);
  const message = useAtomValue(authMessageAtom);
  const spectatorStatus = useAtomValue(spectatorStatusAtom);
  const [name, setName] = useState('');
  const validation = useMemo(() => validateCharacterName(name), [name]);

  if (phase === 'in-world') return null;

  if (phase === 'login') {
    const liveLabel = spectatorStatus?.paused
      ? 'LIVE PAUSED — click to resume'
      : spectatorStatus?.mode === 'player'
        ? `LIVE — watching ${spectatorStatus.targetName ?? 'an adventurer'}`
        : spectatorStatus?.mode === 'clearing'
          ? 'LIVE — the Clearing'
          : 'LIVE — connecting…';
    return (
      <div className="auth-gate auth-gate--landing">
        <main className="auth-login-panel">
          <div className="auth-login-panel__crest" aria-hidden="true">◇</div>
          <div className="auth-gate__eyebrow">A persistent world awaits</div>
          <h1>MMO Idle</h1>
          <div className="auth-gate__conduit" />
          <p>Build a hero, master a class, and leave your mark on a world that keeps moving.</p>
          <div className="auth-login-panel__traits" aria-hidden="true">
            <span>Persistent world</span>
            <span>Always moving</span>
          </div>
          {message && <div className="auth-message auth-message--error">{message}</div>}
          <button type="button" className="auth-button auth-button--discord" onClick={loginWithDiscord}>
            <img className="auth-button__discord-logo" src="/discord-symbol.svg" alt="" width="24" height="18" />
            <span>Sign in with Discord</span>
          </button>
          <div className="auth-login-panel__footnote">Your world continues between sessions.</div>
        </main>
        <aside className="auth-live-label" aria-live="polite">{liveLabel}</aside>
      </div>
    );
  }

  if (phase === 'connecting' || phase === 'entering') {
    return (
      <div className="auth-gate">
        <div className="auth-loading" role="status" aria-live="polite">
          <div className="auth-loading__sigil" aria-hidden="true">◇</div>
          <h1>{phase === 'entering' ? 'Entering the world' : 'Opening your roster'}</h1>
          <div className="auth-gate__conduit auth-gate__conduit--active" />
        </div>
      </div>
    );
  }

  return (
    <div className="auth-gate auth-gate--select">
      <main className="auth-roster">
        <header className="auth-roster__header">
          <div>
            <div className="auth-gate__eyebrow">Choose your path</div>
            <h1>Character Select</h1>
          </div>
          <span>{characters.length} {characters.length === 1 ? 'hero' : 'heroes'}</span>
        </header>
        <div className="auth-gate__conduit" />

        {message && <div className="auth-message" role="status">{message}</div>}

        <section className="auth-character-list" aria-label="Your characters">
          {characters.length === 0 ? (
            <div className="auth-empty-roster">
              <div aria-hidden="true">◇</div>
              <h2>Your story starts here</h2>
              <p>Create your first character. Your class is chosen later in the skill tree.</p>
            </div>
          ) : characters.map((character) => (
            <CharacterCard key={character.id} character={character} busy={busy} />
          ))}
        </section>

        <form
          className="auth-create-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!validation.ok || busy) return;
            createLobbyCharacter(validation.name);
            setName('');
          }}
        >
          <div>
            <label htmlFor="character-name">Create a new character</label>
            <p>Names can use letters, numbers, spaces, apostrophes, and hyphens.</p>
          </div>
          <div className="auth-create-form__controls">
            <input
              id="character-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Character name"
              maxLength={24}
              autoComplete="off"
            />
            <button type="submit" className="auth-button auth-button--primary" disabled={!validation.ok || busy}>
              Create
            </button>
          </div>
          {name && !validation.ok && <div className="auth-form-error">{validation.reason}</div>}
        </form>
      </main>
    </div>
  );
}
