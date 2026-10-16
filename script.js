'use strict';

document.documentElement.classList.add('js');
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
if (menuButton && navigation) {
  menuButton.hidden = false;
  const closeMenu = () => {
    menuButton.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
    menuButton.querySelector('span').textContent = '+';
  };
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('is-open', open);
    menuButton.querySelector('span').textContent = open ? '−' : '+';
  });
  navigation.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuButton.focus();
    }
  });
  const wideViewport = window.matchMedia('(min-width: 521px)');
  wideViewport.addEventListener('change', () => closeMenu());
}

for (const button of document.querySelectorAll('.print-trigger')) {
  button.hidden = false;
  button.addEventListener('click', () => window.print());
}

const copyButton = document.querySelector('.copy-email');
const copyStatus = document.querySelector('#copy-status');
if (copyButton && copyStatus && window.isSecureContext && navigator.clipboard) {
  copyButton.hidden = false;
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('nico@hoammade.de');
      copyStatus.textContent = 'E-Mail-Adresse kopiert.';
    } catch {
      copyStatus.textContent = 'Bitte die E-Mail-Adresse oben markieren und kopieren.';
    }
  });
}

if ('IntersectionObserver' in window && navigation) {
  const links = [...navigation.querySelectorAll('a[href^="#"]')];
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      for (const link of links) {
        if (link.getAttribute('href') === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    }
  }, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
  for (const link of links) {
    const section = document.querySelector(link.getAttribute('href'));
    if (section) observer.observe(section);
  }
}
