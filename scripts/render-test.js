const { createServer } = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = process.cwd();
const port = 4173;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json'
};

function send(res, code, type, body) {
  res.writeHead(code, { 'content-type': type });
  res.end(body);
}

const server = createServer((req, res) => {
  let requestPath = (req.url || '/').split('?')[0].split('#')[0];
  if (requestPath === '/') requestPath = '/index.html';

  const attempts = [
    requestPath,
    requestPath.endsWith('/') ? `${requestPath}index.html` : `${requestPath}/index.html`
  ];

  let found = null;
  for (const p of attempts) {
    const filePath = path.join(root, decodeURIComponent(p).replace(/^\/+/, ''));
    if (filePath.startsWith(root) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      found = filePath;
      break;
    }
  }

  if (!found) {
    send(res, 404, 'text/plain', 'Not found');
    return;
  }

  const ext = path.extname(found).toLowerCase();
  send(res, 200, mime[ext] || 'application/octet-stream', fs.readFileSync(found));
});

async function run() {
  const base = `http://127.0.0.1:${port}`;
  const pages = [
    '/',
    '/services/',
    '/demarche/',
    '/prendre-rendez-vous/',
    '/recrutement/',
    '/contact/',
    '/mentions-legales/',
  ];

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const issues = [];

  for (const p of pages) {
    const failedRequests = [];
    page.removeAllListeners('requestfailed');
    page.on('requestfailed', (request) => failedRequests.push(request.url()));

    const response = await page.goto(`${base}${p}`, { waitUntil: 'networkidle' });
    const status = response ? response.status() : 0;
    if (status !== 200) {
      issues.push(`Page ${p} status ${status}`);
    }

    const headerPosition = await page.evaluate(() => {
      const node = document.querySelector('.site-header');
      return node ? getComputedStyle(node).position : 'missing';
    });
    if (headerPosition !== 'sticky') {
      issues.push(`CSS not applied on ${p} (header position=${headerPosition})`);
    }

    if (failedRequests.length > 0) {
      issues.push(`Failed requests on ${p}: ${failedRequests.join(', ')}`);
    }

    const links = await page.$$eval('a[href]', (anchors) =>
      anchors.map((a) => a.getAttribute('href')).filter(Boolean)
    );

    for (const href of links) {
      if (
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('#') ||
        href.startsWith('http')
      ) {
        continue;
      }

      const linkUrl = new URL(href, `${base}${p}`);
      const linkResp = await fetch(linkUrl);
      if (linkResp.status >= 400) {
        issues.push(`Broken link ${href} on ${p} -> ${linkUrl.pathname} (${linkResp.status})`);
      }
    }
  }

  await browser.close();

  if (issues.length > 0) {
    console.log('ISSUES');
    for (const issue of issues) {
      console.log(`- ${issue}`);
    }
    process.exitCode = 2;
  } else {
    console.log(`OK: Browser rendering and internal links passed on ${pages.length} pages.`);
  }
}

server.listen(port, async () => {
  try {
    await run();
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
