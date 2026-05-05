function getPortfolioRootPrefix() {
  const path = window.location.pathname;

  if (path.includes('/portfolio/')) {
    return '../../';
  }

  if (path.includes('/ro/') || path.includes('/en/')) {
    return '../';
  }

  return '';
}

function localizePortfolioText(roText, enText) {
  const isEnglish = document.documentElement.lang && document.documentElement.lang.toLowerCase().startsWith('en');
  return isEnglish ? enText : roText;
}

function resolvePortfolioUrl(url) {
  if (!url || url.startsWith('http') || url.startsWith('/') || url.startsWith('#')) {
    return url;
  }

  return `${getPortfolioRootPrefix()}${url}`;
}

function createImageSlot(image) {
  if (image && image.src) {
    const img = document.createElement('img');
    img.src = resolvePortfolioUrl(image.src);
    img.alt = image.alt || '';
    img.loading = 'lazy';
    return img;
  }

  const placeholder = document.createElement('div');
  placeholder.className = 'image-placeholder';
  placeholder.textContent = image && image.placeholder ? image.placeholder : localizePortfolioText('Imagine temporară', 'Temporary image');
  return placeholder;
}

function createProjectCard(project) {
  const card = document.createElement('article');
  card.className = 'project-card';

  const gallery = document.createElement('div');
  gallery.className = 'project-card-gallery';

  const images = project.images && project.images.length ? project.images : [
    { placeholder: localizePortfolioText('Imagine principală', 'Main image') },
    { placeholder: localizePortfolioText('Detaliu', 'Detail') },
    { placeholder: localizePortfolioText('Detaliu', 'Detail') }
  ];

  images.slice(0, 3).forEach((image) => gallery.appendChild(createImageSlot(image)));

  const title = document.createElement('h3');
  title.textContent = project.title;

  const description = document.createElement('p');
  description.textContent = project.description;

  const meta = document.createElement('div');
  meta.className = 'project-meta';

  (project.tags || []).forEach((tag) => {
    const tagElement = document.createElement('span');
    tagElement.textContent = tag;
    meta.appendChild(tagElement);
  });

  if (project.detailUrl) {
    const link = document.createElement('a');
    link.href = resolvePortfolioUrl(project.detailUrl);
    link.textContent = localizePortfolioText('Vezi detalii', 'View details');
    card.append(gallery, title, description, meta, link);
    return card;
  }

  card.append(gallery, title, description, meta);
  return card;
}

function renderPortfolioProjects() {
  const grids = document.querySelectorAll('[data-portfolio-category]');

  if (!grids.length || !window.PORTFOLIO_PROJECTS) {
    return;
  }

  grids.forEach((grid) => {
    const category = grid.dataset.portfolioCategory;
    const projects = category === 'all'
      ? window.PORTFOLIO_PROJECTS
      : window.PORTFOLIO_PROJECTS.filter((project) => project.category === category);

    grid.innerHTML = '';

    if (!projects.length) {
      const empty = document.createElement('article');
      empty.className = 'project-card';
      empty.innerHTML = `<h3>${localizePortfolioText('Proiecte în curând', 'Projects coming soon')}</h3><p>${localizePortfolioText('Această zonă este pregătită pentru lucrări viitoare.', 'This area is ready for future work.')}</p>`;
      grid.appendChild(empty);
      return;
    }

    projects.forEach((project) => grid.appendChild(createProjectCard(project)));
  });
}

renderPortfolioProjects();
