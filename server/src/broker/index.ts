import Redis from "ioredis";
import type { NodeTelemetrySnapshot } from "@mmo-idle/shared";
import { log } from "../log";

const DEV_DEFAULT_REDIS_URL = "redis://localhost:6379";

const CHANNELS = {
  telemetry: "ops:telemetry",
} as const;

type TelemetryListener = (snapshot: NodeTelemetrySnapshot) => void;

let pub: Redis | null = null;
let sub: Redis | null = null;
let telemetrySubscribed = false;
const telemetryListeners = new Set<TelemetryListener>();

function redisUrl(): string {
  const configured = process.env.REDIS_URL;
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error("[broker] REDIS_URL is not set.");
  }
  return DEV_DEFAULT_REDIS_URL;
}

function createClient(role: "pub" | "sub"): Redis {
  const client = new Redis(redisUrl(), {
    lazyConnect: true,
    maxRetriesPerRequest: 2,
    enableReadyCheck: false,
  });
  client.on("error", (err) => {
    log.warn({ err, role }, "redis broker client error");
  });
  return client;
}

function publisher(): Redis {
  pub ??= createClient("pub");
  return pub;
}

function subscriber(): Redis {
  sub ??= createClient("sub");
  return sub;
}

export async function publishTelemetry(
  snapshot: NodeTelemetrySnapshot,
): Promise<void> {
  await publisher().publish(CHANNELS.telemetry, JSON.stringify(snapshot));
}

export function onTelemetry(listener: TelemetryListener): () => void {
  telemetryListeners.add(listener);
  ensureTelemetrySubscription();
  return () => {
    telemetryListeners.delete(listener);
  };
}

function ensureTelemetrySubscription(): void {
  if (telemetrySubscribed) return;
  telemetrySubscribed = true;
  const client = subscriber();
  client.on("message", (channel, raw) => {
    if (channel !== CHANNELS.telemetry) return;
    try {
      const snapshot = JSON.parse(raw) as NodeTelemetrySnapshot;
      for (const listener of telemetryListeners) listener(snapshot);
    } catch (err) {
      log.warn({ err }, "failed to decode broker telemetry payload");
    }
  });
  void client.subscribe(CHANNELS.telemetry).catch((err) => {
    telemetrySubscribed = false;
    log.warn({ err }, "failed to subscribe to telemetry broker channel");
  });
}
