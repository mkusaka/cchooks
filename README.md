# cchooks

A TypeScript library for managing Claude Code hooks with immediate execution support using Node.js experimental TypeScript support.

## Installation

```bash
npm install cchooks
# or
pnpm add cchooks
# or
yarn add cchooks
```

## Quick Start

### 1. Define your hooks

```ts
// my-hooks.ts
import { onPreToolUse, onUserPromptSubmit } from "cchooks";

// Hook before file writes
onPreToolUse(
  "Write",
  { paths: ["src/**/*.ts"], pathsIgnore: ["**/*.test.ts"] },
  (ctx) => {
    console.log("Writing to:", ctx.tool_input.file_path);
  },
);

// Check user prompts
onUserPromptSubmit((ctx) => {
  if (ctx.prompt.includes("secret")) {
    throw new Error("Sensitive information detected");
  }
});
```

### 2. Generate run_hook.ts

```bash
pnpm exec cchooks scaffold-run-hook --output run_hook.ts
```

### 3. Generate settings file

```bash
pnpm exec cchooks generate-settings --script-path ./run_hook.ts
```

### 4. Use with Claude Code

The generated `.claude/settings.json` will be loaded by Claude Code and hooks will be executed on each event.

## CLI Commands

### generate-settings

Generate or update Claude Code settings files with different scopes:

```bash
# Project scope (default)
pnpm exec cchooks generate-settings --script-path ./run_hook.ts

# User scope (applies to all projects)
pnpm exec cchooks generate-settings --script-path ./run_hook.ts --scope user

# Local scope (not committed to git)
pnpm exec cchooks generate-settings --script-path ./run_hook.ts --scope local
```

Options:

- `-s, --script-path <path>`: Path to run_hook.ts (required)
- `-r, --runner-cmd <cmd>`: Runner command (default: `node --experimental-strip-types`)
- `-a, --apply`: Apply changes immediately without showing diff (default: show diff)
- `--scope <scope>`: Scope for settings file - `user`, `project`, or `local` (default: `project`)
  - `user`: Saves to `~/.claude/settings.json` (applies to all projects)
  - `project`: Saves to `.claude/settings.json` (project-specific)
  - `local`: Saves to `.claude/settings.local.json` (not committed to git)

### scaffold-run-hook

Generate run_hook.ts template:

```bash
pnpm exec cchooks scaffold-run-hook --output run_hook.ts
```

Options:

- `-o, --output <path>`: Output file path (default: `run_hook.ts`)

## API

### Event Handlers

#### PreToolUse / PostToolUse

```ts
onPreToolUse(toolName, handler);
onPreToolUse(toolName, options, handler);

onPostToolUse(toolName, handler);
onPostToolUse(toolName, options, handler);
```

Supported tools:

- `"Bash"`: Command execution
- `"Write"`: File writing
- `"Glob"`: File pattern search

Options:

- `paths`: Include file paths matching glob patterns
- `pathsIgnore`: Exclude file paths matching glob patterns

#### Other Events

```ts
onUserPromptSubmit(handler); // User prompt submission
onNotification(handler); // Notifications
onPreCompact(handler); // Before compaction
onStop(handler); // On stop
onSubagentStop(handler); // Subagent stop
```

## Development

### Using Node.js experimental TypeScript support

This library supports immediate TypeScript execution using Node.js experimental strip types feature:

```bash
# Run CLI commands directly
pnpm cli generate-settings --script-path ./my-hooks.ts

# Execute hook file directly
echo '{"hook_event_name":"UserPromptSubmit","session_id":"test","transcript_path":"test.txt","cwd":".","prompt":"test"}' | node --experimental-strip-types run_hook.ts
```

## License

MIT
