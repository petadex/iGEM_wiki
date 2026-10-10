const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "src", "content", "wiki", "hardware", "hardware-code");
const out = path.join(__dirname, "..", "src", "generated", "hardwareCode.json");
const MAX_CHARS = 200000; // keep huge data files from bloating the bundle

const result = {};
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(p); continue; }
    let text = fs.readFileSync(p, "utf8");
    if (text.length > MAX_CHARS) {
      text = text.slice(0, MAX_CHARS) + "\n\n... [truncated: file too large to display]";
    }
    result[entry.name] = text; // keyed by filename; yours are all unique
  }
})(root);

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(result));
console.log(`hardwareCode.json: ${Object.keys(result).length} files`);