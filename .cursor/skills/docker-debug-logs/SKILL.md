---
name: docker-debug-logs
description: Routes browser/client debug logs through the repo's Vite debug bridge instead of the Cursor debug endpoint. Use when adding browser or client-side debug logging while running in Docker dev mode (client served through Docker/Vite).
---

# Docker Debug Logs

When adding browser/client debug logs in Docker dev mode, do NOT POST directly to the Cursor debug endpoint at `127.0.0.1:7438`. The browser is served through Docker/Vite, so that endpoint is not reachable from the page. Use the repo's Vite debug bridge instead.

## How to log

POST to the relative `/__debug_ingest` path so the request goes through Vite:

```js
fetch('/__debug_ingest', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Debug-Session-Id': '<YOUR_DEBUG_SESSION_ID>',
  },
  body: JSON.stringify({
    sessionId: '<YOUR_DEBUG_SESSION_ID>',
    runId: '<RUN_ID>',
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
  }),
}).catch(() => {});
```

## Rules

- Replace `<YOUR_DEBUG_SESSION_ID>` with that agent's current debug session ID, not `4398d2`.
- The Vite middleware writes to `.cursor/debug-<sessionId>.log`, so each agent's logs land in their own session file.
- Never POST browser debug logs directly to `127.0.0.1:7438` in Docker dev mode.
- Use the relative `/__debug_ingest` path (not an absolute host) so the request is served through Docker/Vite.
