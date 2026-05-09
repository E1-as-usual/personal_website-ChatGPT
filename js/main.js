const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('#nav-menu');
const dailyQuoteBoxes = document.querySelectorAll('[data-daily-quote]');

dailyQuoteBoxes.forEach((box) => {
  box.style.opacity = '0';
  box.style.transform = 'translateY(6px)';
  box.style.transition = 'opacity 220ms ease, transform 220ms ease';
});

function getPageLanguage() {
  return document.documentElement.lang && document.documentElement.lang.toLowerCase().startsWith('en') ? 'en' : 'ro';
}

function getLanguageRoot() {
  return `/${getPageLanguage()}/`;
}

function getLanguagePagePrefix() {
  const path = window.location.pathname;
  const language = getPageLanguage();

  if (path.includes(`/${language}/areas/`) || path.includes(`/${language}/portfolio/`)) {
    return '../';
  }

  if (path.includes(`/${language}/`)) {
    return '';
  }

  return `${language}/`;
}

function buildLanguageUrl(pathFromLanguageRoot = '') {
  return `${getLanguageRoot()}${pathFromLanguageRoot}`;
}

function normalizeSiteNavigation() {
  const menu = document.querySelector('#nav-menu');
  if (!menu) return;

  const language = getPageLanguage();
  const links = Array.from(menu.querySelectorAll('a'));

  if (!links.some((link) => (link.getAttribute('href') || '').includes('portfolio.html')) && links[0]) {
    const portfolioLink = document.createElement('a');
    portfolioLink.href = buildLanguageUrl('portfolio.html');
    portfolioLink.textContent = language === 'en' ? 'Portfolio' : 'Portofoliu';
    links[0].insertAdjacentElement('afterend', portfolioLink);
  }

  menu.querySelectorAll('a').forEach((link) => {
    const href = link.getAttribute('href') || '';
    const text = link.textContent.trim().toLowerCase();

    if (href.includes('areas/rendering.html') || href === 'rendering.html' || text === 'randare' || text === 'rendering') {
      link.remove();
      return;
    }

    if (text === 'home' || text === 'acasă') link.href = buildLanguageUrl('');
    if (text === 'portfolio' || text === 'portofoliu') link.href = buildLanguageUrl('portfolio.html');
    if (text === '3d modelling' || text === 'modelare 3d') link.href = buildLanguageUrl('areas/3d-modelling.html');
    if (text === '3d printing' || text === 'printare 3d') link.href = buildLanguageUrl('areas/3d-printing.html');
    if (text === 'photography' || text === 'fotografie') link.href = buildLanguageUrl('areas/photography.html');
    if (text === 'small-scale building' || text === 'construcții') link.href = buildLanguageUrl('areas/small-scale-building.html');
    if (text === 'cv') link.href = buildLanguageUrl('areas/cv.html');

    if (href === '#contact' || href.endsWith('/#contact') || text === 'contact') {
      link.href = buildLanguageUrl('contact.html');
      link.textContent = 'Contact';
    }
  });
}

function normalizePlaceholderContactLinks() {
  const contactHref = buildLanguageUrl('contact.html');

  document.querySelectorAll('a[href^="mailto:hello@example.com"], a[href="#contact"]').forEach((link) => {
    if (link.id === 'calculator-mailto') return;
    link.href = contactHref;

    if (link.textContent.trim().toLowerCase().includes('email temporar')) {
      link.textContent = getPageLanguage() === 'en' ? 'Go to contact' : 'Mergi la contact';
    }
  });
}

function normalizePublicLaunchWording() {
  const language = getPageLanguage();
  const imageReadyText = language === 'en' ? 'Image in preparation' : 'Imagine în pregătire';

  document.querySelectorAll('.image-placeholder').forEach((placeholder) => {
    const text = placeholder.textContent.trim();

    if (text === 'Temporary image' || text === 'Imagine temporară') {
      placeholder.textContent = imageReadyText;
    }
  });

  document.querySelectorAll('.calculator-label span, .calculator-help').forEach((element) => {
    const text = element.textContent.trim();

    if (text.includes('În această versiune statică, fișierul nu este încă trimis automat.')) {
      element.textContent = 'Selectarea fișierului ajută la estimare. Pentru trimiterea fișierelor, folosește formularul de contact.';
    }

    if (text.includes('In this static version, the file is not sent automatically.')) {
      element.textContent = 'Selecting the file helps the estimate. To send files, use the contact form.';
    }
  });
}

function showDailyQuoteBox() {
  dailyQuoteBoxes.forEach((box) => {
    box.style.opacity = '1';
    box.style.transform = 'translateY(0)';
  });
}

function applyQuoteToPage(quote) {
  const quoteText = document.querySelector('[data-daily-quote-text]');
  const quoteSource = document.querySelector('[data-daily-quote-source]');
  const quoteLabel = document.querySelector('[data-daily-quote-label]');

  if (!quoteText || !quoteSource || !quote) {
    showDailyQuoteBox();
    return;
  }

  const language = getPageLanguage();
  quoteText.textContent = `„${quote[language] || quote.ro || quote.en}”`;
  quoteSource.textContent = quote.source ? `— ${quote.author}, ${quote.source}` : `— ${quote.author}`;

  if (quoteLabel) {
    quoteLabel.textContent = language === 'en' ? 'My quote today:' : 'Citatul meu de azi:';
  }

  showDailyQuoteBox();
}

