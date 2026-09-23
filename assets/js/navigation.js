const siteHeader = document.querySelector('.site-header');
const navigationToggle = document.querySelector('.nav-toggle');
const mainNavigation = document.querySelector('#navigation-principale');

if (siteHeader && navigationToggle && mainNavigation) {
  const mobileViewport = window.matchMedia('(max-width: 900px)');

  function setNavigationOpen(isOpen) {
    navigationToggle.setAttribute('aria-expanded', String(isOpen));
    navigationToggle.textContent = isOpen ? 'Fermer' : 'Menu';
    siteHeader.classList.toggle('navigation-open', isOpen);
  }

  navigationToggle.hidden = false;
  siteHeader.classList.add('navigation-ready');

  navigationToggle.addEventListener('click', () => {
    setNavigationOpen(navigationToggle.getAttribute('aria-expanded') !== 'true');
  });

  siteHeader.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navigationToggle.getAttribute('aria-expanded') === 'true') {
      setNavigationOpen(false);
      navigationToggle.focus();
    }
  });

  mainNavigation.addEventListener('click', (event) => {
    if (event.target.closest('a')) setNavigationOpen(false);
  });

  document.addEventListener('click', (event) => {
    if (!siteHeader.contains(event.target)) setNavigationOpen(false);
  });

  mobileViewport.addEventListener('change', () => setNavigationOpen(false));
}
