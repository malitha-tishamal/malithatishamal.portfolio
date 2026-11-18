const fs = require("fs");

const html = fs.readFileSync(".next/analyze/client.html", "utf8");
const marker = "window.chartData = ";
const start = html.indexOf(marker) + marker.length;
let depth = 0;
let inStr = false;
let esc = false;
let end = -1;
for (let i = start; i < html.length; i++) {
  const c = html[i];
  if (inStr) {
    if (esc) esc = false;
    else if (c === "\\") esc = true;
    else if (c === '"') inStr = false;
    continue;
  }
  if (c === '"') {
    inStr = true;
    continue;
  }
  if (c === "[") depth++;
  else if (c === "]") {
    depth--;
    if (depth === 0) {
      end = i + 1;
      break;
    }
  }
}
const data = JSON.parse(html.slice(start, end));

const pkgs = {};
const add = (name, size) => {
  pkgs[name] = (pkgs[name] || 0) + size;
};

function packageFromPath(p) {
  const seg = p.split("/");
  if (seg[0] !== "node_modules") return null;
  return seg[1] && seg[1].startsWith("@") ? seg[1] + "/" + seg[2] : seg[1];
}

function walk(node, pkg, appPath) {
  const p = node.path || "";
  const nodePkg = packageFromPath(p) || pkg;
  const nodeApp = p.startsWith("./src") || p.startsWith("./") ? p : appPath;
  if (node.groups) {
    node.groups.forEach((g) => walk(g, nodePkg, nodeApp));
    return;
  }
  const size = node.parsedSize || node.statSize || 0;
  if (nodePkg) add(nodePkg, size);
  else if (nodeApp) add(`(app) ${nodeApp.replace(/^\.\//, "").split("/").slice(0, 2).join("/")}`, size);
  else add("(webpack)", size);
}

data.forEach((b) => walk(b, null, null));
const top = Object.entries(pkgs)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .map(([k, v]) => `${String(Math.round(v / 1024)).padStart(5)} kB  ${k}`);
console.log(top.join("\n"));
