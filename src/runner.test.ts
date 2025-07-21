import { describe, it, expect, beforeEach, vi } from "vitest";
import { runHook } from "./runner";
import {
  clearHooks,
  onPreToolUse,
  onPostToolUse,
  onUserPromptSubmit,
} from "./hooks";
import type { HookContext } from "./types";

describe("runHook", () => {
  beforeEach(() => {
    clearHooks();
    vi.clearAllMocks();
  });

  describe("PreToolUse hooks", () => {
    it("should execute matching PreToolUse hook", async () => {
      const handler = vi.fn();
      onPreToolUse("Write", handler);

      const ctx: HookContext = {
        hook_event_name: "PreToolUse",
        tool_name: "Write",
        tool_input: { file_path: "/test.ts", content: "test" },
        session_id: "test-session",
        transcript_path: "/transcript.txt",
        cwd: "/project",
      };

      await runHook(ctx);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(ctx);
    });

    it("should not execute hook for different tool", async () => {
      const handler = vi.fn();
      onPreToolUse("Write", handler);

      const ctx: HookContext = {
        hook_event_name: "PreToolUse",
        tool_name: "Bash",
        tool_input: { command: "ls" },
        session_id: "test-session",
        transcript_path: "/transcript.txt",
        cwd: "/project",
      };

      await runHook(ctx);

      expect(handler).not.toHaveBeenCalled();
    });

    it("should execute hook with matching path filter", async () => {
      const handler = vi.fn();
      onPreToolUse("Write", { paths: ["src/**/*.ts"] }, handler);

      const ctx: HookContext = {
        hook_event_name: "PreToolUse",
        tool_name: "Write",
        tool_input: { file_path: "src/index.ts", content: "test" },
        session_id: "test-session",
        transcript_path: "/transcript.txt",
        cwd: "/project",
      };

      await runHook(ctx);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should not execute hook with non-matching path filter", async () => {
      const handler = vi.fn();
      onPreToolUse("Write", { paths: ["src/**/*.ts"] }, handler);

      const ctx: HookContext = {
        hook_event_name: "PreToolUse",
        tool_name: "Write",
        tool_input: { file_path: "docs/readme.md", content: "test" },
        session_id: "test-session",
        transcript_path: "/transcript.txt",
        cwd: "/project",
      };

      await runHook(ctx);

      expect(handler).not.toHaveBeenCalled();
    });

    it("should not execute hook with pathsIgnore filter", async () => {
      const handler = vi.fn();
      onPreToolUse(
        "Write",
        { paths: ["src/**/*.ts"], pathsIgnore: ["**/*.test.ts"] },
        handler,
      );

      const ctx: HookContext = {
        hook_event_name: "PreToolUse",
        tool_name: "Write",
        tool_input: { file_path: "src/index.test.ts", content: "test" },
        session_id: "test-session",
        transcript_path: "/transcript.txt",
        cwd: "/project",
      };

      await runHook(ctx);

      expect(handler).not.toHaveBeenCalled();
    });

    it("should execute hook for tool without file_path when path filter is set", async () => {
      const handler = vi.fn();
      onPreToolUse("Bash", { paths: ["**/*.sh"] }, handler);

      const ctx: HookContext = {
        hook_event_name: "PreToolUse",
        tool_name: "Bash",
        tool_input: { command: "echo test" },
        session_id: "test-session",
        transcript_path: "/transcript.txt",
        cwd: "/project",
      };

      await runHook(ctx);

      // Should execute because Bash doesn't have file_path
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should execute hook with pathsIgnore for tool without file_path", async () => {
      const handler = vi.fn();
      onPreToolUse("Bash", { pathsIgnore: ["**/*.sh"] }, handler);

      const ctx: HookContext = {
        hook_event_name: "PreToolUse",
        tool_name: "Bash",
        tool_input: { command: "echo test" },
        session_id: "test-session",
        transcript_path: "/transcript.txt",
        cwd: "/project",
      };

      await runHook(ctx);

      // Should execute because Bash doesn't have file_path
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("PostToolUse hooks", () => {
    it("should execute matching PostToolUse hook", async () => {
      const handler = vi.fn();
      onPostToolUse("Bash", handler);

      const ctx: HookContext = {
        hook_event_name: "PostToolUse",
        tool_name: "Bash",
        tool_input: { command: "ls -la" },
        session_id: "test-session",
        transcript_path: "/transcript.txt",
        cwd: "/project",
      };

      await runHook(ctx);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(ctx);
    });

    it("should not execute PostToolUse hook with non-matching path filter", async () => {
      const handler = vi.fn();
      onPostToolUse("Write", { paths: ["**/*.md"] }, handler);

      const ctx: HookContext = {
        hook_event_name: "PostToolUse",
        tool_name: "Write",
        tool_input: { file_path: "src/index.ts", content: "test" },
        session_id: "test-session",
        transcript_path: "/transcript.txt",
        cwd: "/project",
      };

      await runHook(ctx);

      expect(handler).not.toHaveBeenCalled();
    });

    it("should not execute PostToolUse hook with matching pathsIgnore", async () => {
      const handler = vi.fn();
      onPostToolUse("Write", { pathsIgnore: ["**/*.test.ts"] }, handler);

      const ctx: HookContext = {
        hook_event_name: "PostToolUse",
        tool_name: "Write",
        tool_input: { file_path: "src/index.test.ts", content: "test" },
        session_id: "test-session",
        transcript_path: "/transcript.txt",
        cwd: "/project",
      };

      await runHook(ctx);

      expect(handler).not.toHaveBeenCalled();
    });

    it("should execute PostToolUse hook for Glob with path filter", async () => {
      const handler = vi.fn();
      onPostToolUse("Glob", { paths: ["**/*.js"] }, handler);

      const ctx: HookContext = {
        hook_event_name: "PostToolUse",
        tool_name: "Glob",
        tool_input: { pattern: "**/*.ts" },
        session_id: "test-session",
        transcript_path: "/transcript.txt",
        cwd: "/project",
      };

      await runHook(ctx);

      // Should execute because Glob doesn't have file_path
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("UserPromptSubmit hooks", () => {
    it("should execute UserPromptSubmit hook", async () => {
      const handler = vi.fn();
      onUserPromptSubmit(handler);

      const ctx: HookContext = {
        hook_event_name: "UserPromptSubmit",
        prompt: "Test prompt",
        session_id: "test-session",
        transcript_path: "/transcript.txt",
        cwd: "/project",
      };

      await runHook(ctx);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(ctx);
    });

    it("should handle hook throwing error", async () => {
      const handler = vi.fn().mockImplementation(() => {
        throw new Error("Sensitive information detected");
      });
      onUserPromptSubmit(handler);

      const ctx: HookContext = {
        hook_event_name: "UserPromptSubmit",
        prompt: "secret password",
        session_id: "test-session",
        transcript_path: "/transcript.txt",
        cwd: "/project",
      };

      await expect(runHook(ctx)).rejects.toThrow(
        "Sensitive information detected",
      );
    });
  });

  describe("Multiple hooks", () => {
    it("should execute multiple matching hooks in order", async () => {
      const order: number[] = [];
      const handler1 = vi.fn().mockImplementation(() => {
        order.push(1);
      });
      const handler2 = vi.fn().mockImplementation(() => {
        order.push(2);
      });

      onPreToolUse("Write", handler1);
      onPreToolUse("Write", handler2);

      const ctx: HookContext = {
        hook_event_name: "PreToolUse",
        tool_name: "Write",
        tool_input: { file_path: "/test.ts", content: "test" },
        session_id: "test-session",
        transcript_path: "/transcript.txt",
        cwd: "/project",
      };

      await runHook(ctx);

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
      expect(order).toEqual([1, 2]);
    });

    it("should stop execution if a hook throws", async () => {
      const handler1 = vi.fn().mockImplementation(() => {
        throw new Error("Stop!");
      });
      const handler2 = vi.fn();

      onPreToolUse("Write", handler1);
      onPreToolUse("Write", handler2);

      const ctx: HookContext = {
        hook_event_name: "PreToolUse",
        tool_name: "Write",
        tool_input: { file_path: "/test.ts", content: "test" },
        session_id: "test-session",
        transcript_path: "/transcript.txt",
        cwd: "/project",
      };

      await expect(runHook(ctx)).rejects.toThrow("Stop!");
      expect(handler1).toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe("Async hooks", () => {
    it("should handle async hooks", async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      onUserPromptSubmit(handler);

      const ctx: HookContext = {
        hook_event_name: "UserPromptSubmit",
        prompt: "Test",
        session_id: "test-session",
        transcript_path: "/transcript.txt",
        cwd: "/project",
      };

      await runHook(ctx);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should handle async hook errors", async () => {
      const handler = vi.fn().mockRejectedValue(new Error("Async error"));
      onUserPromptSubmit(handler);

      const ctx: HookContext = {
        hook_event_name: "UserPromptSubmit",
        prompt: "Test",
        session_id: "test-session",
        transcript_path: "/transcript.txt",
        cwd: "/project",
      };

      await expect(runHook(ctx)).rejects.toThrow("Async error");
    });
  });

  describe("Other event types", () => {
    it("should handle Notification hooks", async () => {
      const { onNotification } = await import("./hooks");
      const handler = vi.fn();
      onNotification(handler);

      const ctx: HookContext = {
        hook_event_name: "Notification",
        message: "Test notification",
        session_id: "test-session",
        transcript_path: "/transcript.txt",
        cwd: "/project",
      };

      await runHook(ctx);

      expect(handler).toHaveBeenCalledWith(ctx);
    });

    it("should handle PreCompact hooks", async () => {
      const { onPreCompact } = await import("./hooks");
      const handler = vi.fn();
      onPreCompact(handler);

      const ctx: HookContext = {
        hook_event_name: "PreCompact",
        trigger: "manual",
        custom_instructions: "test",
        session_id: "test-session",
        transcript_path: "/transcript.txt",
        cwd: "/project",
      };

      await runHook(ctx);

      expect(handler).toHaveBeenCalledWith(ctx);
    });

    it("should handle Stop hooks", async () => {
      const { onStop } = await import("./hooks");
      const handler = vi.fn();
      onStop(handler);

      const ctx: HookContext = {
        hook_event_name: "Stop",
        stop_hook_active: true,
        session_id: "test-session",
        transcript_path: "/transcript.txt",
        cwd: "/project",
      };

      await runHook(ctx);

      expect(handler).toHaveBeenCalledWith(ctx);
    });

    it("should handle SubagentStop hooks", async () => {
      const { onSubagentStop } = await import("./hooks");
      const handler = vi.fn();
      onSubagentStop(handler);

      const ctx: HookContext = {
        hook_event_name: "SubagentStop",
        stop_hook_active: false,
        session_id: "test-session",
        transcript_path: "/transcript.txt",
        cwd: "/project",
      };

      await runHook(ctx);

      expect(handler).toHaveBeenCalledWith(ctx);
    });
  });
});
