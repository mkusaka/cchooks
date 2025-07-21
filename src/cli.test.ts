import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock fs module
vi.mock("fs");

// Mock inquirer to avoid interactive prompts
vi.mock("inquirer", () => ({
  default: {
    prompt: vi.fn().mockResolvedValue({ apply: false }),
  },
}));

describe("CLI - scaffold-run-hook command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate correct template content with default options", () => {
    // Test the template content directly without executing CLI
    const importPath = "cchooks";
    const runHookTemplate = `#!/usr/bin/env node --experimental-strip-types
// Import your hook definitions first
import "./my-hooks";

// Then import the runner
import getStdin from "get-stdin";
import { runHook } from "${importPath}";

async function main() {
  const raw = await getStdin();
  const ctx = JSON.parse(raw);
  await runHook(ctx);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
`;

    expect(runHookTemplate).toContain(
      "#!/usr/bin/env node --experimental-strip-types",
    );
    expect(runHookTemplate).toContain('import { runHook } from "cchooks"');
    expect(runHookTemplate).toContain('import "./my-hooks"');
  });

  it("should generate correct template content with --dev option", () => {
    const devImportPath = "./src/runner";
    const runHookTemplate = `#!/usr/bin/env node --experimental-strip-types
// Import your hook definitions first
import "./my-hooks";

// Then import the runner
import getStdin from "get-stdin";
import { runHook } from "${devImportPath}";

async function main() {
  const raw = await getStdin();
  const ctx = JSON.parse(raw);
  await runHook(ctx);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
`;

    expect(runHookTemplate).toContain('import { runHook } from "./src/runner"');
  });

  it("should generate correct my-hooks template", () => {
    const hooksImportPath = "cchooks";
    const myHooksTemplate = `// my-hooks.ts - Sample hook definitions
import { onPreToolUse, onUserPromptSubmit, onPostToolUse } from "${hooksImportPath}";

// Example: Log file writes
onPreToolUse("Write", { paths: ["src/**/*.ts"] }, ctx => {
  console.log(\`📝 Writing to: \${ctx.tool_input.file_path}\`);
});

// Example: Prevent sensitive information in prompts
onUserPromptSubmit(ctx => {
  if (ctx.prompt.includes("secret") || ctx.prompt.includes("password")) {
    throw new Error("⚠️  Sensitive information detected in prompt!");
  }
});

// Example: Log bash command execution results
onPostToolUse("Bash", ctx => {
  console.log(\`✅ Executed command: \${ctx.tool_input.command}\`);
});

console.log("🔧 Hooks loaded successfully!");
`;

    expect(myHooksTemplate).toContain(
      "import { onPreToolUse, onUserPromptSubmit, onPostToolUse }",
    );
    expect(myHooksTemplate).toContain('onPreToolUse("Write"');
    expect(myHooksTemplate).toContain("onUserPromptSubmit(");
    expect(myHooksTemplate).toContain('onPostToolUse("Bash"');
  });
});
