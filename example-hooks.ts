#!/usr/bin/env node
// example-hooks.ts - Claude Code Hooks usage example

import {
  onPreToolUse,
  onPostToolUse,
  onUserPromptSubmit,
  onNotification,
  onPreCompact,
  onStop,
  onSubagentStop,
} from "./src/hooks";

// Pre-tool-use hooks
onPreToolUse(
  "Write",
  { paths: ["src/**/*.ts"], pathsIgnore: ["**/*.test.ts"] },
  (ctx) => {
    console.log(`[PreToolUse] Writing to: ${ctx.tool_input.file_path}`);
  },
);

onPreToolUse("Bash", (ctx) => {
  console.log(`[PreToolUse] Running command: ${ctx.tool_input.command}`);
  if (ctx.tool_input.command.includes("rm -rf")) {
    throw new Error("Dangerous command blocked");
  }
});

// Post-tool-use hooks
onPostToolUse("Write", (ctx) => {
  console.log(`[PostToolUse] Written to: ${ctx.tool_input.file_path}`);
});

// User prompt submission
onUserPromptSubmit((ctx) => {
  console.log(`[UserPromptSubmit] Prompt: ${ctx.prompt}`);
  if (ctx.prompt.includes("secret") || ctx.prompt.includes("password")) {
    throw new Error("Potentially contains sensitive information");
  }
});

// Notifications
onNotification((ctx) => {
  console.log(`[Notification] ${ctx.message}`);
});

// Pre-compact
onPreCompact((ctx) => {
  console.log(
    `[PreCompact] Trigger: ${ctx.trigger}, Instructions: ${ctx.custom_instructions}`,
  );
});

// On stop
onStop((ctx) => {
  console.log(`[Stop] Hook active: ${ctx.stop_hook_active}`);
});

// Subagent stop
onSubagentStop((ctx) => {
  console.log(`[SubagentStop] Hook active: ${ctx.stop_hook_active}`);
});

console.log("Hooks registered.");

// Settings file generation demo
if (process.argv.includes("--generate-settings")) {
  import("./src/settings").then(({ generateSettings }) => {
    const result = generateSettings(
      "./example-run-hook.ts",
      "node --experimental-strip-types",
      false,
    );
    console.log("Generated settings file:");
    console.log(result);
  });
}
