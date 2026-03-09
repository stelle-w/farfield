const SERVER_TIMING_METRIC_IDS = [
  "realtimeCoreBuild",
  "realtimeThreadBuild",
  "codexThreadRefresh",
  "codexLiveStateRead",
] as const;

export type ServerTimingMetricId = (typeof SERVER_TIMING_METRIC_IDS)[number];

export interface ServerTimingMetricSnapshot {
  count: number;
  slowCount: number;
  lastMs: number;
  avgMs: number;
  maxMs: number;
}

export type ServerTimingSnapshot = Record<
  ServerTimingMetricId,
  ServerTimingMetricSnapshot
>;

interface MutableServerTimingMetric {
  count: number;
  slowCount: number;
  totalMs: number;
  lastMs: number;
  maxMs: number;
}

const DEFAULT_SLOW_THRESHOLD_MS: Record<ServerTimingMetricId, number> = {
  realtimeCoreBuild: 250,
  realtimeThreadBuild: 150,
  codexThreadRefresh: 500,
  codexLiveStateRead: 80,
};

function createMutableMetric(): MutableServerTimingMetric {
  return {
    count: 0,
    slowCount: 0,
    totalMs: 0,
    lastMs: 0,
    maxMs: 0,
  };
}

function createEmptySnapshot(): ServerTimingSnapshot {
  return {
    realtimeCoreBuild: {
      count: 0,
      slowCount: 0,
      lastMs: 0,
      avgMs: 0,
      maxMs: 0,
    },
    realtimeThreadBuild: {
      count: 0,
      slowCount: 0,
      lastMs: 0,
      avgMs: 0,
      maxMs: 0,
    },
    codexThreadRefresh: {
      count: 0,
      slowCount: 0,
      lastMs: 0,
      avgMs: 0,
      maxMs: 0,
    },
    codexLiveStateRead: {
      count: 0,
      slowCount: 0,
      lastMs: 0,
      avgMs: 0,
      maxMs: 0,
    },
  };
}

export class ServerTimingTracker {
  private readonly metrics: Record<ServerTimingMetricId, MutableServerTimingMetric> =
    {
      realtimeCoreBuild: createMutableMetric(),
      realtimeThreadBuild: createMutableMetric(),
      codexThreadRefresh: createMutableMetric(),
      codexLiveStateRead: createMutableMetric(),
    };

  public record(metricId: ServerTimingMetricId, durationMs: number): void {
    const metric = this.metrics[metricId];
    metric.count += 1;
    metric.totalMs += durationMs;
    metric.lastMs = durationMs;
    if (durationMs > metric.maxMs) {
      metric.maxMs = durationMs;
    }
    if (durationMs >= DEFAULT_SLOW_THRESHOLD_MS[metricId]) {
      metric.slowCount += 1;
    }
  }

  public snapshot(): ServerTimingSnapshot {
    const snapshot = createEmptySnapshot();
    for (const metricId of SERVER_TIMING_METRIC_IDS) {
      const metric = this.metrics[metricId];
      snapshot[metricId] = {
        count: metric.count,
        slowCount: metric.slowCount,
        lastMs: roundMetric(metric.lastMs),
        avgMs: roundMetric(
          metric.count === 0 ? 0 : metric.totalMs / metric.count,
        ),
        maxMs: roundMetric(metric.maxMs),
      };
    }
    return snapshot;
  }
}

function roundMetric(value: number): number {
  return Math.round(value * 100) / 100;
}
