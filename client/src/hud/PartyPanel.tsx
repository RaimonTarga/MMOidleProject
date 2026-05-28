import { useAtomValue } from "jotai";
import { hudBus } from "../hudBus";
import { partyAtom, playerIdAtom, zonePlayersAtom } from "./atoms";
import "./hud.css";

export function PartyPanel() {
  const playerId = useAtomValue(playerIdAtom);
  const party = useAtomValue(partyAtom);
  const zonePlayers = useAtomValue(zonePlayersAtom);

  if (!playerId) return null;

  const myLeaderId = party?.leaderId ?? null;
  const others = zonePlayers.filter((zp) => zp.id !== playerId);

  return (
    <div className="sidebar-panel">
      <div className="panel-title">Party</div>

      {party ? (
        <>
          <div className="stat-section">
            {party.members.map((m) => {
              const isLeader = m.id === party.leaderId;
              return (
                <div className="stat-row" key={m.id}>
                  <span className="stat-label">
                    {isLeader ? "★ " : ""}
                    {m.name}
                    {m.id === playerId ? " (you)" : ""}
                  </span>
                  <span className="stat-value" style={{ color: isLeader ? "#ffcc44" : undefined }}>
                    {isLeader ? "Leader" : "Member"}
                  </span>
                </div>
              );
            })}
          </div>
          <button
            className="auto-btn"
            style={{ marginTop: 6 }}
            onClick={() => hudBus.requestLeaveParty()}
          >
            {myLeaderId === playerId ? "DISBAND PARTY" : "LEAVE PARTY"}
          </button>
        </>
      ) : (
        <div className="stat-section">
          <div className="stat-row">
            <span className="stat-label" style={{ color: "#33334a", fontSize: 10 }}>
              Not in a party
            </span>
          </div>
        </div>
      )}

      <div className="panel-title" style={{ marginTop: 10 }}>
        In Zone
      </div>
      <div className="stat-section">
        {others.length === 0 && (
          <div className="stat-row">
            <span className="stat-label" style={{ color: "#33334a", fontSize: 10 }}>
              No other players here
            </span>
          </div>
        )}
        {others.map((zp) => {
          const alreadyInMyParty = myLeaderId !== null && zp.partyLeaderId === myLeaderId;
          const leadsAParty = zp.partyLeaderId === zp.id;
          return (
            <div
              className="stat-row"
              key={zp.id}
              style={{ alignItems: "center" }}
            >
              <span className="stat-label">
                {leadsAParty ? "★ " : ""}
                {zp.name}
              </span>
              {alreadyInMyParty ? (
                <span className="stat-value" style={{ color: "#44ff88", fontSize: 10 }}>
                  In party
                </span>
              ) : (
                <button
                  className="auto-btn"
                  style={{ width: "auto", padding: "2px 10px", marginTop: 0, fontSize: 10 }}
                  onClick={() => hudBus.requestJoinParty(zp.id)}
                >
                  JOIN
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
