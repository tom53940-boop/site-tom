const fs = require('fs');
const path = require('path');

const siteRoot = path.resolve(__dirname, '..');
const siteOrigin = 'https://www.finanssia.com';
const failures = [];
const documents = new Map();
const titles = new Map();
const descriptions = new Map();

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)].map(match => [match[1], match[2]]));
}

function fail(page, message) {
  failures.push(page + ': ' + message);
}

function registerUnique(values, value, page, label) {
  if (!value) fail(page, 'Missing ' + label);
  else if (values.has(value)) fail(page, 'Duplicate ' + label + ' shared with ' + values.get(value));
  else values.set(value, page);
}

function resolveSiteFile(url) {
  const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  let target = path.resolve(siteRoot, relative);
  if (path.relative(siteRoot, target).startsWith('..')) return null;
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
  return fs.existsSync(target) && fs.statSync(target).isFile() ? target : null;
}

const pageFiles = fs.readdirSync(siteRoot, { recursive: true })
  .filter(file => file.endsWith('.html') && !file.split(/[\\/]/).some(part => part.startsWith('.') || part === 'node_modules'));

for (const file of pageFiles) {
  const html = fs.readFileSync(path.join(siteRoot, file), 'utf8');
  const page = '/' + file.replace(/\\/g, '/').replace(/index\.html$/, '');
  const url = siteOrigin + page;
  documents.set(url, html);
  registerUnique(titles, html.match(/<title>([^<]+)<\/title>/)?.[1], page, 'title');
  const metas = [...html.matchAll(/<meta\b[^>]*>/g)].map(match => attributes(match[0]));
  registerUnique(descriptions, metas.find(meta => meta.name === 'description')?.content, page, 'description');
  const canonicals = [...html.matchAll(/<link\b[^>]*>/g)].map(match => attributes(match[0])).filter(link => link.rel === 'canonical');
  if (canonicals.length !== 1 || canonicals[0].href !== url) fail(page, 'Canonical URL does not match page');
  if ([...html.matchAll(/<h1\b/g)].length !== 1) fail(page, 'Expected exactly one H1');
  if (!/<html\s+lang="fr"/.test(html)) fail(page, 'Missing French document language');
  if (metas.some(meta => meta.name === 'robots' && /noindex|none/.test(meta.content))) fail(page, 'Page is marked noindex');

  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  if (new Set(ids).size !== ids.length) fail(page, 'Duplicate HTML IDs');

  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const schema = JSON.parse(match[1]);
      if (schema['@type'] === 'Article') {
        const authorPage = resolveSiteFile(new URL(schema.author.url));
        if (!authorPage) fail(page, 'Article author profile is missing');
        if (!/rel="author"/.test(html)) fail(page, 'Article has no visible author link');
      }
    } catch (error) {
      fail(page, 'Invalid structured data: ' + error.message);
    }
  }

  for (const match of html.matchAll(/<img\b[^>]*>/g)) {
    const image = attributes(match[0]);
    if (!Object.hasOwn(image, 'alt')) fail(page, 'Image is missing alt text: ' + image.src);
    if (!(Number(image.width) > 0 && Number(image.height) > 0)) fail(page, 'Image dimensions are missing: ' + image.src);
  }
}

for (const [pageUrl, html] of documents) {
  const references = [...html.matchAll(/<(?:a|link|script|img|source)\b[^>]*>/g)].flatMap(match => {
    const tag = attributes(match[0]);
    return [
      tag.href,
      tag.src,
      ...(tag.srcset ? tag.srcset.split(',').map(candidate => candidate.trim().split(/\s+/)[0]) : [])
    ].filter(Boolean);
  });
  for (const reference of references) {
    if (/^(?:mailto:|tel:|data:)/.test(reference)) continue;
    const url = new URL(reference.replaceAll('&amp;', '&'), pageUrl);
    if (url.origin !== siteOrigin) continue;
    const target = resolveSiteFile(url);
    if (!target) {
      fail(pageUrl, 'Broken local reference: ' + reference);
      continue;
    }
    if (url.hash && target.endsWith('.html')) {
      const fragment = decodeURIComponent(url.hash.slice(1));
      const targetHtml = fs.readFileSync(target, 'utf8');
      if (!targetHtml.includes('id="' + fragment + '"')) fail(pageUrl, 'Missing link fragment: ' + reference);
    }
  }
}

const sitemap = fs.readFileSync(path.join(siteRoot, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
if (new Set(sitemapUrls).size !== sitemapUrls.length) fail('sitemap.xml', 'Duplicate URLs');
for (const url of documents.keys()) if (!sitemapUrls.includes(url)) fail('sitemap.xml', 'Missing page: ' + url);
for (const url of sitemapUrls) if (!documents.has(url)) fail('sitemap.xml', 'Unknown page: ' + url);
if (!fs.readFileSync(path.join(siteRoot, 'robots.txt'), 'utf8').includes(siteOrigin + '/sitemap.xml')) fail('robots.txt', 'Missing sitemap declaration');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('OK: ' + documents.size + ' pages checked; metadata, structured data, sitemap, images and local links are consistent.');
}
