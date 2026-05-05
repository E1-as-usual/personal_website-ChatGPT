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

function getPageLanguage() {
  return document.documentElement.lang && document.documentElement.lang.toLowerCase().startsWith('en') ? 'en' : 'ro';
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
    portfolioLink.textContent = getPageLanguage() === 'en' ? 'Portfolio' : 'Portofoliu';
    firstLink.insertAdjacentElement('afterend', portfolioLink);
  }

  menu.querySelectorAll('a').forEach((link) => {
    const href = link.getAttribute('href') || '';
    const text = link.textContent.trim().toLowerCase();
    const isRenderingTopLevelLink = href.includes('areas/rendering.html') || href === 'rendering.html' || text === 'randare' || text === 'rendering';

    if (isRenderingTopLevelLink) {
      link.remove();
      return;
    }

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
      link.textContent = getPageLanguage() === 'en' ? 'Go to contact' : 'Mergi la contact';
    }
  });
}

function getDayOfYearKey() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function getSelectedQuote() {
  const quotes = window.SITE_QUOTES || [];

  if (!quotes.length) {
    return null;
  }

  if (window.SITE_QUOTE_OVERRIDE) {
    const overrideQuote = quotes.find((quote) => quote.id === window.SITE_QUOTE_OVERRIDE);

    if (overrideQuote) {
      return overrideQuote;
    }
  }

  return quotes[getDayOfYearKey() % quotes.length];
}

function renderDailyQuote() {
  const quoteBox = document.querySelector('[data-daily-quote]');
  const quoteText = document.querySelector('[data-daily-quote-text]');
  const quoteSource = document.querySelector('[data-daily-quote-source]');
  const quoteLabel = document.querySelector('[data-daily-quote-label]');

  if (!quoteBox || !quoteText || !quoteSource) {
    return;
  }

  const quote = getSelectedQuote();

  if (!quote) {
    return;
  }

  const language = getPageLanguage();
  quoteText.textContent = `„${quote[language] || quote.ro || quote.en}”`;
  quoteSource.textContent = quote.source ? `— ${quote.author}, ${quote.source}` : `— ${quote.author}`;

  if (quoteLabel) {
    quoteLabel.textContent = language === 'en' ? 'My quote today:' : 'Citatul meu de azi:';
  }
}

normalizeSiteNavigation();
normalizePlaceholderContactLinks();
renderDailyQuote();

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
