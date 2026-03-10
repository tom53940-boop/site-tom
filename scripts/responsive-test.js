const { createServer } = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = process.cwd();
const port = 4174;

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
  const pages = ['/', '/services/index.html', '/contact/index.html'];
  const viewports = [
    { name: 'desktop', width: 1366, height: 768 },
    { name: 'laptop', width: 1024, height: 768 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile-large', width: 430, height: 932 },
    { name: 'mobile-small', width: 375, height: 812 }
  ];

  const browser = await chromium.launch({ headless: true });
  const issues = [];

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });

    for (const pagePath of pages) {
      const response = await page.goto(`${base}${pagePath}`, { waitUntil: 'networkidle' });
      if (!response || response.status() !== 200) {
        issues.push(`${vp.name} ${vp.width}x${vp.height} ${pagePath}: status ${response ? response.status() : 0}`);
        continue;
      }

      const layout = await page.evaluate(() => {
        const bodyOverflow = document.documentElement.scrollWidth - window.innerWidth;
        const nav = document.querySelector('.main-nav ul');
        const navExists = Boolean(nav);
        return {
          bodyOverflow,
          navExists
        };
      });

      if (layout.bodyOverflow > 1) {
        issues.push(`${vp.name} ${vp.width}x${vp.height} ${pagePath}: horizontal overflow ${layout.bodyOverflow}px`);
      }

      if (!layout.navExists) {
        issues.push(`${vp.name} ${vp.width}x${vp.height} ${pagePath}: missing nav`);
      }
    }

    await page.close();
  }

  await browser.close();

  if (issues.length > 0) {
    console.log('ISSUES');
    for (const issue of issues) {
      console.log(`- ${issue}`);
    }
    process.exitCode = 2;
  } else {
    console.log('OK: Responsive checks passed on standard viewports.');
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
