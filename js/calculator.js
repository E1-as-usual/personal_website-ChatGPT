const CALCULATOR = {
  currency: 'RON',
  minimumOrder: 25,
  materialRates: {
    basic: {
      label: 'Basic',
      pricePerGram: 0.6,
      note: 'Fără verificare de fișier. Clientul este responsabil pentru calitatea și printabilitatea modelului. Doar o culoare.'
    },
    standard: {
      label: 'Standard',
      pricePerGram: 0.8,
      note: 'Include verificare de fișier, ajustări minore unde este nevoie și printare multi-color.'
    },
    premium: {
      label: 'Premium',
      pricePerGram: 1.0,
      note: 'Include optimizare completă, potrivit pentru detalii fine și prioritate la gestionarea comenzii.'
    }
  },
  machine: {
    hourlyRate: 4,
    longPrintThresholdHours: 5,
    applyOnlyWhenHighTimeRelativeToWeight: true
  },
  labor: {
    hourlyRate: 20,
    note: 'Se aplică doar când este necesară manipulare, pregătire, supraveghere sau pregătire specială.'
  },
  fileFixing: {
    none: { label: 'Fără reparații', price: 0 },
    minor: { label: 'Reparații minore', price: 10 },
    moderate: { label: 'Reparații moderate', price: 20 }
  },
  modelling: {
    none: { label: 'Fără modelare', hourlyRate: 0 },
    clear: { label: 'Modelare — brief clar', hourlyRate: 50 },
    unclear: { label: 'Modelare — brief neclar', hourlyRate: 75 }
  },
  postProcessing: {
    sanding: { label: 'Șlefuire', pricePerPart: 10 },
    priming: { label: 'Grunduire', pricePerPart: 15 },
    painting: { label: 'Vopsire', pricePerPart: 30 },
    assembly: { label: 'Asamblare', pricePerProject: 20 }
  },
  quantityDiscounts: [
    { minQuantity: 10, multiplier: 0.9, label: 'Reducere cantitate: 10%' },
    { minQuantity: 5, multiplier: 0.95, label: 'Reducere cantitate: 5%' },
    { minQuantity: 1, multiplier: 1, label: 'Fără reducere cantitate' }
  ]
};

const calculatorForm = document.querySelector('#printing-calculator');

function formatMoney(value) {
  return `${value.toFixed(2)} ${CALCULATOR.currency}`;
}

function getNumber(formData, key) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function getQuantity(formData) {
  const quantity = Math.floor(Number(formData.get('quantity')));
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
}

function getQuantityDiscount(quantity) {
  return CALCULATOR.quantityDiscounts.find((discount) => quantity >= discount.minQuantity);
}

function shouldApplyMachineTime(weight, printHours) {
  if (printHours <= CALCULATOR.machine.longPrintThresholdHours) {
    return false;
  }

  if (!CALCULATOR.machine.applyOnlyWhenHighTimeRelativeToWeight) {
    return true;
  }

  if (weight <= 0) {
    return true;
  }

  const hoursPerGram = printHours / weight;
  return hoursPerGram >= 0.08;
}

function getCheckedValues(formData, name) {
  return formData.getAll(name);
}

function buildBreakdownRow(label, value, note = '') {
  return `
    <tr>
      <th scope="row">${label}</th>
      <td>${formatMoney(value)}</td>
      <td>${note}</td>
    </tr>
  `;
}

