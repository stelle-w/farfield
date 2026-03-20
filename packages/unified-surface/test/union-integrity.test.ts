import { describe, expect, it } from "vitest";
import {
  UNIFIED_COMMAND_KINDS,
  UNIFIED_EVENT_KINDS,
  UNIFIED_FEATURE_IDS,
  UNIFIED_ITEM_KINDS,
  UnifiedCommandSchema,
  UnifiedCommandResultSchema,
  UnifiedEventSchema,
  UnifiedFeatureMatrixSchema,
  UnifiedItemSchema
} from "../src/index.js";

describe("unified surface unions", () => {
  it("has command and result variants in sync", () => {
    expect(UNIFIED_COMMAND_KINDS.length).toBeGreaterThan(0);
    for (const kind of UNIFIED_COMMAND_KINDS) {
      expect(
        UnifiedCommandSchema.options.some((schema) => schema.shape.kind.value === kind)
      ).toBe(true);
      expect(
        UnifiedCommandResultSchema.options.some((schema) => schema.shape.kind.value === kind)
      ).toBe(true);
    }
  });

  it("has an exhaustive item kind list", () => {
    expect(UNIFIED_ITEM_KINDS.length).toBe(UnifiedItemSchema.options.length);
  });

  it("has an exhaustive event kind list", () => {
    expect(UNIFIED_EVENT_KINDS.length).toBe(UnifiedEventSchema.options.length);
  });

  it("validates feature matrix shape", () => {
    const parsed = UnifiedFeatureMatrixSchema.parse({
      codex: {},
      opencode: {}
    });

    expect(parsed.codex).toEqual({});
    expect(parsed.opencode).toEqual({});
    expect(UNIFIED_FEATURE_IDS.length).toBeGreaterThan(0);
  });

  it("accepts interrupted collab agent statuses", () => {
    const parsed = UnifiedItemSchema.parse({
      id: "collab-1",
      type: "collabAgentToolCall",
      tool: "spawnAgent",
      status: "completed",
      senderThreadId: "thread-123",
      receiverThreadIds: ["thread-456"],
      prompt: "Investigate the issue",
      agentsStates: {
        "agent-1": {
          status: "interrupted",
          message: "Stopped by user"
        }
      }
    });

    expect(parsed).toMatchObject({
      type: "collabAgentToolCall",
      agentsStates: {
        "agent-1": {
          status: "interrupted"
        }
      }
    });
  });
});
