// Greps the STAGED changes for secret patterns. Exit 1 on a match, 0 when clean.
// Patterns: .claude/skills/adhdcheck-dev/SKILL.md, section 1 (broad words), plus provider key shapes.
// Only added lines are scanned. The broad words are skipped in markdown files (docs name variables),
// the hard shapes are checked everywhere. Env-file lines that are `NAME=` with no value are fine.
import { execFileSync } from "node:child_process";

const git = (args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

const BROAD = /api[_-]?key|secret|password|token|sk_live_|sk_test_|service_role|BEGIN (RSA|OPENSSH|PRIVATE)/i;
const HARD = [
  /sk_(live|test)_[A-Za-z0-9]{8,}/,
  /whsec_[A-Za-z0-9]{8,}/,
  /re_[A-Za-z0-9]{20,}/,
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\./,
  /BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY/,
  /sb_secret_[A-Za-z0-9_-]{8,}/,
];
const SELF = "scripts/check-secrets.mjs";

const names = git(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]).split("\n").filter(Boolean);
const problems = [];

for (const n of names) {
  if (/(^|\/)\.env($|\.)/i.test(n) && !/(^|\/)\.env\.example$/i.test(n)) problems.push(`${n}: env file staged`);
}

const diff = git(["diff", "--cached", "-U0", "--no-color", "--", ".", `:(exclude)${SELF}`]);
let file = "";
for (const line of diff.split("\n")) {
  if (line.startsWith("+++ b/")) file = line.slice(6);
  if (!line.startsWith("+") || line.startsWith("+++")) continue;
  const text = line.slice(1);
  if (/^[A-Z0-9_]+=\s*$/.test(text)) continue; // `.env.example` name with no value
  // Broad words are skipped on comment lines, on this check's own npm script line, and on a code line
  // ending with `// check-secrets: allow` (auth code names passwords and tokens; read the line first);
  // hard key shapes are still checked there.
  const broadExempt =
    /^\s*(#|\/\/)/.test(text) ||
    /\/\/ check-secrets: allow\s*$/.test(text) ||
    /"check:secrets":\s*"node scripts\/check-secrets\.mjs"/.test(text);
  if (HARD.some((re) => re.test(text))) problems.push(`${file}: secret-shaped value`);
  else if (!broadExempt && !file.endsWith(".md") && BROAD.test(text)) problems.push(`${file}: contains a secret-like word (read the line, then unstage or reword)`);
}

if (problems.length) {
  console.error("check:secrets FAILED");
  for (const p of [...new Set(problems)]) console.error("  " + p);
  process.exit(1);
}
console.log(`check:secrets ok (${names.length} staged file(s) scanned)`);
