import { createWriteStream, mkdirSync, type WriteStream } from "node:fs";
import { join } from "node:path";
import type { BotEvent, DeathRecord } from "./events";

/**
 * Append-only JSONL writer for one run.
 *
 * Streamed rather than buffered: a canonical 1x run is wall-clock bound and may
 * be killed after many hours, and a run whose telemetry only exists in memory is
 * a run we cannot analyse. Everything already flushed survives.
 */
export class TelemetrySink {
  readonly dir: string;
  private readonly events: WriteStream;
  private readonly deaths: WriteStream;
  private closed = false;

  constructor(outDir: string, runId: string) {
    this.dir = join(outDir, runId);
    mkdirSync(this.dir, { recursive: true });
    this.events = createWriteStream(join(this.dir, "events.jsonl"), { flags: "a" });
    this.deaths = createWriteStream(join(this.dir, "deaths.jsonl"), { flags: "a" });
  }

  write(event: BotEvent): void {
    if (this.closed) return;
    this.events.write(`${JSON.stringify(event)}\n`);
  }

  writeDeath(record: DeathRecord): void {
    if (this.closed) return;
    this.deaths.write(`${JSON.stringify(record)}\n`);
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    await Promise.all([endStream(this.events), endStream(this.deaths)]);
  }
}

function endStream(stream: WriteStream): Promise<void> {
  return new Promise((resolve) => stream.end(resolve));
}
