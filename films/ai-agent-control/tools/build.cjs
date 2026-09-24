#!/usr/bin/env node
// build.cjs : inline every file in contract load order into one self-contained HTML page.
//
//   node tools/build.cjs                 writes dist/<slug>.html (slug = project folder name)
//   node tools/build.cjs --fixtures      writes dist/<slug>-fixtures.html from tools/fixtures
//   node tools/build.cjs --out path.html
//
// Page: black background, canvas fitted to the window at 9:16, click or space to play/pause with
// audio, left/right arrows to step, ?t=seconds for a still, ?shot=id to loop a shot, ?render=1 hides UI.
'use strict';

const fs = require('fs');
const path = require('path');
const C = require('./common.cjs');

function build({ fixtures = false, out = null, quiet = false, lenient = false } = {}) {
  const src = C.sources({ fixtures, player: true, lenient });
  const outFile = out ? C.resolveOut(out) : path.join(C.ROOT, 'dist', fixtures ? `${C.SLUG}-fixtures.html` : `${C.SLUG}.html`);
  const parts = src.files.filter((f) => fs.existsSync(f)).map((f) => {
    const code = fs.readFileSync(f, 'utf8').replace(/<\/script/gi, '<\\/script');
    return `<script>\n// ---- ${path.relative(C.ROOT, f)}\n${code}\n</script>`;
  });
  const title = fixtures ? `${C.SLUG} (fixtures)` : (src.timeline.raw && src.timeline.raw.title) || C.SLUG;
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${title}</title>
<style>html,body{margin:0;height:100%;background:#000}</style>
</head>
<body>
${parts.join('\n')}
</body>
</html>
`;
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, html);
  const hits = C.scanForbidden(html);
  if (!quiet) {
    for (const w of src.warnings) console.log(`[warn] ${w}`);
    console.log(`${src.files.length} files inlined -> ${outFile} (${(html.length / 1024).toFixed(1)} KB)`);
    for (const f of src.files) console.log(`  ${path.relative(C.ROOT, f)}`);
    if (hits.length) {
      console.log(`[warn] ${hits.length} forbidden media pattern(s); run tools/check.cjs for details`);
    }
  }
  return { outFile, html, hits, src };
}

if (require.main === module) {
  const args = C.parseArgs(process.argv.slice(2), ['fixtures']);
  build({ fixtures: typeof args.fixtures === 'string' ? args.fixtures : !!args.fixtures, out: typeof args.out === 'string' ? args.out : null });
}

module.exports = { build };
