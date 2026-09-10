// Mechanical UI-only brand replacement; repository/package/cookie names stay unchanged.
/* eslint-disable @typescript-eslint/no-require-imports -- Standalone CommonJS maintenance script. */
const fs = require('node:fs'); const path = require('node:path');
function visit(dir) { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir,e.name); if (e.isDirectory()) visit(p); else if (/\.(tsx?|json)$/.test(p) && !p.includes('.test.')) { const before = fs.readFileSync(p,'utf8'); const after = before.replaceAll('Fish ERP','HVG'); if (after !== before) fs.writeFileSync(p,after); } } }
visit(path.resolve(__dirname,'../src'));