function updateCalculator() {
  if (!calculatorForm) {
    return;
  }

  const formData = new FormData(calculatorForm);
  const qualityKey = formData.get('fileQuality') || 'standard';
  const material = CALCULATOR.materialRates[qualityKey] || CALCULATOR.materialRates.standard;
  const fileFixingKey = formData.get('fileFixing') || 'none';
  const fileFixing = CALCULATOR.fileFixing[fileFixingKey] || CALCULATOR.fileFixing.none;
  const modellingKey = formData.get('modelling') || 'none';
  const modelling = CALCULATOR.modelling[modellingKey] || CALCULATOR.modelling.none;

  const weight = getNumber(formData, 'weight');
  const printHours = getNumber(formData, 'printHours');
  const laborHours = getNumber(formData, 'laborHours');
  const modellingHours = getNumber(formData, 'modellingHours');
  const parts = Math.max(1, Math.floor(getNumber(formData, 'parts')) || 1);
  const quantity = getQuantity(formData);

  const baseMaterialUnit = weight * material.pricePerGram;
  const machineUnit = shouldApplyMachineTime(weight, printHours) ? printHours * CALCULATOR.machine.hourlyRate : 0;
  const laborUnit = laborHours * CALCULATOR.labor.hourlyRate;
  const fileFixingUnit = fileFixing.price;
  const modellingUnit = modellingHours * modelling.hourlyRate;

  const selectedPostProcessing = getCheckedValues(formData, 'postProcessing');
  const postProcessingUnit = selectedPostProcessing.reduce((total, key) => {
    const option = CALCULATOR.postProcessing[key];

    if (!option) {
      return total;
    }

    if ('pricePerPart' in option) {
      return total + option.pricePerPart * parts;
    }

    return total + option.pricePerProject;
  }, 0);

  const rawUnit = baseMaterialUnit + machineUnit + laborUnit + fileFixingUnit + modellingUnit + postProcessingUnit;
  const discount = getQuantityDiscount(quantity);
  const discountedSubtotal = rawUnit * quantity * discount.multiplier;
  const total = Math.max(CALCULATOR.minimumOrder, discountedSubtotal);
  const perUnit = total / quantity;
  const minimumOrderAdjustment = total - discountedSubtotal;

  const totalElement = document.querySelector('#calculator-total');
  const unitElement = document.querySelector('#calculator-unit');
  const discountElement = document.querySelector('#calculator-discount');
  const breakdownElement = document.querySelector('#calculator-breakdown');
  const noteElement = document.querySelector('#calculator-note');
  const mailtoElement = document.querySelector('#calculator-mailto');
  const qualityNoteElement = document.querySelector('#calculator-quality-note');

  if (totalElement) {
    totalElement.textContent = formatMoney(total);
  }

  if (unitElement) {
    unitElement.textContent = formatMoney(perUnit);
  }

  if (discountElement) {
    discountElement.textContent = discount.label;
  }

  if (qualityNoteElement) {
    qualityNoteElement.textContent = material.note;
  }

  if (breakdownElement) {
    const rows = [
      buildBreakdownRow(`Material — ${material.label}`, baseMaterialUnit * quantity * discount.multiplier, `${weight} g × ${material.pricePerGram} RON/g × ${quantity} buc.`),
      buildBreakdownRow('Timp mașină', machineUnit * quantity * discount.multiplier, machineUnit > 0 ? `${printHours} ore × ${CALCULATOR.machine.hourlyRate} RON/oră` : 'Neaplicat sub prag sau când timpul nu este disproporționat față de greutate'),
      buildBreakdownRow('Manoperă', laborUnit * quantity * discount.multiplier, laborUnit > 0 ? `${laborHours} ore × ${CALCULATOR.labor.hourlyRate} RON/oră` : 'Neaplicat'),
      buildBreakdownRow(fileFixing.label, fileFixingUnit * quantity * discount.multiplier, fileFixingUnit > 0 ? 'Folosește capătul inferior al intervalului' : 'Neaplicat'),
      buildBreakdownRow(modelling.label, modellingUnit * quantity * discount.multiplier, modellingUnit > 0 ? `${modellingHours} ore × ${modelling.hourlyRate} RON/oră` : 'Neaplicat'),
      buildBreakdownRow('Post-procesare', postProcessingUnit * quantity * discount.multiplier, selectedPostProcessing.length ? 'Folosește capătul inferior al intervalelor selectate' : 'Neaplicat')
    ];

    if (minimumOrderAdjustment > 0) {
      rows.push(buildBreakdownRow('Ajustare comandă minimă', minimumOrderAdjustment, `Comanda minimă este ${formatMoney(CALCULATOR.minimumOrder)}`));
    }

    breakdownElement.innerHTML = rows.join('');
  }

  if (noteElement) {
    noteElement.textContent = 'Estimarea folosește capătul inferior al intervalelor și nu este ofertă finală. Prețul poate varia după verificarea fișierului, material, geometrie, timp, cantitate și finisaj.';
  }

  if (mailtoElement) {
    const subject = encodeURIComponent('Estimare printare 3D');
    const body = encodeURIComponent(`Bună,\n\nAș dori o estimare pentru printare 3D.\n\nEstimare calculator: ${formatMoney(total)}\nPreț pe bucată: ${formatMoney(perUnit)}\nCantitate: ${quantity}\nGreutate estimată: ${weight} g\nTimp estimat: ${printHours} ore\nNivel fișier: ${material.label}\n\nAtașez fișierul sau trimit mai multe detalii.\n`);
    mailtoElement.href = `mailto:hello@example.com?subject=${subject}&body=${body}`;
  }
}

if (calculatorForm) {
  calculatorForm.addEventListener('input', updateCalculator);
  calculatorForm.addEventListener('change', updateCalculator);
  updateCalculator();
}
