# Project Brief — Cooperative MMO Idle Game

Use this document as the opening prompt / context for a new conversation focused on project setup and environment configuration.

---

## Project overview

I'm building a browser-based hobbyist game that mixes MMORPG and incremental/idle game mechanics.

**Core concept:**

- 2D, sprite-based, top-down view.
- The world is made up of **nodes / tiles**, each of which is its own **instance**. Players in the same node see each other.
- Player characters move **automatically** around an area inside their current node, fighting NPC monsters to grow stronger.
- Movement is **freeform** (not tile-based), with no complex Z levels.
- Combat is **automatic** — the player builds the character and makes strategic decisions, but doesn't twitch-dodge or parry. This means low refresh rates are acceptable and netcode can be simple.
- Players can **see other players** and **party up** with them.
- **No PvP.** The game is purely cooperative.

**Scope:**

- Hobbyist project — I'm making this to play with friends.
- Target ceiling: **~100 concurrent players**. We do NOT design for thousands of players. If the game ever grows past that scope, we'll re-architect then.
- I'll be using LLMs (Claude) to write most of the code, so the stack was chosen to maximize LLM training-data coverage and idiomatic-pattern density.

**My background:**

- Comfortable with JavaScript / TypeScript.
- Limited backend expertise — I trust the LLM's judgment on architecture decisions.

---

## Tech stack (decided)

**Language**

- **TypeScript** on both client and server. Shared types live in a shared package so client and server agree on entity shapes, socket message payloads, and game balance constants.

**Client**

- **Phaser 3** as the 2D game framework (handles sprites, animation, input, camera, scenes, tweens).
- **No React.** In-game UI is built with Phaser; login / character-select pages are plain HTML.
- **Vite** as the build tool and dev server.
- Placeholder colored rectangles for art for now — real sprites/assets to be decided later.

**Server**

- **Node.js + Express** for HTTP routes (auth, account/character management, etc.).
- **Socket.IO** for realtime player presence, with **one Socket.IO room per node instance**. Players in the same node see each other's positions/actions; leaving a node = leaving the room.
- Server tick rate to be decided during implementation (likely 1–5 Hz given automatic combat).

**Database**

- **SQLite** (single file on the VPS — easy backup, no separate DB process).
- **Drizzle ORM** for type-safe queries and migrations.

**Auth**

- **Discord OAuth.** No passwords to manage, everyone playing has Discord, free username + avatar.

**Hosting (eventual deployment target)**

- **Hetzner CX22** VPS (~€4/month) running Linux.
- **Caddy** as reverse proxy (automatic HTTPS via Let's Encrypt).
- **PM2** to keep the Node process alive and restart on crash.

**Project layout**

- **pnpm workspaces** monorepo with three packages:
  - `client/` — Phaser game + Vite build
  - `server/` — Express + Socket.IO + Drizzle
  - `shared/` — TypeScript types and constants used by both sides

---