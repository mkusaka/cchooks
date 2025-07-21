#!/usr/bin/env node
// Import your hook definitions first
import "./my-hooks";

// Then import the runner
import getStdin from "get-stdin";
import { runHook } from "../dist/runner";
import type { HookContext } from "../dist/types";

async function main(): Promise<void> {
  const raw = await getStdin();
  const ctx = JSON.parse(raw) as HookContext;
  await runHook(ctx);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});