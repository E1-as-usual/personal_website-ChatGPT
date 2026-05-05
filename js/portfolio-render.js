function createImageSlot(image) {
  if (image && image.src) {
    const img = document.createElement('img');
    img.src = image.src;
    img.alt = image.alt || '';
    img.loading = 'lazy';
    return img;
  }

  const placeholder = document.createElement('div');
  placeholder.className = 'image-placeholder';
  placeholder.textContent = image && image.placeholder ? image.placeholder : 'Imagine temporară';
  return placeholder;
}

function createProjectCard(project) {
  const card = document.createElement('article');
  card.className = 'project-card';

  const gallery = document.createElement('div');
  gallery.className = 'project-card-gallery';

  const images = project.images && project.images.length ? project.images : [
    { placeholder: 'Imagine principală' },
    { placeholder: 'Detaliu' },
    { placeholder: 'Detaliu' }
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
    link.href = project.detailUrl;
    link.textContent = 'Vezi detalii';
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
      empty.innerHTML = '<h3>Proiecte în curând</h3><p>Această zonă este pregătită pentru lucrări viitoare.</p>';
      grid.appendChild(empty);
      return;
    }

    projects.forEach((project) => grid.appendChild(createProjectCard(project)));
  });
}

renderPortfolioProjects();
