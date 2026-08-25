import { createServer, type Server } from "node:http";
import { DASHBOARD_HTML } from "./page";
import { botRegistry } from "./status";

/**
 * The bot runner's own dashboard.
 *
 * Read-only and local. It serves the bots' own state, so it needs no game-server
 * change and cannot leak anything a bot does not already legitimately see about
 * itself. Binds to loopback so it is not reachable off the machine.
 */
export interface Dashboard {
  url: string;
  close: () => Promise<void>;
}

/**
 * Start the dashboard, walking forward a few ports if the requested one is
 * taken (a previous run that has not fully released it, or a second runner).
 *
 * Returns null rather than throwing when it cannot bind at all: a telemetry
 * convenience must never take down a multi-hour run. This is not hypothetical —
 * an EADDRINUSE from a not-yet-dead previous process killed a run outright.
 */
export async function startDashboardOrWarn(port: number, attempts = 10): Promise<Dashboard | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await startDashboard(port + i);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== "EADDRINUSE") {
        console.warn(`[bot] dashboard failed to start: ${String(err)} — continuing headless`);
        return null;
      }
    }
  }
  console.warn(
    `[bot] ports ${port}-${port + attempts - 1} are all busy — continuing headless`,
  );
  return null;
}

export function startDashboard(port: number): Promise<{ url: string; close: () => Promise<void> }> {
  const server: Server = createServer((req, res) => {
    const url = req.url ?? "/";

    if (url.startsWith("/api/world")) {
      const botId = decodeURIComponent(url.split("?bot=")[1] ?? "");
      const view = botRegistry.world(botId);
      res.writeHead(view ? 200 : 404, {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      });
      res.end(JSON.stringify(view ?? { error: "unknown bot" }));
      return;
    }

    if (url.startsWith("/api/bots")) {
      const body = JSON.stringify(botRegistry.snapshot());
      res.writeHead(200, {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      });
      res.end(body);
      return;
    }

    if (url === "/" || url.startsWith("/index")) {
      res.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      });
      res.end(DASHBOARD_HTML);
      return;
    }

    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found");
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      resolve({
        url: `http://localhost:${port}`,
        close: () =>
          new Promise<void>((done) => {
            server.close(() => done());
          }),
      });
    });
  });
}
