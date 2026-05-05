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
  weightDiscounts: [
    { minWeight: 250, discountPerGram: 0.15, label: 'Reducere greutate: -0.15 RON/g' },
    { minWeight: 150, discountPerGram: 0.1, label: 'Reducere greutate: -0.10 RON/g' },
    { minWeight: 50, discountPerGram: 0.05, label: 'Reducere greutate: -0.05 RON/g' },
    { minWeight: 0, discountPerGram: 0, label: 'Fără reducere de greutate' }
  ],
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
  }
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

function getWeightDiscount(totalWeight) {
  return CALCULATOR.weightDiscounts.find((discount) => totalWeight >= discount.minWeight);
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
  const totalWeight = weight * quantity;
  const weightDiscount = getWeightDiscount(totalWeight);
  const discountedMaterialRate = Math.max(0, material.pricePerGram - weightDiscount.discountPerGram);

  const baseMaterialTotal = totalWeight * material.pricePerGram;
  const materialDiscountTotal = totalWeight * weightDiscount.discountPerGram;
  const finalMaterialTotal = totalWeight * discountedMaterialRate;
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

  const machineTotal = machineUnit * quantity;
  const laborTotal = laborUnit * quantity;
  const fileFixingTotal = fileFixingUnit * quantity;
  const modellingTotal = modellingUnit * quantity;
  const postProcessingTotal = postProcessingUnit * quantity;
  const subtotal = finalMaterialTotal + machineTotal + laborTotal + fileFixingTotal + modellingTotal + postProcessingTotal;
  const total = Math.max(CALCULATOR.minimumOrder, subtotal);
  const perUnit = total / quantity;
  const minimumOrderAdjustment = total - subtotal;

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
    discountElement.textContent = `${weightDiscount.label} la ${totalWeight} g total`;
  }

  if (qualityNoteElement) {
    qualityNoteElement.textContent = material.note;
  }

  if (breakdownElement) {
    const rows = [
      buildBreakdownRow(`Material — ${material.label}`, baseMaterialTotal, `${totalWeight} g × ${material.pricePerGram} RON/g`),
      buildBreakdownRow('Reducere după greutate', -materialDiscountTotal, weightDiscount.discountPerGram > 0 ? `${totalWeight} g × -${weightDiscount.discountPerGram.toFixed(2)} RON/g` : 'Neaplicat'),
      buildBreakdownRow('Timp mașină', machineTotal, machineTotal > 0 ? `${printHours} ore × ${CALCULATOR.machine.hourlyRate} RON/oră × ${quantity} buc.` : 'Neaplicat sub prag sau când timpul nu este disproporționat față de greutate'),
      buildBreakdownRow('Manoperă', laborTotal, laborTotal > 0 ? `${laborHours} ore × ${CALCULATOR.labor.hourlyRate} RON/oră × ${quantity} buc.` : 'Neaplicat'),
      buildBreakdownRow(fileFixing.label, fileFixingTotal, fileFixingTotal > 0 ? 'Folosește capătul inferior al intervalului' : 'Neaplicat'),
      buildBreakdownRow(modelling.label, modellingTotal, modellingTotal > 0 ? `${modellingHours} ore × ${modelling.hourlyRate} RON/oră × ${quantity} buc.` : 'Neaplicat'),
      buildBreakdownRow('Post-procesare', postProcessingTotal, selectedPostProcessing.length ? 'Folosește capătul inferior al intervalelor selectate' : 'Neaplicat')
    ];

    if (minimumOrderAdjustment > 0) {
      rows.push(buildBreakdownRow('Ajustare comandă minimă', minimumOrderAdjustment, `Comanda minimă este ${formatMoney(CALCULATOR.minimumOrder)}`));
    }

    breakdownElement.innerHTML = rows.join('');
  }

  if (noteElement) {
    noteElement.textContent = 'Estimarea folosește capătul inferior al intervalelor și nu este ofertă finală. Reducerea se aplică în funcție de greutatea totală estimată, nu de cantitate. Prețul poate varia după verificarea fișierului, material, geometrie, timp și finisaj.';
  }

  if (mailtoElement) {
    const subject = encodeURIComponent('Estimare printare 3D');
    const body = encodeURIComponent(`Bună,\n\nAș dori o estimare pentru printare 3D.\n\nEstimare calculator: ${formatMoney(total)}\nPreț pe bucată: ${formatMoney(perUnit)}\nCantitate: ${quantity}\nGreutate estimată totală: ${totalWeight} g\nTimp estimat per bucată: ${printHours} ore\nNivel fișier: ${material.label}\nReducere greutate: ${weightDiscount.label}\n\nAtașez fișierul sau trimit mai multe detalii.\n`);
    mailtoElement.href = `mailto:hello@example.com?subject=${subject}&body=${body}`;
  }
}

if (calculatorForm) {
  calculatorForm.addEventListener('input', updateCalculator);
  calculatorForm.addEventListener('change', updateCalculator);
  updateCalculator();
}
