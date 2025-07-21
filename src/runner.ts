import { hookSpecs } from "./hooks";
import { HookContext } from "./types";
import micromatch from "micromatch";

export async function runHook(ctx: HookContext): Promise<void> {
  for (const spec of hookSpecs) {
    if (spec.event !== ctx.hook_event_name) {
      continue;
    }

    switch (spec.event) {
      case "PreToolUse": {
        if (ctx.hook_event_name !== "PreToolUse") break;
        if (spec.matcher.value !== ctx.tool_name) break;

        const filePath =
          "file_path" in ctx.tool_input ? ctx.tool_input.file_path : undefined;
        if (
          spec.paths &&
          filePath &&
          !micromatch.isMatch(filePath, spec.paths)
        ) {
          break;
        }
        if (
          spec.pathsIgnore &&
          filePath &&
          micromatch.isMatch(filePath, spec.pathsIgnore)
        ) {
          break;
        }

        // Call handler with the correct context
        const handler = spec.handler as (
          ctx: HookContext,
        ) => void | Promise<void>;
        await handler(ctx);
        break;
      }

      case "PostToolUse": {
        if (ctx.hook_event_name !== "PostToolUse") break;
        if (spec.matcher.value !== ctx.tool_name) break;

        const filePath =
          "file_path" in ctx.tool_input ? ctx.tool_input.file_path : undefined;
        if (
          spec.paths &&
          filePath &&
          !micromatch.isMatch(filePath, spec.paths)
        ) {
          break;
        }
        if (
          spec.pathsIgnore &&
          filePath &&
          micromatch.isMatch(filePath, spec.pathsIgnore)
        ) {
          break;
        }

        const handler = spec.handler as (
          ctx: HookContext,
        ) => void | Promise<void>;
        await handler(ctx);
        break;
      }

      case "UserPromptSubmit":
      case "Notification":
      case "PreCompact":
      case "Stop":
      case "SubagentStop": {
        if (ctx.hook_event_name !== spec.event) break;
        const handler = spec.handler as (
          ctx: HookContext,
        ) => void | Promise<void>;
        await handler(ctx);
        break;
      }
    }
  }
}
