import {
  ToolInputMap,
  PathFilter,
  PreToolUseSpec,
  PostToolUseSpec,
  OtherSpec,
  HookSpec,
} from "./types";

// Array to store hook specifications
export const hookSpecs: HookSpec[] = [];

/** Register PreToolUse hooks (with optional paths/pathsIgnore) */
export function onPreToolUse<K extends keyof ToolInputMap>(
  toolName: K,
  handler: PreToolUseSpec<K>["handler"],
): void;
export function onPreToolUse<K extends keyof ToolInputMap>(
  toolName: K,
  opts: PathFilter,
  handler: PreToolUseSpec<K>["handler"],
): void;
export function onPreToolUse<K extends keyof ToolInputMap>(
  toolName: K,
  a: PathFilter | PreToolUseSpec<K>["handler"],
  b?: PreToolUseSpec<K>["handler"],
) {
  const spec: PreToolUseSpec<K> = {
    event: "PreToolUse",
    matcher: { value: toolName },
    ...(typeof a === "function" ? {} : a),
    handler: typeof a === "function" ? a : b!,
  };
  hookSpecs.push(spec as unknown as HookSpec);
}

/** Register PostToolUse hooks */
export function onPostToolUse<K extends keyof ToolInputMap>(
  toolName: K,
  handler: PostToolUseSpec<K>["handler"],
): void;
export function onPostToolUse<K extends keyof ToolInputMap>(
  toolName: K,
  opts: PathFilter,
  handler: PostToolUseSpec<K>["handler"],
): void;
export function onPostToolUse<K extends keyof ToolInputMap>(
  toolName: K,
  a: PathFilter | PostToolUseSpec<K>["handler"],
  b?: PostToolUseSpec<K>["handler"],
) {
  const spec: PostToolUseSpec<K> = {
    event: "PostToolUse",
    matcher: { value: toolName },
    ...(typeof a === "function" ? {} : a),
    handler: typeof a === "function" ? a : b!,
  };
  hookSpecs.push(spec as unknown as HookSpec);
}

/** Helper functions for events without matcher */
export function onUserPromptSubmit(
  handler: OtherSpec<"UserPromptSubmit">["handler"],
): void {
  hookSpecs.push({ event: "UserPromptSubmit", handler } as any);
}
export function onNotification(
  handler: OtherSpec<"Notification">["handler"],
): void {
  hookSpecs.push({ event: "Notification", handler } as any);
}
export function onPreCompact(
  handler: OtherSpec<"PreCompact">["handler"],
): void {
  hookSpecs.push({ event: "PreCompact", handler } as any);
}
export function onStop(handler: OtherSpec<"Stop">["handler"]): void {
  hookSpecs.push({ event: "Stop", handler } as any);
}
export function onSubagentStop(
  handler: OtherSpec<"SubagentStop">["handler"],
): void {
  hookSpecs.push({ event: "SubagentStop", handler } as any);
}

// Export for testing
export const clearHooks = () => {
  hookSpecs.length = 0;
};

export const getHookSpecs = () => [...hookSpecs];
