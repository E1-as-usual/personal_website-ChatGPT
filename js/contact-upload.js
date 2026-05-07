(() => {
  const ATTACHMENT_LIMIT = 15 * 1024 * 1024;
  const UPLOAD_LINK_LIMIT = 50 * 1024 * 1024;
  const ALLOWED_EXTENSIONS = ['stl', '3mf', 'obj', 'jpg', 'jpeg', 'png', 'webp', 'pdf'];

  const formatBytes = (bytes) => {
    if (!bytes) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
  };

  const getLanguage = () => (document.documentElement.lang || 'ro').toLowerCase().startsWith('en') ? 'en' : 'ro';

  const copy = {
    ro: {
      none: 'Selectează fișiere pentru a vedea metoda de trimitere.',
      attachment: 'Fișiere selectate: {size}. Se vor trimite ca atașament email.',
      link: 'Fișiere selectate: {size}. Se vor încărca și trimite ca link privat.',
      blocked: 'Fișiere selectate: {size}. Totalul depășește limita formularului de 50 MB. Trimite mesajul fără atașament și include un link de transfer în brief.',
      invalid: 'Unele fișiere au format neacceptat. Sunt acceptate: STL, 3MF, OBJ, JPG, PNG, WEBP, PDF.',
      ok: 'Mesajul a fost trimis. Verifică și spam/junk dacă aștepți un răspuns.',
      error: 'Mesajul nu a putut fi trimis. Încearcă din nou sau folosește emailul direct.',
      missing: 'Completează numele, emailul și mesajul.',
      invalidEmail: 'Adresa de email nu pare validă.',
      uploadTooLarge: 'Fișierele depășesc limita formularului. Trimite mesajul fără atașament și include un link de transfer.',
      invalidFile: 'Un fișier are format neacceptat sau nu a putut fi validat.'
    },
    en: {
      none: 'Select files to see the sending method.',
      attachment: 'Selected files: {size}. They will be sent as email attachments.',
      link: 'Selected files: {size}. They will be uploaded and sent as a private link.',
      blocked: 'Selected files: {size}. The total exceeds the 50 MB form limit. Send the message without attachments and include a transfer link in the brief.',
      invalid: 'Some files have an unsupported format. Accepted formats: STL, 3MF, OBJ, JPG, PNG, WEBP, PDF.',
      ok: 'Your message was sent. Please also check spam/junk if you expect a reply.',
      error: 'The message could not be sent. Try again or use direct email.',
      missing: 'Please complete name, email, and message.',
      invalidEmail: 'The email address does not look valid.',
      uploadTooLarge: 'The files exceed the form limit. Send the message without attachments and include a transfer link.',
      invalidFile: 'A file has an unsupported format or could not be validated.'
    }
  };

  document.querySelectorAll('[data-contact-form]').forEach((form) => {
    const language = getLanguage();
    const text = copy[language];
    const input = form.querySelector('[data-file-input]');
    const status = form.querySelector('[data-upload-status]');
    const submit = form.querySelector('[data-submit-button]');
    const formStatus = form.querySelector('[data-form-status]');

    const params = new URLSearchParams(window.location.search);
    const submitStatus = params.get('status');

    if (formStatus && submitStatus) {
      const statusMap = {
        ok: text.ok,
        error: text.error,
        missing: text.missing,
        'invalid-email': text.invalidEmail,
        'upload-too-large': text.uploadTooLarge,
        'invalid-file': text.invalidFile
      };

      formStatus.hidden = false;
      formStatus.dataset.status = submitStatus === 'ok' ? 'ok' : 'error';
      formStatus.textContent = statusMap[submitStatus] || text.error;
    }

    if (!input || !status || !submit) return;

    const updateStatus = () => {
      const files = Array.from(input.files || []);

      if (!files.length) {
        status.textContent = text.none;
        status.dataset.uploadMode = 'none';
        submit.disabled = false;
        return;
      }

      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      const hasInvalidFile = files.some((file) => {
        const extension = file.name.split('.').pop().toLowerCase();
        return !ALLOWED_EXTENSIONS.includes(extension);
      });

      if (hasInvalidFile) {
        status.textContent = text.invalid;
        status.dataset.uploadMode = 'blocked';
        submit.disabled = true;
        return;
      }

      if (totalSize <= ATTACHMENT_LIMIT) {
        status.textContent = text.attachment.replace('{size}', formatBytes(totalSize));
        status.dataset.uploadMode = 'attachment';
        submit.disabled = false;
        return;
      }

      if (totalSize <= UPLOAD_LINK_LIMIT) {
        status.textContent = text.link.replace('{size}', formatBytes(totalSize));
        status.dataset.uploadMode = 'link';
        submit.disabled = false;
        return;
      }

      status.textContent = text.blocked.replace('{size}', formatBytes(totalSize));
      status.dataset.uploadMode = 'blocked';
      submit.disabled = true;
    };

    input.addEventListener('change', updateStatus);
    updateStatus();
  });
})();
