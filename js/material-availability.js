window.PRINTING_MATERIALS = [
  {
    material: 'PLA',
    description: 'Ușor de folosit, potrivit pentru piese decorative, machete și prototipuri vizuale.',
    colours: [
      {
        name: 'De completat — culoare PLA',
        brand: 'Bambu Lab / alt brand',
        status: 'available',
        restock: '',
        image: '',
        note: 'Înlocuiește cu o culoare reală din stoc.'
      },
      {
        name: 'De completat — culoare PLA indisponibilă',
        brand: 'Bambu Lab / alt brand',
        status: 'unavailable',
        restock: 'Restocare estimată: de completat',
        image: '',
        note: 'Exemplu de culoare tăiată când nu este disponibilă.'
      }
    ]
  },
  {
    material: 'PETG',
    description: 'Mai rezistent și mai practic pentru piese funcționale sau obiecte folosite mai des.',
    colours: [
      {
        name: 'De completat — culoare PETG',
        brand: 'Bambu Lab / alt brand',
        status: 'available',
        restock: '',
        image: '',
        note: 'Înlocuiește cu o culoare reală din stoc.'
      }
    ]
  },
  {
    material: 'TPU',
    description: 'Material flexibil, util pentru piese elastice, protecții sau elemente care trebuie să se îndoaie.',
    colours: [
      {
        name: 'De completat — culoare TPU',
        brand: 'Bambu Lab / alt brand',
        status: 'limited',
        restock: '',
        image: '',
        note: 'Exemplu de disponibilitate limitată.'
      }
    ]
  },
  {
    material: 'ABS / materiale speciale',
    description: 'Disponibile în funcție de proiect, cerințe tehnice și materialele aflate pe stoc.',
    colours: [
      {
        name: 'De completat — material special',
        brand: 'Bambu Lab / alt brand',
        status: 'unavailable',
        restock: 'La cerere / de completat',
        image: '',
        note: 'Folosește acest model pentru materiale comandate ocazional.'
      }
    ]
  }
];

function getMaterialRootPrefix() {
  const path = window.location.pathname;

  if (path.includes('/areas/') || path.includes('/portfolio/')) {
    return '../';
  }

  if (path.includes('/ro/') || path.includes('/en/')) {
    return '../';
  }

  return '';
}

function resolveMaterialImage(src) {
  if (!src || src.startsWith('http') || src.startsWith('/') || src.startsWith('#')) {
    return src;
  }

  return `${getMaterialRootPrefix()}${src}`;
}

function getStatusLabel(status) {
  const labels = {
    available: 'Disponibil',
    limited: 'Disponibil limitat',
    unavailable: 'Indisponibil'
  };

  return labels[status] || 'De verificat';
}

function createColourCard(colour) {
  const card = document.createElement('article');
  card.className = `material-colour-card material-colour-card-${colour.status || 'unknown'}`;

  const imageWrap = document.createElement('div');
  imageWrap.className = 'material-colour-image';

  if (colour.image) {
    const image = document.createElement('img');
    image.src = resolveMaterialImage(colour.image);
    image.alt = `${colour.name} filament reference`;
    image.loading = 'lazy';
    imageWrap.appendChild(image);
  } else {
    imageWrap.textContent = 'Imagine filament';
  }

  const body = document.createElement('div');
  body.className = 'material-colour-body';

  const title = document.createElement('h4');
  title.textContent = colour.name;

  const brand = document.createElement('p');
  brand.textContent = colour.brand || 'Brand de completat';

  const status = document.createElement('span');
  status.className = 'material-status';
  status.textContent = getStatusLabel(colour.status);

  body.append(title, brand, status);

  if (colour.restock) {
    const restock = document.createElement('p');
    restock.className = 'material-restock';
    restock.textContent = colour.restock;
    body.appendChild(restock);
  }

  if (colour.note) {
    const note = document.createElement('p');
    note.className = 'material-note';
    note.textContent = colour.note;
    body.appendChild(note);
  }

  card.append(imageWrap, body);
  return card;
}

function renderMaterialAvailability() {
  const container = document.querySelector('[data-material-availability]');

  if (!container || !window.PRINTING_MATERIALS) {
    return;
  }

  container.innerHTML = '';

  window.PRINTING_MATERIALS.forEach((material) => {
    const section = document.createElement('article');
    section.className = 'material-stock-group';

    const header = document.createElement('div');
    header.className = 'material-stock-header';

    const title = document.createElement('h3');
    title.textContent = material.material;

    const description = document.createElement('p');
    description.textContent = material.description;

    header.append(title, description);

    const grid = document.createElement('div');
    grid.className = 'material-colour-grid';

    material.colours.forEach((colour) => grid.appendChild(createColourCard(colour)));

    section.append(header, grid);
    container.appendChild(section);
  });
}

renderMaterialAvailability();
