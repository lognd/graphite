// `make check`'s frontend-codegen drift leg (spec 02 sec. 2): regenerate
// api.generated.ts into a temp file and byte-compare against the
// committed one. Node/npx is a DEV dependency only (spec 02 sec. 5) --
// this script never runs as part of the shipped wheel.
import { execFileSync } from "node:child_process";
import { readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const here = path.dirname(new URL(import.meta.url).pathname);
const committedPath = path.join(here, "src", "api", "api.generated.ts");
const openapiPath = path.join(here, "..", "openapi.json");

const tmpDir = mkdtempSync(path.join(tmpdir(), "graphite-api-drift-"));
const tmpOut = path.join(tmpDir, "api.generated.ts");

execFileSync(
  "npx",
  ["--yes", "openapi-typescript", openapiPath, "-o", tmpOut],
  { stdio: "inherit" },
);

const committed = readFileSync(committedPath, "utf8");
const fresh = readFileSync(tmpOut, "utf8");

if (committed !== fresh) {
  console.error(
    "check-api-drift: frontend/src/api/api.generated.ts is stale -- " +
      "run `npm run gen:api` (in frontend/) and commit the result",
  );
  process.exit(1);
}
console.log("check-api-drift: api.generated.ts is up to date");
