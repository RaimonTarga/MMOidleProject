import { useEffect, useId, useState, type CSSProperties } from "react";
import { useAtomValue } from "jotai";
import { hudBus } from "../hudBus";
import { partyAtom, playerIdAtom, zonePlayersAtom } from "./atoms";
import { DisclosureHeader, HudPanel } from "./primitives";
import "./party.css";

function countLabel(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

export function PartyPanel() {
  const playerId = useAtomValue(playerIdAtom);
  const party = useAtomValue(partyAtom);
  const zonePlayers = useAtomValue(zonePlayersAtom);
  const [partyExpanded, setPartyExpanded] = useState(false);
  const [nearbyExpanded, setNearbyExpanded] = useState(false);
  const partyDetailsId = useId();
  const nearbyDetailsId = useId();

  // Joining opens the roster; leaving returns the solo module to its compact
  // resting state. Roster updates within the same party respect the player's
  // disclosure choice.
  useEffect(() => {
    setPartyExpanded(party !== null);
  }, [party?.leaderId]);

  const myLeaderId = party?.leaderId ?? null;
  const hpById = new Map(zonePlayers.map((player) => [player.id, player]));
  const partyMemberIds = new Set(party?.members.map((member) => member.id));
  const nearbyPlayers = zonePlayers.filter((player) => player.id !== playerId);

  useEffect(() => {
    if (nearbyPlayers.length === 0) setNearbyExpanded(false);
  }, [nearbyPlayers.length]);

  if (!playerId) return null;

  const partySummary = party
    ? countLabel(party.members.length, "member")
    : "Solo";
  const nearbySummary = nearbyPlayers.length > 0
    ? countLabel(nearbyPlayers.length, "adventurer")
    : "None";

  return (
    <HudPanel className="sidebar-panel party-panel" data-ui-unlock-system="party">
      <DisclosureHeader
        className="panel-title panel-title--collapsible party-panel__header"
        title="Party"
        summary={partySummary}
        expanded={partyExpanded}
        controls={partyDetailsId}
        onToggle={() => setPartyExpanded((expanded) => !expanded)}
      />

      {partyExpanded && (
        <div id={partyDetailsId} className="party-panel__details">
          {party ? (
            <>
              <ul className="party-panel__roster" aria-label="Party roster">
                {party.members.map((member) => {
                  const isLeader = member.id === party.leaderId;
                  const isSelf = member.id === playerId;
                  const hpInfo = hpById.get(member.id);
                  const isNearby = hpInfo !== undefined;
                  const hasHp = !isSelf && isNearby && hpInfo.maxHp > 0;
                  const hpPct = hasHp
                    ? Math.max(0, Math.min(1, hpInfo.hp / hpInfo.maxHp)) * 100
                    : 0;
                  const hpStyle = { "--party-hp": `${hpPct}%` } as CSSProperties;

                  return (
                    <li className="party-panel__member" key={member.id}>
                      <div className="party-panel__member-line">
                        <span className="party-panel__member-name">
                          {member.name}
                          {isSelf && <span className="party-panel__you">You</span>}
                        </span>
                        {isLeader && (
                          <span
                            className="party-panel__role"
                            title="Party leader — can disband the party"
                          >
                            Leader
                          </span>
                        )}
                      </div>
                      <div className="party-panel__member-status">
                        <span
                          className={`party-panel__presence${isNearby || isSelf ? "" : " party-panel__presence--away"}`}
                        >
                          {isSelf ? "You are here" : isNearby ? "Here" : "Away"}
                        </span>
                        {hasHp && (
                          <span className="party-panel__hp-label">
                            {Math.ceil(hpInfo.hp)}/{hpInfo.maxHp} HP
                          </span>
                        )}
                      </div>
                      {hasHp && (
                        <div
                          className="party-panel__hp-track"
                          role="progressbar"
                          aria-label={`${member.name} health`}
                          aria-valuemin={0}
                          aria-valuemax={hpInfo.maxHp}
                          aria-valuenow={Math.max(0, hpInfo.hp)}
                        >
                          <div
                            className={`party-panel__hp-fill${hpPct <= 30 ? " party-panel__hp-fill--critical" : ""}`}
                            style={hpStyle}
                          />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                className="auto-btn party-panel__action"
                onClick={() => hudBus.requestLeaveParty()}
              >
                {myLeaderId === playerId ? "Disband party" : "Leave party"}
              </button>
            </>
          ) : null}
        </div>
      )}

      <div className="party-panel__nearby">
        <DisclosureHeader
          className="party-panel__nearby-header"
          title="Nearby"
          summary={nearbySummary}
          expanded={nearbyExpanded}
          controls={nearbyDetailsId}
          onToggle={() => setNearbyExpanded((expanded) => !expanded)}
        />

        {nearbyExpanded && (
          <div id={nearbyDetailsId} className="party-panel__nearby-details">
            {nearbyPlayers.length === 0 ? (
              <p className="party-panel__empty">No other adventurers in this node.</p>
            ) : (
              <ul className="party-panel__nearby-list" aria-label="Nearby adventurers">
                {nearbyPlayers.map((player) => {
                  const isPartyMember = partyMemberIds.has(player.id);
                  return (
                    <li className="party-panel__nearby-row" key={player.id}>
                      <span className="party-panel__nearby-name">{player.name}</span>
                      {isPartyMember ? (
                        <span className="party-panel__nearby-presence">In party</span>
                      ) : (
                        <button
                          type="button"
                          className="auto-btn party-panel__join"
                          aria-label={`Join ${player.name}'s party`}
                          onClick={() => hudBus.requestJoinParty(player.id)}
                        >
                          Join
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </HudPanel>
  );
}
