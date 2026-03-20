import { z } from "zod";

const STORAGE_PREFIX = "farfield.sidebar";

const SidebarOrderSchema = z.array(z.string());
const SidebarCollapseMapSchema = z.record(z.string(), z.boolean());
const NotificationPreferencesSchema = z
  .object({
    playCompletionSound: z.boolean(),
    playUserInputSound: z.boolean(),
  })
  .strict();

const GROUP_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"
] as const;

export type GroupColor = (typeof GROUP_COLORS)[number];
export const groupColors: readonly string[] = GROUP_COLORS;

const ProjectColorMapSchema = z.record(z.string(), z.enum(GROUP_COLORS));

function readStorage<T>(key: string, schema: z.ZodType<T>, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}.${key}`);
    if (!raw) return defaultValue;
    return schema.parse(JSON.parse(raw));
  } catch {
    return defaultValue;
  }
}

function writeStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}.${key}`, JSON.stringify(value));
  } catch {
    // storage full or unavailable
  }
}

export function readSidebarOrder(): string[] {
  return readStorage("order.v1", SidebarOrderSchema, []);
}

export function writeSidebarOrder(order: string[]): void {
  writeStorage("order.v1", order);
}

export function readCollapseMap(): Record<string, boolean> {
  return readStorage("collapsed-groups.v1", SidebarCollapseMapSchema, {});
}

export function writeCollapseMap(map: Record<string, boolean>): void {
  writeStorage("collapsed-groups.v1", map);
}

export function readProjectColors(): Record<string, GroupColor> {
  return readStorage("project-colors.v1", ProjectColorMapSchema, {});
}

export function writeProjectColors(map: Record<string, GroupColor>): void {
  writeStorage("project-colors.v1", map);
}

export interface NotificationPreferences {
  playCompletionSound: boolean;
  playUserInputSound: boolean;
}

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  playCompletionSound: false,
  playUserInputSound: false,
};

export function readNotificationPreferences(): NotificationPreferences {
  return readStorage(
    "notification-preferences.v1",
    NotificationPreferencesSchema,
    DEFAULT_NOTIFICATION_PREFERENCES,
  );
}

export function writeNotificationPreferences(
  value: NotificationPreferences,
): void {
  writeStorage("notification-preferences.v1", value);
}
