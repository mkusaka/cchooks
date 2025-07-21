import { hookSpecs } from "./hooks";
import { writeFileSync, existsSync, readFileSync, mkdirSync } from "fs";
import { EventName, HookSpec } from "./types";
import * as diff from "diff";
import * as path from "path";
import * as os from "os";

interface JsonBlock {
  matcher?: string;
  paths?: string[];
  pathsIgnore?: string[];
  hooks: { type: "command"; command: string }[];
}
export type Settings = { hooks: Record<EventName, JsonBlock[]> };

export type Scope = "user" | "project" | "local";

/**
 * Get the file path for the settings based on scope
 */
function getSettingsPath(scope: Scope): string {
  switch (scope) {
    case "user":
      return path.join(os.homedir(), ".claude", "settings.json");
    case "local":
      return ".claude/settings.local.json";
    case "project":
    default:
      return ".claude/settings.json";
  }
}

/**
 * generateSettings
 *
 * @param scriptPath   Path to the run_hook.ts file to execute
 * @param runnerCmd    Runner command (default: node --experimental-strip-types)
 * @param dryRun       If true, returns diff without writing file
 * @param scope        Scope for settings file (user, project, local)
 * @returns           When dryRun=true, returns { oldText, newText, diff }
 *                   When dryRun=false, writes file and returns newText
 */
export function generateSettings(
  scriptPath: string,
  runnerCmd: string,
  dryRun: false,
  scope?: Scope,
): string;
export function generateSettings(
  scriptPath: string,
  runnerCmd: string,
  dryRun: true,
  scope?: Scope,
): { oldText: string; newText: string; diff: string };
export function generateSettings(
  scriptPath: string,
  runnerCmd?: string,
  dryRun?: boolean,
  scope?: Scope,
): { oldText: string; newText: string; diff: string };
export function generateSettings(
  scriptPath: string,
  runnerCmd: string = "node --experimental-strip-types",
  dryRun: boolean = true,
  scope: Scope = "project",
): { oldText: string; newText: string; diff: string } | string {
  const filePath = getSettingsPath(scope);
  const oldText = existsSync(filePath) ? readFileSync(filePath, "utf8") : "";

  // Generate settings object
  const out: Settings = {
    hooks: {
      PreToolUse: [],
      PostToolUse: [],
      UserPromptSubmit: [],
      Notification: [],
      PreCompact: [],
      Stop: [],
      SubagentStop: [],
    },
  };

  for (const spec of hookSpecs as HookSpec[]) {
    const block: JsonBlock = {
      hooks: [{ type: "command", command: `${runnerCmd} ${scriptPath}` }],
    };

    if (spec.event === "PreToolUse" || spec.event === "PostToolUse") {
      block.matcher = spec.matcher.value as string;
      if ("paths" in spec && spec.paths) {
        block.paths = spec.paths;
      }
      if ("pathsIgnore" in spec && spec.pathsIgnore) {
        block.pathsIgnore = spec.pathsIgnore;
      }
    }

    out.hooks[spec.event].push(block);
  }

  const newText = JSON.stringify(out, null, 2);

  if (dryRun) {
    // Generate diff
    const diffResult = diff.createTwoFilesPatch(
      filePath,
      filePath,
      oldText,
      newText,
    );
    return { oldText, newText, diff: diffResult };
  } else {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(filePath, newText, "utf8");
    return filePath;
  }
}
