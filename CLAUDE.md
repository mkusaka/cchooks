# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript library for managing Claude Code hooks. It provides an API to register hooks for various Claude Code events (PreToolUse, PostToolUse, UserPromptSubmit, etc.) and generates the required `.claude/settings.json` configuration.

## Key Commands

```bash
# Install dependencies (using pnpm)
pnpm install

# Build TypeScript to dist/
pnpm run build

# Watch mode for development
pnpm run watch

# Type checking without emitting files
pnpm run typecheck

# Linting with oxlint
pnpm run lint

# Run CLI commands (requires build first)
pnpm cli <command>
```

## Architecture

The library consists of five core modules:

1. **types.ts**: Defines all TypeScript types using discriminated unions for type-safe event handling. Key types include `HookContext`, `HookSpec`, and event-specific contexts.

2. **hooks.ts**: Provides the registration API (`onPreToolUse`, `onPostToolUse`, etc.). Stores hook specifications in a global `hookSpecs` array.

3. **runner.ts**: The execution engine that matches incoming events to registered hooks and executes handlers. Uses micromatch for glob pattern matching on file paths.

4. **settings.ts**: Generates `.claude/settings.json` from registered hooks. Supports dry-run mode with diff display.

5. **cli.ts**: Commander-based CLI with two main commands:
   - `scaffold-run-hook`: Creates a run_hook.ts template
   - `generate-settings`: Creates/updates .claude/settings.json

## Development Workflow

When developing hooks:

1. Create a hooks file (e.g., `my-hooks.ts`) that imports from `./src/hooks`
2. Build the project: `pnpm run build`
3. Generate a run_hook template: `pnpm cli scaffold-run-hook --output run_hook.ts`
4. Test hooks locally:
   ```bash
   echo '{"hook_event_name":"UserPromptSubmit","session_id":"test","transcript_path":"test.txt","cwd":".","prompt":"test"}' | node run_hook.ts
   ```
5. Generate settings: `pnpm cli generate-settings --script-path ./run_hook.ts`

## Important Technical Details

- The project uses CommonJS output (`"module": "commonjs"` in tsconfig.json)
- Node.js experimental TypeScript support (`--experimental-strip-types`) is the default runner
- Hook execution uses path filtering with micromatch for `PreToolUse` and `PostToolUse` events
- The CLI dynamically imports hook files to register them before generating settings
- All event contexts extend `CommonFields` containing `session_id`, `transcript_path`, and `cwd`

## Testing Hooks

To test a specific hook event:

```bash
# Test UserPromptSubmit
echo '{"hook_event_name":"UserPromptSubmit","session_id":"test","transcript_path":"test.txt","cwd":".","prompt":"your test prompt"}' | node run_hook.ts

# Test PreToolUse for Write
echo '{"hook_event_name":"PreToolUse","tool_name":"Write","tool_input":{"file_path":"test.ts","content":""},"session_id":"test","transcript_path":"test.txt","cwd":"."}' | node run_hook.ts
```

## Publishing

The library is configured to be published as an npm package with:

- Main entry: `dist/index.js`
- TypeScript types: `dist/index.d.ts`
- CLI binary: `dist/cli.js` (exposed as `claude-hooks`)
- Included files: `dist/` and `templates/`