function getFallbackQuote() {
  const quotes = window.SITE_QUOTES || [];
  if (!quotes.length) return null;

  if (window.SITE_QUOTE_OVERRIDE) {
    const overrideQuote = quotes.find((quote) => quote.id === window.SITE_QUOTE_OVERRIDE);
    if (overrideQuote) return overrideQuote;
  }

  return quotes[0];
}

async function renderDailyQuote() {
  if (!document.querySelector('[data-daily-quote]')) return;

  try {
    const response = await fetch('/daily-quote.php', {
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });

    if (!response.ok) throw new Error('Daily quote unavailable');
    const data = await response.json();
    if (!data.quote) throw new Error('Daily quote missing');
    applyQuoteToPage(data.quote);
  } catch (error) {
    applyQuoteToPage(getFallbackQuote());
  }
}

function renderStructuredFooter() {
  const footer = document.querySelector('.site-footer');
  if (!footer) return;

  const language = getPageLanguage();
  const year = new Date().getFullYear();
  const newsletterStatus = new URLSearchParams(window.location.search).get('newsletter');

  const copy = language === 'en'
    ? {
        description: '3D modelling, 3D printing, photography, and small-scale building in Bucharest.',
        pages: 'Pages', services: 'Services', contact: 'Contact', newsletter: 'Occasional updates',
        newsletterHelp: 'Project notes, 3D printing availability, and portfolio updates. No spam.',
        newsletterButton: 'Subscribe', newsletterOk: 'Newsletter subscription saved.', newsletterError: 'Newsletter signup could not be saved.',
        privacy: 'Privacy', home: 'Home', portfolio: 'Portfolio', cv: 'CV', modelling: '3D Modelling', printing: '3D Printing', photography: 'Photography', building: 'Small-scale Building', location: 'Bucharest, Romania'
      }
    : {
        description: 'Modelare 3D, printare 3D, fotografie și construcții la scară mică în București.',
        pages: 'Pagini', services: 'Servicii', contact: 'Contact', newsletter: 'Actualizări ocazionale',
        newsletterHelp: 'Note despre proiecte, disponibilitate pentru printare 3D și noutăți de portofoliu. Fără spam.',
        newsletterButton: 'Abonează-te', newsletterOk: 'Abonarea a fost salvată.', newsletterError: 'Abonarea nu a putut fi salvată.',
        privacy: 'Confidențialitate', home: 'Acasă', portfolio: 'Portofoliu', cv: 'CV', modelling: 'Modelare 3D', printing: 'Printare 3D', photography: 'Fotografie', building: 'Construcții', location: 'București, România'
      };

  const statusMarkup = newsletterStatus ? `<p class="footer-newsletter-status">${newsletterStatus === 'ok' ? copy.newsletterOk : copy.newsletterError}</p>` : '';

  footer.innerHTML = `
    <div class="footer-inner">
      <div class="footer-brand"><h2>Ioan Chiurciu</h2><p>${copy.description}</p></div>
      <div class="footer-column"><h2>${copy.pages}</h2><nav class="footer-links" aria-label="${copy.pages}"><a href="${buildLanguageUrl('')}">${copy.home}</a><a href="${buildLanguageUrl('portfolio.html')}">${copy.portfolio}</a><a href="${buildLanguageUrl('areas/cv.html')}">${copy.cv}</a><a href="${buildLanguageUrl('privacy.html')}">${copy.privacy}</a><a href="${buildLanguageUrl('contact.html')}">${copy.contact}</a></nav></div>
      <div class="footer-column"><h2>${copy.services}</h2><nav class="footer-links" aria-label="${copy.services}"><a href="${buildLanguageUrl('areas/3d-modelling.html')}">${copy.modelling}</a><a href="${buildLanguageUrl('areas/3d-printing.html')}">${copy.printing}</a><a href="${buildLanguageUrl('areas/photography.html')}">${copy.photography}</a><a href="${buildLanguageUrl('areas/small-scale-building.html')}">${copy.building}</a></nav></div>
      <div class="footer-column"><h2>${copy.contact}</h2><nav class="footer-links" aria-label="${copy.contact}"><a href="mailto:contact@chiurciu.com">contact@chiurciu.com</a><span>${copy.location}</span></nav></div>
      <div class="footer-column footer-newsletter"><h2>${copy.newsletter}</h2><p>${copy.newsletterHelp}</p>${statusMarkup}<form action="/subscribe-newsletter.php" method="post"><input type="hidden" name="lang" value="${language}" /><input type="hidden" name="return_to" value="${window.location.pathname}" /><label class="sr-only">Website<input type="text" name="website" tabindex="-1" autocomplete="off" /></label><label class="sr-only" for="footer-newsletter-email">Email</label><input id="footer-newsletter-email" type="email" name="email" autocomplete="email" placeholder="email@example.com" required /><button class="button button-secondary" type="submit">${copy.newsletterButton}</button></form></div>
    </div>
    <div class="footer-bottom"><p>© <span id="current-year">${year}</span> Ioan Chiurciu.</p></div>
  `;
}

normalizeSiteNavigation();
normalizePlaceholderContactLinks();
normalizePublicLaunchWording();
renderDailyQuote();
renderStructuredFooter();
normalizePublicLaunchWording();

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
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16 });

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add('is-visible'));
}

const currentYear = document.querySelector('#current-year');
if (currentYear) currentYear.textContent = new Date().getFullYear();
