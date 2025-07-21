# cchooks Usage Guide

## Quick Start

### 1. Project Setup

```bash
# Work in this project
cd /Users/masatomokusaka/src/github.com/mkusaka/cchooks

# Build
pnpm run build
```

### 2. Create Hook File

```typescript
// my-hooks.ts
import { onPreToolUse, onUserPromptSubmit } from "./src/hooks";

// Hook before file writes
onPreToolUse("Write", { paths: ["src/**/*.ts"] }, (ctx) => {
  console.log(`Writing to: ${ctx.tool_input.file_path}`);
});

// Check user prompts
onUserPromptSubmit((ctx) => {
  if (ctx.prompt.includes("secret")) {
    throw new Error("Sensitive information detected");
  }
});
```

### 3. Create run_hook.ts

```bash
# Generate template
pnpm cli scaffold-run-hook --output run_hook.ts
# or
node --experimental-strip-types src/cli.ts scaffold-run-hook --output run_hook.ts
```

The generated file will already include the necessary imports:

```typescript
#!/usr/bin/env node --experimental-strip-types
// Import your hook definitions first
import "./my-hooks";

// Then import the runner
import getStdin from "get-stdin";
import { runHook } from "cchooks";

async function main() {
  const raw = await getStdin();
  const ctx = JSON.parse(raw);
  await runHook(ctx);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

### 4. Generate Settings File

```bash
# Generate .claude/settings.json
mkdir -p .claude
pnpm cli generate-settings --script-path ./run_hook.ts
# or
node --experimental-strip-types src/cli.ts generate-settings --script-path ./run_hook.ts
```

### 5. Test Execution

```bash
# Execute hook with test data using Node.js experimental TypeScript support
echo '{"hook_event_name":"UserPromptSubmit","session_id":"test","transcript_path":"test.txt","cwd":".","prompt":"test secret"}' | node --experimental-strip-types run_hook.ts
```

## Development Workflow

### Using Node.js experimental TypeScript support for immediate execution

```bash
# Run CLI directly without building
node --experimental-strip-types src/cli.ts --help

# Generate settings with Node.js experimental TypeScript support
node --experimental-strip-types src/cli.ts generate-settings --script-path ./my-hooks.ts

# Test hooks immediately
echo '{"hook_event_name":"PreToolUse","tool_name":"Write","tool_input":{"file_path":"test.ts","content":""},"session_id":"test","transcript_path":"test.txt","cwd":"."}' | node --experimental-strip-types run_hook.ts
```

## After Publishing to npm

```bash
# Install
pnpm add cchooks

# Use CLI
pnpm exec cchooks scaffold-run-hook
pnpm exec cchooks generate-settings --script-path ./run_hook.ts
```
