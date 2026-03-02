function getRootPrefix() {
  const path = window.location.pathname;
  const segments = path.split('/').filter(Boolean);
  const depth = path.endsWith('/') ? segments.length : Math.max(segments.length - 1, 0);
  return depth === 0 ? '' : '../'.repeat(depth);
}

function toRelative(url) {
  if (!url || /^(https?:|mailto:|tel:|#)/i.test(url)) {
    return url;
  }
  const clean = url.replace(/^\/+/, '');
  return `${getRootPrefix()}${clean}`;
}

async function loadSiteContent() {
  try {
    const currentScript = document.currentScript;
    const scriptUrl = new URL(
      (currentScript && currentScript.getAttribute('src')) || 'assets/js/content-loader.js',
      window.location.href
    );

    const contentUrl = new URL('../../content/site-content.json', scriptUrl);
    contentUrl.searchParams.set('v', String(Date.now()));
    const response = await fetch(contentUrl, { cache: 'no-store' });
    if (!response.ok) {
      return;
    }

    const data = await response.json();
    bindCommonContent(data);
  } catch (_) {
    // Keep static fallback content visible.
  }
}

function bindCommonContent(data) {
  bindGenericFields(data);

  document.querySelectorAll('[data-bind="brand-name"]').forEach((el) => {
    el.textContent = data.brand.name;
  });

  document.querySelectorAll('[data-bind="brand-tagline"]').forEach((el) => {
    el.textContent = data.brand.tagline;
  });

  document.querySelectorAll('[data-bind="contact-phone"]').forEach((el) => {
    el.textContent = data.contact.phone;
    if (el.tagName === 'A') {
      el.href = `tel:${data.contact.phone.replace(/\s+/g, '')}`;
    }
  });

  document.querySelectorAll('[data-bind="contact-email"]').forEach((el) => {
    el.textContent = data.contact.email;
    if (el.tagName === 'A') {
      el.href = `mailto:${data.contact.email}`;
    }
  });

  document.querySelectorAll('[data-bind="contact-address"]').forEach((el) => {
    el.textContent = data.contact.address;
  });

  document.querySelectorAll('[data-bind="contact-city"]').forEach((el) => {
    el.textContent = data.contact.city;
  });

  document.querySelectorAll('[data-bind="contact-hours"]').forEach((el) => {
    el.textContent = data.contact.hours;
  });

  const badges = document.querySelector('[data-bind="trust-badges"]');
  if (badges && Array.isArray(data.socialProof)) {
    badges.innerHTML = data.socialProof
      .map((item) => `<span class="badge">${item}</span>`)
      .join('');
  }

  renderCollections(data);
}

function bindGenericFields(data) {
  document.querySelectorAll('[data-bind-text]').forEach((el) => {
    const value = readPath(data, el.getAttribute('data-bind-text'));
    if (typeof value === 'string') {
      el.textContent = value;
    }
  });

  document.querySelectorAll('[data-bind-href]').forEach((el) => {
    const value = readPath(data, el.getAttribute('data-bind-href'));
    if (typeof value === 'string' && el.tagName === 'A') {
      el.setAttribute('href', toRelative(value));
    }
  });
}

function renderCollections(data) {
  document.querySelectorAll('[data-render="home-services"]').forEach((el) => {
    if (!Array.isArray(data.services)) {
      return;
    }

    el.innerHTML = data.services
      .map(
        (service) =>
          `<article class="card"><h3>${service.title}</h3><p>${service.homeSummary || service.detailSummary || ''}</p></article>`
      )
      .join('');
  });

  document.querySelectorAll('[data-render="services-detailed"]').forEach((el) => {
    if (!Array.isArray(data.services)) {
      return;
    }

    el.innerHTML = data.services
      .map(
        (service) =>
          `<article id="${service.id || ''}" class="card"><h2>${service.title}</h2><p>${service.detailSummary || service.homeSummary || ''}</p></article>`
      )
      .join('');
  });

  document.querySelectorAll('[data-render="process-steps"]').forEach((el) => {
    if (!Array.isArray(data.processSteps)) {
      return;
    }

    el.innerHTML = data.processSteps
      .map(
        (step) =>
          `<li><p class="step-number">${step.number || ''}</p><h3>${step.title || ''}</h3><p>${step.description || ''}</p></li>`
      )
      .join('');
  });

  document.querySelectorAll('[data-render="guide-links"]').forEach((el) => {
    if (!Array.isArray(data.guides)) {
      return;
    }

    el.innerHTML = data.guides
      .map((guide) => `<li><a href="${toRelative(guide.slug)}">${guide.title}</a></li>`)
      .join('');
  });

  document.querySelectorAll('[data-render="guides-cards"]').forEach((el) => {
    if (!Array.isArray(data.guides)) {
      return;
    }

    el.innerHTML = data.guides
      .map(
        (guide) =>
          `<article class="card"><h2><a href="${toRelative(guide.slug)}">${guide.title}</a></h2><p>${guide.excerpt || ''}</p></article>`
      )
      .join('');
  });
}

function readPath(data, path) {
  if (!path) {
    return undefined;
  }

  return path.split('.').reduce((acc, key) => {
    if (acc && Object.prototype.hasOwnProperty.call(acc, key)) {
      return acc[key];
    }
    return undefined;
  }, data);
}

loadSiteContent();
