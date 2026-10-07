/* Every page hand-repeats the header, footer, and disclaimer, because the site
   has no build step. This checks those blocks still match, and that each page
   carries the meta the site expects. Run: node tools/check-shared.mjs */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const IGNORE = new Set(['.git', 'node_modules', 'tools']);

const htmlFiles = dir =>
  readdirSync(dir).flatMap(name => {
    if (IGNORE.has(name)) return [];
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return htmlFiles(path);
    return name.endsWith('.html') ? [path] : [];
  });

const block = (source, open, close) => {
  const start = source.indexOf(open);
  if (start === -1) return null;
  const end = source.indexOf(close, start);
  if (end === -1) return null;
  return source.slice(start, end + close.length).trim();
};

const DISCLAIMER =
  'CreekStreet.org is an independent site about Creek Street and the projects coming to it.';

const REQUIRED = [
  ['viewport', 'name="viewport"'],
  ['canonical', 'rel="canonical"'],
  ['dark theme-color #071410', 'content="#071410"'],
  ['og:title', 'property="og:title"'],
  ['twitter:card', 'name="twitter:card"'],
  ['skip link', 'class="skip"'],
  ['stylesheet', 'href="/styles.css"'],
  ['site.js', 'src="/site.js"']
];

const pages = htmlFiles('.').sort();
const problems = [];
let reference = null;

for (const page of pages) {
  const source = readFileSync(page, 'utf8');

  const header = block(source, '<header class="masthead">', '</header>');
  const footer = block(source, '<footer>', '</footer>');

  if (!header) problems.push(`${page}: no <header class="masthead"> block`);
  if (!footer) problems.push(`${page}: no <footer> block`);
  if (!source.includes(DISCLAIMER)) problems.push(`${page}: disclaimer text altered or missing`);

  for (const [label, needle] of REQUIRED) {
    if (!source.includes(needle)) problems.push(`${page}: missing ${label}`);
  }

  /* root-relative links only work if the target is really there */
  for (const match of source.matchAll(/(?:href|src)="(\/[^"#]*)(?:#[^"]*)?"/g)) {
    const target = match[1] === '/' ? 'index.html' : match[1].replace(/^\//, '');
    if (!existsSync(target)) problems.push(`${page}: link to /${target} but no such file`);
  }

  if (!reference) {
    reference = { page, header, footer };
  } else {
    if (header && header !== reference.header) {
      problems.push(`${page}: header differs from ${reference.page}`);
    }
    if (footer && footer !== reference.footer) {
      problems.push(`${page}: footer differs from ${reference.page}`);
    }
  }
}

console.log(`checked ${pages.length} pages: ${pages.join(', ')}`);

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  problems.forEach(problem => console.error(`  - ${problem}`));
  process.exit(1);
}

console.log('header, footer, disclaimer, and meta all consistent');
