#!/usr/bin/env node
// Import hook definitions first
import "./my-hooks";

// Then execute runHook
import getStdin from "get-stdin";
import { runHook } from "./dist/runner";

async function main() {
  const raw = await getStdin();
  const ctx = JSON.parse(raw);
  await runHook(ctx);
}
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
