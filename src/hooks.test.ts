import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  onPreToolUse,
  onPostToolUse,
  onUserPromptSubmit,
  onNotification,
  onPreCompact,
  onStop,
  onSubagentStop,
  clearHooks,
  getHookSpecs,
} from "./hooks";

describe("hooks", () => {
  beforeEach(() => {
    clearHooks();
  });

  describe("onPreToolUse", () => {
    it("should register a hook without path filter", () => {
      const handler = vi.fn();
      onPreToolUse("Write", handler);

      const specs = getHookSpecs();
      expect(specs).toHaveLength(1);
      expect(specs[0]).toMatchObject({
        event: "PreToolUse",
        matcher: { value: "Write" },
        handler,
      });
    });

    it("should register a hook with path filter", () => {
      const handler = vi.fn();
      onPreToolUse(
        "Write",
        { paths: ["src/**/*.ts"], pathsIgnore: ["**/*.test.ts"] },
        handler,
      );

      const specs = getHookSpecs();
      expect(specs).toHaveLength(1);
      expect(specs[0]).toMatchObject({
        event: "PreToolUse",
        matcher: { value: "Write" },
        paths: ["src/**/*.ts"],
        pathsIgnore: ["**/*.test.ts"],
        handler,
      });
    });

    it("should register multiple hooks", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      onPreToolUse("Write", handler1);
      onPreToolUse("Bash", handler2);

      const specs = getHookSpecs();
      expect(specs).toHaveLength(2);

      // Type guard to check if spec has matcher property
      const spec0 = specs[0];
      const spec1 = specs[1];

      if (spec0.event === "PreToolUse" || spec0.event === "PostToolUse") {
        expect(spec0.matcher.value).toBe("Write");
      }

      if (spec1.event === "PreToolUse" || spec1.event === "PostToolUse") {
        expect(spec1.matcher.value).toBe("Bash");
      }
    });
  });

  describe("onPostToolUse", () => {
    it("should register a post tool use hook", () => {
      const handler = vi.fn();
      onPostToolUse("Bash", handler);

      const specs = getHookSpecs();
      expect(specs).toHaveLength(1);
      expect(specs[0]).toMatchObject({
        event: "PostToolUse",
        matcher: { value: "Bash" },
        handler,
      });
    });

    it("should register a post tool use hook with path filter", () => {
      const handler = vi.fn();
      onPostToolUse("Glob", { paths: ["**/*.js"] }, handler);

      const specs = getHookSpecs();
      expect(specs).toHaveLength(1);
      expect(specs[0]).toMatchObject({
        event: "PostToolUse",
        matcher: { value: "Glob" },
        paths: ["**/*.js"],
        handler,
      });
    });
  });

  describe("onUserPromptSubmit", () => {
    it("should register a user prompt submit hook", () => {
      const handler = vi.fn();
      onUserPromptSubmit(handler);

      const specs = getHookSpecs();
      expect(specs).toHaveLength(1);
      expect(specs[0]).toMatchObject({
        event: "UserPromptSubmit",
        handler,
      });
    });
  });

  describe("onNotification", () => {
    it("should register a notification hook", () => {
      const handler = vi.fn();
      onNotification(handler);

      const specs = getHookSpecs();
      expect(specs).toHaveLength(1);
      expect(specs[0]).toMatchObject({
        event: "Notification",
        handler,
      });
    });
  });

  describe("onPreCompact", () => {
    it("should register a pre-compact hook", () => {
      const handler = vi.fn();
      onPreCompact(handler);

      const specs = getHookSpecs();
      expect(specs).toHaveLength(1);
      expect(specs[0]).toMatchObject({
        event: "PreCompact",
        handler,
      });
    });
  });

  describe("onStop", () => {
    it("should register a stop hook", () => {
      const handler = vi.fn();
      onStop(handler);

      const specs = getHookSpecs();
      expect(specs).toHaveLength(1);
      expect(specs[0]).toMatchObject({
        event: "Stop",
        handler,
      });
    });
  });

  describe("onSubagentStop", () => {
    it("should register a subagent stop hook", () => {
      const handler = vi.fn();
      onSubagentStop(handler);

      const specs = getHookSpecs();
      expect(specs).toHaveLength(1);
      expect(specs[0]).toMatchObject({
        event: "SubagentStop",
        handler,
      });
    });
  });

  describe("clearHooks", () => {
    it("should clear all registered hooks", () => {
      onPreToolUse("Write", vi.fn());
      onUserPromptSubmit(vi.fn());
      onNotification(vi.fn());

      expect(getHookSpecs()).toHaveLength(3);

      clearHooks();

      expect(getHookSpecs()).toHaveLength(0);
    });
  });
});
