const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('#nav-menu');

function getRootPrefix() {
  const path = window.location.pathname;

  if (path.includes('/areas/') || path.includes('/portfolio/')) {
    return '../';
  }

  if (path.includes('/ro/') || path.includes('/en/')) {
    return '../';
  }

  return '';
}

function normalizeSiteNavigation() {
  const menu = document.querySelector('#nav-menu');

  if (!menu) {
    return;
  }

  const rootPrefix = getRootPrefix();
  const portfolioHref = `${rootPrefix}portfolio.html`;
  const contactHref = `${rootPrefix}contact.html`;
  const links = Array.from(menu.querySelectorAll('a'));
  const hasPortfolio = links.some((link) => link.getAttribute('href') && link.getAttribute('href').includes('portfolio.html'));
  const firstLink = links[0];

  if (!hasPortfolio && firstLink) {
    const portfolioLink = document.createElement('a');
    portfolioLink.href = portfolioHref;
    portfolioLink.textContent = 'Portofoliu';
    firstLink.insertAdjacentElement('afterend', portfolioLink);
  }

  menu.querySelectorAll('a').forEach((link) => {
    const href = link.getAttribute('href') || '';
    const text = link.textContent.trim().toLowerCase();

    if (href === '#contact' || href.endsWith('/#contact') || text === 'contact') {
      link.href = contactHref;
      link.textContent = 'Contact';
    }
  });
}

function normalizePlaceholderContactLinks() {
  const rootPrefix = getRootPrefix();
  const contactHref = `${rootPrefix}contact.html`;

  document.querySelectorAll('a[href^="mailto:hello@example.com"], a[href="#contact"]').forEach((link) => {
    const isCalculatorEstimate = link.id === 'calculator-mailto';

    if (isCalculatorEstimate) {
      return;
    }

    link.href = contactHref;

    if (link.textContent.trim().toLowerCase().includes('email temporar')) {
      link.textContent = 'Mergi la contact';
    }
  });
}

normalizeSiteNavigation();
normalizePlaceholderContactLinks();

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';

    navToggle.setAttribute('aria-expanded', String(!isOpen));
    document.body.classList.toggle('nav-open', !isOpen);
  });

  navMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
    });
  });
}

const revealElements = document.querySelectorAll('.reveal, .reveal-stagger');

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add('is-visible'));
}

const currentYear = document.querySelector('#current-year');

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}
