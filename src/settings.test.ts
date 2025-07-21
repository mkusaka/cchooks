import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { generateSettings } from "./settings";
import { clearHooks, onPreToolUse, onUserPromptSubmit } from "./hooks";
import * as fs from "fs";
import * as os from "os";

vi.mock("fs");

describe("generateSettings", () => {
  const mockFs = fs as any;

  beforeEach(() => {
    clearHooks();
    vi.clearAllMocks();

    // Mock process.cwd()
    vi.spyOn(process, "cwd").mockReturnValue("/test/project");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("when settings.json does not exist", () => {
    beforeEach(() => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => {});
      mockFs.writeFileSync.mockImplementation(() => {});
    });

    it("should create new settings file with empty hooks section", () => {
      const result = generateSettings(
        "./run_hook.ts",
        "node --experimental-strip-types",
        false,
      );

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        ".claude/settings.json",
        expect.stringContaining('"hooks": {'),
        "utf8",
      );
      expect(typeof result).toBe("string");
    });

    it("should add registered hooks to settings", () => {
      onPreToolUse("Write", { paths: ["src/**/*.ts"] }, () => {});
      onUserPromptSubmit(() => {});

      generateSettings(
        "./run_hook.ts",
        "node --experimental-strip-types",
        false,
      );

      const writeCall = mockFs.writeFileSync.mock.calls[0];
      const content = writeCall[1];
      const settings = JSON.parse(content);

      expect(settings.hooks.PreToolUse).toHaveLength(1);
      expect(settings.hooks.PreToolUse[0]).toMatchObject({
        matcher: "Write",
        paths: ["src/**/*.ts"],
        hooks: [
          {
            type: "command",
            command: "node --experimental-strip-types ./run_hook.ts",
          },
        ],
      });

      expect(settings.hooks.UserPromptSubmit).toHaveLength(1);
      expect(settings.hooks.UserPromptSubmit[0]).toMatchObject({
        hooks: [
          {
            type: "command",
            command: "node --experimental-strip-types ./run_hook.ts",
          },
        ],
      });
    });

    it("should include tool commands in hooks", () => {
      onPreToolUse("Bash", () => {});

      generateSettings("./run_hook.ts", "tsx", false);

      const writeCall = mockFs.writeFileSync.mock.calls[0];
      const content = writeCall[1];
      const settings = JSON.parse(content);

      expect(settings.hooks.PreToolUse[0].hooks[0].command).toBe(
        "tsx ./run_hook.ts",
      );
    });

    it("should return diff when dry-run is true", () => {
      onPreToolUse("Write", () => {});

      const result = generateSettings(
        "./run_hook.ts",
        "node --experimental-strip-types",
        true,
      );

      expect(mockFs.writeFileSync).not.toHaveBeenCalled();
      expect(result).toHaveProperty("diff");
      expect(result).toHaveProperty("newText");
    });
  });

  describe("when settings.json exists", () => {
    const existingSettings = {
      experimental: true,
      customInstructions: "Test instructions",
      hooks: {
        PreToolUse: {
          Bash: {
            runHook: "/existing/hook.ts",
            runnerCmd: "tsx",
          },
        },
      },
    };

    beforeEach(() => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(
        JSON.stringify(existingSettings, null, 2),
      );
      mockFs.writeFileSync.mockImplementation(() => {});
    });

    it("should generate settings with new hooks", () => {
      onPreToolUse("Write", { paths: ["**/*.md"] }, () => {});

      generateSettings(
        "./run_hook.ts",
        "node --experimental-strip-types",
        false,
      );

      const writeCall = mockFs.writeFileSync.mock.calls[0];
      const content = writeCall[1];
      const settings = JSON.parse(content);

      // Check generated settings structure
      expect(settings.hooks).toBeDefined();
      expect(settings.hooks.PreToolUse).toBeInstanceOf(Array);

      // Find the Write hook
      const writeHook = settings.hooks.PreToolUse.find(
        (h: any) => h.matcher === "Write",
      );
      expect(writeHook).toBeDefined();
      expect(writeHook.paths).toEqual(["**/*.md"]);
      expect(writeHook.hooks[0].command).toContain(
        "node --experimental-strip-types ./run_hook.ts",
      );
    });

    it("should add new hook configuration", () => {
      onPreToolUse("Bash", { paths: ["scripts/**/*.sh"] }, () => {});

      generateSettings("./new_hook.ts", "node", false);

      const writeCall = mockFs.writeFileSync.mock.calls[0];
      const content = writeCall[1];
      const settings = JSON.parse(content);

      const bashHook = settings.hooks.PreToolUse.find(
        (h: any) => h.matcher === "Bash",
      );
      expect(bashHook).toBeDefined();
      expect(bashHook.paths).toEqual(["scripts/**/*.sh"]);
      expect(bashHook.hooks[0].command).toBe("node ./new_hook.ts");
    });

    it("should show diff when dry-run is true", () => {
      onPreToolUse("Write", () => {});

      const result = generateSettings(
        "./run_hook.ts",
        "node --experimental-strip-types",
        true,
      );

      expect(mockFs.writeFileSync).not.toHaveBeenCalled();
      expect(result).toHaveProperty("diff");
      expect(result.diff).toContain("PreToolUse");
      expect(result.diff).toContain("Write");
    });
  });

  describe("edge cases", () => {
    it("should handle hooks with pathsIgnore", () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => {});
      mockFs.writeFileSync.mockImplementation(() => {});

      onPreToolUse(
        "Write",
        { paths: ["src/**/*"], pathsIgnore: ["**/*.test.ts"] },
        () => {},
      );

      generateSettings(
        "./run_hook.ts",
        "node --experimental-strip-types",
        false,
      );

      const writeCall = mockFs.writeFileSync.mock.calls[0];
      const content = writeCall[1];
      const settings = JSON.parse(content);

      const writeHook = settings.hooks.PreToolUse.find(
        (h: any) => h.matcher === "Write",
      );
      expect(writeHook).toBeDefined();
      expect(writeHook.paths).toEqual(["src/**/*"]);
      expect(writeHook.pathsIgnore).toEqual(["**/*.test.ts"]);
      expect(writeHook.hooks[0].command).toBe(
        "node --experimental-strip-types ./run_hook.ts",
      );
    });

    it("should handle multiple hooks for different tools", () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => {});
      mockFs.writeFileSync.mockImplementation(() => {});

      onPreToolUse("Write", () => {});
      onPreToolUse("Bash", () => {});
      onPreToolUse("Glob", { paths: ["**/*.js"] }, () => {});

      generateSettings(
        "./run_hook.ts",
        "node --experimental-strip-types",
        false,
      );

      const writeCall = mockFs.writeFileSync.mock.calls[0];
      const content = writeCall[1];
      const settings = JSON.parse(content);

      expect(settings.hooks.PreToolUse).toHaveLength(3);

      const matchers = settings.hooks.PreToolUse.map((h: any) => h.matcher);
      expect(matchers).toContain("Write");
      expect(matchers).toContain("Bash");
      expect(matchers).toContain("Glob");

      const globHook = settings.hooks.PreToolUse.find(
        (h: any) => h.matcher === "Glob",
      );
      expect(globHook.paths).toEqual(["**/*.js"]);
    });
  });

  describe("scope handling", () => {
    beforeEach(() => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => {});
      mockFs.writeFileSync.mockImplementation(() => {});
    });

    it("should write to user scope", () => {
      onPreToolUse("Write", () => {});

      const result = generateSettings(
        "./run_hook.ts",
        "node --experimental-strip-types",
        false,
        "user",
      );

      const expectedPath = `${os.homedir()}/.claude/settings.json`;
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expectedPath,
        expect.any(String),
        "utf8",
      );
      expect(result).toBe(expectedPath);
    });

    it("should write to project scope", () => {
      onPreToolUse("Write", () => {});

      const result = generateSettings(
        "./run_hook.ts",
        "node --experimental-strip-types",
        false,
        "project",
      );

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        ".claude/settings.json",
        expect.any(String),
        "utf8",
      );
      expect(result).toBe(".claude/settings.json");
    });

    it("should write to local scope", () => {
      onPreToolUse("Write", () => {});

      const result = generateSettings(
        "./run_hook.ts",
        "node --experimental-strip-types",
        false,
        "local",
      );

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        ".claude/settings.local.json",
        expect.any(String),
        "utf8",
      );
      expect(result).toBe(".claude/settings.local.json");
    });

    it("should create directory for user scope if not exists", () => {
      mockFs.existsSync.mockReturnValue(false);
      onPreToolUse("Write", () => {});

      generateSettings(
        "./run_hook.ts",
        "node --experimental-strip-types",
        false,
        "user",
      );

      const expectedDir = `${os.homedir()}/.claude`;
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(expectedDir, { recursive: true });
    });
  });
});
