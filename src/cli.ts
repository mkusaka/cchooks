#!/usr/bin/env node
import { Command } from "commander";
import { generateSettings } from "./settings";
import { writeFileSync, existsSync } from "fs";
import inquirer from "inquirer";
import path from "path";

const program = new Command();

program
  .name("cchooks")
  .description("Claude Code Hooks management CLI")
  .version("0.0.1");

// generate-settings subcommand
program
  .command("generate-settings")
  .description("Generate or dry-run .claude/settings.json with diff display")
  .requiredOption("-s, --script-path <path>", "Path to run_hook.ts")
  .option(
    "-r, --runner-cmd <cmd>",
    "Runner command",
    "node --experimental-strip-types",
  )
  .option(
    "-a, --apply",
    "Apply changes immediately without showing diff",
    false,
  )
  .option(
    "--scope <scope>",
    "Scope for settings file (user, project, local)",
    "project",
  )
  .action(async (opts) => {
    // Dynamically import hook file to register hooks
    if (opts.scriptPath.endsWith(".ts")) {
      try {
        await import(path.resolve(opts.scriptPath));
      } catch (err) {
        console.error("Failed to load hook file:", err);
        process.exit(1);
      }
    }
    // Validate scope
    if (!["user", "project", "local"].includes(opts.scope)) {
      console.error(
        `Invalid scope: ${opts.scope}. Must be one of: user, project, local`,
      );
      process.exit(1);
    }

    const result = generateSettings(
      opts.scriptPath,
      opts.runnerCmd,
      !opts.apply,
      opts.scope,
    );
    if (typeof result === "string") {
      console.log(`✅ Wrote settings to ${result}`);
    } else {
      console.log("=== Dry run diff ===");
      console.log(result.diff);

      const scopeMessages = {
        user: "user settings (~/.claude/settings.json)",
        project: "project settings (.claude/settings.json)",
        local: "local settings (.claude/settings.local.json)",
      };

      const { apply } = await inquirer.prompt([
        {
          type: "confirm",
          name: "apply",
          message: `Write these changes to ${scopeMessages[opts.scope as keyof typeof scopeMessages]}?`,
          default: false,
        },
      ]);
      if (apply) {
        const filePath = generateSettings(
          opts.scriptPath,
          opts.runnerCmd,
          false,
          opts.scope,
        );
        console.log(`✅ Wrote changes to ${filePath}`);
      } else {
        console.log("Cancelled.");
      }
    }
  });

// scaffold-run-hook subcommand
program
  .command("scaffold-run-hook")
  .description("Generate run_hook.ts template")
  .option("-o, --output <path>", "Output file path", "run_hook.ts")
  .option("--dev", "Use local development import paths", false)
  .action((opts) => {
    const importPath = opts.dev ? "./src/runner" : "cchooks";
    const hooksImportPath = opts.dev ? "./src/hooks" : "cchooks";

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

    // Write run_hook.ts
    writeFileSync(opts.output, runHookTemplate, "utf8");
    console.log(`✅ Generated: ${opts.output}`);

    // Write my-hooks.ts if it doesn't exist
    const myHooksPath = "my-hooks.ts";
    if (!existsSync(myHooksPath)) {
      writeFileSync(myHooksPath, myHooksTemplate, "utf8");
      console.log(`✅ Generated sample: ${myHooksPath}`);
    } else {
      console.log(`ℹ️  ${myHooksPath} already exists, skipping...`);
    }
  });

program.parse(process.argv);
