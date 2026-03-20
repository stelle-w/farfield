import { z } from "zod";

const TRAFFIC_STORAGE_KEY = "farfield.web-traffic.v1";
const TRAFFIC_UPDATED_EVENT = "farfield:traffic-updated";
const MAX_SAMPLE_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const TrafficSampleSchema = z
  .object({
    atMs: z.number().int().nonnegative(),
    requestBytes: z.number().int().nonnegative(),
    responseBytes: z.number().int().nonnegative(),
  })
  .strict();

const TrafficSamplesSchema = z.array(TrafficSampleSchema);

const TrafficWindowKeySchema = z.enum(["15m", "1h", "1d", "7d"]);

const TrafficWindowSchema = z
  .object({
    key: TrafficWindowKeySchema,
    label: z.string(),
    requestBytes: z.number().int().nonnegative(),
    responseBytes: z.number().int().nonnegative(),
    totalBytes: z.number().int().nonnegative(),
  })
  .strict();

const TrafficSummarySchema = z
  .object({
    windows: z.array(TrafficWindowSchema),
  })
  .strict();

type TrafficSample = z.infer<typeof TrafficSampleSchema>;
export type TrafficSummary = z.infer<typeof TrafficSummarySchema>;

declare global {
  interface WindowEventMap {
    "farfield:traffic-updated": Event;
  }
}

const TRAFFIC_WINDOWS = [
  {
    key: "15m",
    label: "15 min",
    durationMs: 15 * 60 * 1000,
  },
  {
    key: "1h",
    label: "1 hour",
    durationMs: 60 * 60 * 1000,
  },
  {
    key: "1d",
    label: "1 day",
    durationMs: 24 * 60 * 60 * 1000,
  },
  {
    key: "7d",
    label: "7 days",
    durationMs: 7 * 24 * 60 * 60 * 1000,
  },
] as const;

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

function pruneSamples(
  samples: TrafficSample[],
  nowMs: number,
): TrafficSample[] {
  const minimumAtMs = Math.max(0, nowMs - MAX_SAMPLE_AGE_MS);
  return samples.filter((sample) => sample.atMs >= minimumAtMs);
}

function readStoredSamples(): TrafficSample[] {
  if (!canUseStorage()) {
    return [];
  }

  const raw = window.localStorage.getItem(TRAFFIC_STORAGE_KEY);
  if (raw === null) {
    return [];
  }

  const parsed = z.string().transform((value, ctx) => {
    try {
      return JSON.parse(value);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Saved traffic stats are not valid JSON",
      });
      return z.NEVER;
    }
  }).parse(raw);

  const samples = TrafficSamplesSchema.parse(parsed);
  const pruned = pruneSamples(samples, Date.now());
  if (pruned.length !== samples.length) {
    window.localStorage.setItem(TRAFFIC_STORAGE_KEY, JSON.stringify(pruned));
  }
  return pruned;
}

function writeStoredSamples(samples: TrafficSample[]): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(TRAFFIC_STORAGE_KEY, JSON.stringify(samples));
  window.dispatchEvent(new Event(TRAFFIC_UPDATED_EVENT));
}

export function recordTrafficSample(input: {
  requestBytes: number;
  responseBytes: number;
}): void {
  const sample = TrafficSampleSchema.parse({
    atMs: Date.now(),
    requestBytes: input.requestBytes,
    responseBytes: input.responseBytes,
  });
  const nextSamples = pruneSamples(
    [...readStoredSamples(), sample],
    sample.atMs,
  );
  writeStoredSamples(nextSamples);
}

export function clearTrafficSamples(): void {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.removeItem(TRAFFIC_STORAGE_KEY);
  window.dispatchEvent(new Event(TRAFFIC_UPDATED_EVENT));
}

export function subscribeToTrafficUpdates(
  onUpdate: () => void,
): () => void {
  if (!canUseStorage()) {
    return () => {};
  }

  window.addEventListener(TRAFFIC_UPDATED_EVENT, onUpdate);
  return () => {
    window.removeEventListener(TRAFFIC_UPDATED_EVENT, onUpdate);
  };
}

export function readTrafficSummary(): TrafficSummary {
  const nowMs = Date.now();
  const samples = readStoredSamples();

  return TrafficSummarySchema.parse({
    windows: TRAFFIC_WINDOWS.map((windowDefinition) => {
      const minimumAtMs = Math.max(0, nowMs - windowDefinition.durationMs);
      let requestBytes = 0;
      let responseBytes = 0;

      for (const sample of samples) {
        if (sample.atMs < minimumAtMs) {
          continue;
        }
        requestBytes += sample.requestBytes;
        responseBytes += sample.responseBytes;
      }

      return {
        key: windowDefinition.key,
        label: windowDefinition.label,
        requestBytes,
        responseBytes,
        totalBytes: requestBytes + responseBytes,
      };
    }),
  });
}
