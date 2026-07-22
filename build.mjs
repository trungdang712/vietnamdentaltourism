// Build: minify index.html into dist/, copy everything else verbatim.
// Source of truth stays readable in git; Vercel runs this at deploy (see vercel.json).
import { minify } from 'html-minifier-terser';
import { cpSync, mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, 'dist');

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

// ── 1. Minify index.html ──
const src = readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const out = await minify(src, {
  collapseWhitespace: true,
  conservativeCollapse: true,        // collapse to 1 space, never remove — rendering stays identical
  removeComments: true,
  // Cloudflare needs the email_off/email_on markers to keep email obfuscation disabled
  ignoreCustomComments: [/^\s*email_(off|on)\s*$/],
  minifyCSS: true,
  // Minify <script> blocks, but leave inline event-handler attributes untouched —
  // some onclick handlers use lenient quoting that browsers accept but parsers reject.
  minifyJS: (text, inline) => {
    if (inline) return text;
    return text; // placeholder — replaced below via terser for block scripts
  },
});

// Second pass: terser the <script> blocks ourselves (html-minifier's inline flag
// covers attributes; block scripts we minify explicitly, skipping JSON-LD).
const { minify: terserMinify } = await import('terser');
let html = out;
const scriptRe = /(<script)((?:(?!src=)[^>])*)>([\s\S]*?)(<\/script>)/gi;
const jobs = [];
html.replace(scriptRe, (m, open, attrs, body, close) => {
  if (/type\s*=\s*["']application\/ld\+json["']/i.test(attrs)) return m;
  if (!body.trim()) return m;
  jobs.push({ m, open, attrs, body, close });
  return m;
});
for (const j of jobs) {
  try {
    const res = await terserMinify(j.body, { compress: { defaults: true }, mangle: false, format: { comments: false } });
    if (res.code) html = html.replace(j.m, j.open + j.attrs + '>' + res.code + j.close);
  } catch (e) {
    console.warn('terser skipped one block:', String(e.message).slice(0, 80));
  }
}
writeFileSync(path.join(DIST, 'index.html'), html);

// ── 2. Copy everything else verbatim ──
// gflex.html / lp-implants.html / Downloads: pre-migration orphans that were
// being SERVED — gflex.html posts to a DEAD endpoint and silently ate leads.
// Excluded 2026-07-22 so they 404; the campaigns live on their own domains
// (clearalignersvietnam.com / dentalimplantsinvietnam.com).
const EXCLUDE = new Set(['dist', 'node_modules', '.git', '.vercel', 'index.html', 'build.mjs',
  'package.json', 'package-lock.json', 'vercel.json', '.gitignore', '.DS_Store',
  'gflex.html', 'lp-implants.html', 'Downloads']);
for (const entry of readdirSync(ROOT)) {
  if (EXCLUDE.has(entry) || entry.endsWith('.md')) continue;
  cpSync(path.join(ROOT, entry), path.join(DIST, entry), { recursive: true });
}

// ── 3. Report ──
const before = statSync(path.join(ROOT, 'index.html')).size;
const after = statSync(path.join(DIST, 'index.html')).size;
console.log(`index.html: ${before} -> ${after} bytes (${Math.round((1 - after / before) * 100)}% smaller)`);
if (!html.includes('email_off')) { console.error('FATAL: email_off marker lost'); process.exit(1); }
if (after < before * 0.5) { console.error('FATAL: suspicious shrink >50% — aborting'); process.exit(1); }
console.log('build OK');
