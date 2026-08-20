/* =========================================================================
   Header behavior — shared by every page.
   Menu panel on narrow screens, current-section marking, scrolled state.
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

    const desktop = window.matchMedia('(min-width: 860px)');
    const dropPanel = () => { if (desktop.matches) setOpen(false); };
    if (desktop.addEventListener) desktop.addEventListener('change', dropPanel);
    else desktop.addListener(dropPanel);
  }

  /* ---- which section am I in ---- */
  const spied = nav
    ? Array.from(nav.querySelectorAll('a[href^="#"]:not(.nav-cta)'))
        .map(link => ({ link: link, section: document.querySelector(link.getAttribute('href')) }))
        .filter(pair => pair.section)
    : [];

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
