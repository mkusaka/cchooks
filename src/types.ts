// --- 2-1) Event names ---
export type EventName =
  | "PreToolUse"
  | "PostToolUse"
  | "UserPromptSubmit"
  | "Notification"
  | "PreCompact"
  | "Stop"
  | "SubagentStop";

// --- 2-2) Common fields ---
export interface CommonFields {
  session_id: string;
  transcript_path: string;
  cwd: string;
}

// --- 2-3) Tool input map ---
export interface ToolInputMap {
  Bash: { command: string };
  Write: { file_path: string; content: string };
  Glob: { pattern: string };
  // ...add other tools as needed
}

// --- 2-4) PreToolUseContext ---
export type PreToolUseContext = {
  [K in keyof ToolInputMap]: CommonFields & {
    hook_event_name: "PreToolUse";
    tool_name: K;
    tool_input: ToolInputMap[K];
  };
}[keyof ToolInputMap];

// --- 2-5) PostToolUseContext ---
export type PostToolUseContext = {
  [K in keyof ToolInputMap]: CommonFields & {
    hook_event_name: "PostToolUse";
    tool_name: K;
    tool_input: ToolInputMap[K];
  };
}[keyof ToolInputMap];

// --- 2-6) Other event contexts ---
export interface UserPromptSubmitContext extends CommonFields {
  hook_event_name: "UserPromptSubmit";
  prompt: string;
}
export interface NotificationContext extends CommonFields {
  hook_event_name: "Notification";
  message: string;
}
export interface PreCompactContext extends CommonFields {
  hook_event_name: "PreCompact";
  trigger: "manual" | "auto";
  custom_instructions: string;
}
export interface StopContext extends CommonFields {
  hook_event_name: "Stop";
  stop_hook_active: boolean;
}
export interface SubagentStopContext extends CommonFields {
  hook_event_name: "SubagentStop";
  stop_hook_active: boolean;
}

// --- 2-7) HookContext discriminated union ---
export type HookContext =
  | PreToolUseContext
  | PostToolUseContext
  | UserPromptSubmitContext
  | NotificationContext
  | PreCompactContext
  | StopContext
  | SubagentStopContext;

// --- 2-8) paths/pathsIgnore types ---
export interface PathFilter {
  /** include glob patterns */
  paths?: string[];
  /** exclude glob patterns */
  pathsIgnore?: string[];
}

// --- 2-9) Spec types ---
export interface PreToolUseSpec<K extends keyof ToolInputMap>
  extends PathFilter {
  event: "PreToolUse";
  matcher: { value: K };
  handler: (
    ctx: Extract<HookContext, { hook_event_name: "PreToolUse"; tool_name: K }>,
  ) => void | Promise<void>;
}
export interface PostToolUseSpec<K extends keyof ToolInputMap>
  extends PathFilter {
  event: "PostToolUse";
  matcher: { value: K };
  handler: (
    ctx: Extract<HookContext, { hook_event_name: "PostToolUse"; tool_name: K }>,
  ) => void | Promise<void>;
}
export type OtherEvent =
  | "UserPromptSubmit"
  | "Notification"
  | "PreCompact"
  | "Stop"
  | "SubagentStop";
export interface OtherSpec<E extends OtherEvent> {
  event: E;
  handler: (
    ctx: Extract<HookContext, { hook_event_name: E }>,
  ) => void | Promise<void>;
}

// --- 2-10) Complete HookSpec union ---
export type HookSpec =
  | PreToolUseSpec<keyof ToolInputMap>
  | PostToolUseSpec<keyof ToolInputMap>
  | OtherSpec<OtherEvent>;
