// Copy skills/docs-react (the source) to the root SKILL.md and into each plugin. Run after editing the skill.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(repo, "skills", "docs-react");
const targets = [path.join(repo, "plugins", "docs-react", "skills", "docs-react"), path.join(repo, "plugins", "docs-react-codex", "skills", "docs-react")];

fs.copyFileSync(path.join(src, "SKILL.md"), path.join(repo, "SKILL.md"));
for (const t of targets) {
  fs.rmSync(t, { recursive: true, force: true });
  fs.cpSync(src, t, { recursive: true });
}
console.log(`synced ${path.relative(repo, src)} -> SKILL.md, ${targets.map((t) => path.relative(repo, t)).join(", ")}`);
