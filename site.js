/* =========================================================================
   Header behavior — shared by every page.

   The nav markup is byte-identical on every page, so which item is current
   is worked out here rather than hand-marked per page. A page that belongs
   under a nav item it isn't (a meeting summary under Meetings) says so with
   data-nav on <body>.
   ========================================================================= */
(function () {
  'use strict';

  const header = document.querySelector('.masthead');
  const nav = document.getElementById('site-nav');
  const toggle = document.querySelector('.nav-toggle');

  /* ---- menu panel ---- */
  if (nav && toggle && header) {
    const isOpen = () => nav.hasAttribute('data-open');

    const setOpen = open => {
      if (open) nav.setAttribute('data-open', '');
      else nav.removeAttribute('data-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    toggle.addEventListener('click', () => setOpen(!isOpen()));

    /* a chosen destination means the panel has done its job */
    nav.addEventListener('click', event => {
      if (event.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener('click', event => {
      if (isOpen() && !header.contains(event.target)) setOpen(false);
    });

    const desktop = window.matchMedia('(min-width: 980px)');
    const dropPanel = () => { if (desktop.matches) setOpen(false); };
    if (desktop.addEventListener) desktop.addEventListener('change', dropPanel);
    else desktop.addListener(dropPanel);
  }

  const links = nav ? Array.from(nav.querySelectorAll('a[href]')) : [];

  /* /a/index.html and /a/ are the same page */
  const samePath = (a, b) => a.replace(/index\.html$/, '') === b.replace(/index\.html$/, '');

  /* ---- which page am I on ---- */
  const owner = document.body.dataset.nav || window.location.pathname;
  links.forEach(link => {
    if (!link.hash && samePath(new URL(link.href).pathname, owner)) {
      link.setAttribute('aria-current', 'page');
    }
  });

  /* ---- which section am I in ---- */
  const spied = links
    .filter(link => link.hash && !link.hasAttribute('aria-current'))
    .map(link => ({
      link: link,
      section: samePath(new URL(link.href).pathname, window.location.pathname)
        ? document.querySelector(link.hash)
        : null
    }))
    .filter(pair => pair.section);

  const markCurrent = () => {
    const line = (header ? header.offsetHeight : 0) + 28;
    let active = null;
    spied.forEach(pair => {
      if (pair.section.getBoundingClientRect().top <= line) active = pair;
    });
    spied.forEach(pair => {
      if (pair === active) pair.link.setAttribute('aria-current', 'location');
      else pair.link.removeAttribute('aria-current');
    });
  };

  const markScrolled = () => {
    if (!header) return;
    if (window.scrollY > 8) header.setAttribute('data-scrolled', '');
    else header.removeAttribute('data-scrolled');
  };

  let queued = false;
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      markScrolled();
      if (spied.length) markCurrent();
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
})();
