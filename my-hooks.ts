#!/usr/bin/env node
// Example hook definition file
import { onPreToolUse, onUserPromptSubmit } from "./dist/hooks.js";

// Hook before file write
onPreToolUse(
  "Write",
  { paths: ["src/**/*.ts"], pathsIgnore: ["**/*.test.ts"] },
  (ctx) => {
    console.log(`[PreToolUse] Writing to: ${ctx.tool_input.file_path}`);
  },
);

// Check user prompts
onUserPromptSubmit((ctx) => {
  if (ctx.prompt.includes("secret")) {
    throw new Error("Sensitive information detected");
  }
});
