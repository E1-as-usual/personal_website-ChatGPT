(() => {
  const triggers = Array.from(document.querySelectorAll('[data-lightbox]'));

  if (!triggers.length) {
    return;
  }

  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <button class="lightbox-close" type="button" aria-label="Close image viewer">×</button>
    <figure class="lightbox-frame">
      <img class="lightbox-image" alt="" />
      <figcaption class="lightbox-caption"></figcaption>
    </figure>
  `;

  document.body.appendChild(overlay);

  const image = overlay.querySelector('.lightbox-image');
  const caption = overlay.querySelector('.lightbox-caption');
  const closeButton = overlay.querySelector('.lightbox-close');
  let previousFocus = null;

  const openLightbox = (trigger) => {
    previousFocus = document.activeElement;

    const src = trigger.dataset.lightboxSrc || trigger.getAttribute('src') || '';
    const alt = trigger.dataset.lightboxAlt || trigger.getAttribute('alt') || '';
    const text = trigger.dataset.lightboxCaption || alt || trigger.textContent.trim() || '';

    if (src) {
      image.src = src;
      image.hidden = false;
    } else {
      image.removeAttribute('src');
      image.hidden = true;
    }

    image.alt = alt;
    caption.textContent = text;
    caption.hidden = text === '';

    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    closeButton.focus();
  };

  const closeLightbox = () => {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    image.removeAttribute('src');

    if (previousFocus && typeof previousFocus.focus === 'function') {
      previousFocus.focus();
    }
  };

  triggers.forEach((trigger) => {
    if (!trigger.matches('button, a, img')) {
      trigger.setAttribute('tabindex', '0');
      trigger.setAttribute('role', 'button');
    }

    trigger.addEventListener('click', () => openLightbox(trigger));
    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openLightbox(trigger);
      }
    });
  });

  closeButton.addEventListener('click', closeLightbox);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overlay.classList.contains('is-open')) {
      closeLightbox();
    }
  });
})();
