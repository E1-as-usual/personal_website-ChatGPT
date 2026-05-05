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
    includedHours: 5,
    billingIncrementHours: 0.5,
    applyOnlyWhenHighTimeRelativeToWeight: true
  },
  modelStatuses: {
    complete: {
      label: 'Model complet / print-ready',
      price: 0,
      note: 'Nu adaugă cost de pregătire în calculator.'
    },
    adjustments: {
      label: 'Modelul poate avea nevoie de ajustări',
      price: 10,
      note: 'Estimare fixă minimă pentru ajustări simple: orientare, scară, mici corecții.'
    },
    repair: {
      label: 'Modelul are nevoie de reparații',
      price: 20,
      note: 'Estimare fixă minimă pentru reparații moderate de fișier.'
    },
    create: {
      label: 'Am nevoie să fie creat modelul',
      price: 50,
      note: 'Estimare minimă de pornire. Modelarea se confirmă separat după brief.'
    }
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
  const hasMorePieces = formData.get('hasMorePieces') === 'yes';

  if (!hasMorePieces) {
    return 1;
  }

  const quantity = Math.floor(Number(formData.get('quantity')));
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
}

function getFinishingParts(formData, hasPostProcessing) {
  if (!hasPostProcessing) {
    return 1;
  }

  const parts = Math.floor(Number(formData.get('finishingParts')));
  return Number.isFinite(parts) && parts > 0 ? parts : 1;
}

function getWeight(formData) {
  const knowsExactWeight = formData.get('knowsExactWeight') === 'yes';
  return knowsExactWeight ? getNumber(formData, 'exactWeight') : getNumber(formData, 'estimatedWeight');
}

function getWeightModeLabel(formData) {
  return formData.get('knowsExactWeight') === 'yes' ? 'greutate exactă' : 'estimare în pași de 50 g';
}

function getWeightDiscount(totalWeight) {
  return CALCULATOR.weightDiscounts.find((discount) => totalWeight >= discount.minWeight);
}

function roundUpToIncrement(value, increment) {
  return Math.ceil(value / increment) * increment;
}

function getBillableMachineHours(weight, printHours, knowsExactTime) {
  if (!knowsExactTime || printHours <= CALCULATOR.machine.includedHours) {
    return 0;
  }

  if (CALCULATOR.machine.applyOnlyWhenHighTimeRelativeToWeight && weight > 0) {
    const hoursPerGram = printHours / weight;

    if (hoursPerGram < 0.08) {
      return 0;
    }
  }

  const extraHours = printHours - CALCULATOR.machine.includedHours;
  return roundUpToIncrement(extraHours, CALCULATOR.machine.billingIncrementHours);
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

function toggleConditionalFields() {
  if (!calculatorForm) {
    return;
  }

  const formData = new FormData(calculatorForm);
  const hasMorePieces = formData.get('hasMorePieces') === 'yes';
  const hasPostProcessing = getCheckedValues(formData, 'postProcessing').length > 0;
  const knowsExactWeight = formData.get('knowsExactWeight') === 'yes';
  const knowsExactTime = formData.get('knowsExactTime') === 'yes';
  const quantityField = document.querySelector('[data-conditional="quantity"]');
  const finishingPartsField = document.querySelector('[data-conditional="finishing-parts"]');
  const estimatedWeightField = document.querySelector('[data-conditional="estimated-weight"]');
  const exactWeightField = document.querySelector('[data-conditional="exact-weight"]');
  const timeField = document.querySelector('[data-conditional="time"]');

  if (quantityField) {
    quantityField.hidden = !hasMorePieces;
  }

  if (finishingPartsField) {
    finishingPartsField.hidden = !hasPostProcessing;
  }

  if (estimatedWeightField) {
    estimatedWeightField.hidden = knowsExactWeight;
  }

  if (exactWeightField) {
    exactWeightField.hidden = !knowsExactWeight;
  }

  if (timeField) {
    timeField.hidden = !knowsExactTime;
  }
}

function updateCalculator() {
  if (!calculatorForm) {
    return;
  }

  toggleConditionalFields();

  const formData = new FormData(calculatorForm);
  const qualityKey = formData.get('fileQuality') || 'standard';
  const material = CALCULATOR.materialRates[qualityKey] || CALCULATOR.materialRates.standard;
  const modelStatusKey = formData.get('modelStatus') || 'complete';
  const modelStatus = CALCULATOR.modelStatuses[modelStatusKey] || CALCULATOR.modelStatuses.complete;
  const knowsExactTime = formData.get('knowsExactTime') === 'yes';
  const uploadedFile = formData.get('modelFile');
  const uploadedFileName = uploadedFile && uploadedFile.name ? uploadedFile.name : '';

  const weight = getWeight(formData);
  const weightModeLabel = getWeightModeLabel(formData);
  const printHours = knowsExactTime ? getNumber(formData, 'printHours') : 0;
  const selectedPostProcessing = getCheckedValues(formData, 'postProcessing');
  const hasPostProcessing = selectedPostProcessing.length > 0;
  const quantity = getQuantity(formData);
  const finishingParts = getFinishingParts(formData, hasPostProcessing);
  const totalWeight = weight * quantity;
  const weightDiscount = getWeightDiscount(totalWeight);
  const discountedMaterialRate = Math.max(0, material.pricePerGram - weightDiscount.discountPerGram);

  const baseMaterialTotal = totalWeight * material.pricePerGram;
  const materialDiscountTotal = totalWeight * weightDiscount.discountPerGram;
  const finalMaterialTotal = totalWeight * discountedMaterialRate;
  const billableMachineHours = getBillableMachineHours(weight, printHours, knowsExactTime);
  const machineUnit = billableMachineHours * CALCULATOR.machine.hourlyRate;
  const machineTotal = machineUnit * quantity;
  const modelPreparationTotal = modelStatus.price;

  const postProcessingTotal = selectedPostProcessing.reduce((total, key) => {
    const option = CALCULATOR.postProcessing[key];

    if (!option) {
      return total;
    }

    if ('pricePerPart' in option) {
      return total + option.pricePerPart * finishingParts;
    }

    return total + option.pricePerProject;
  }, 0);

  const subtotal = finalMaterialTotal + machineTotal + modelPreparationTotal + postProcessingTotal;
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
  const modelNoteElement = document.querySelector('#calculator-model-note');
  const uploadNoteElement = document.querySelector('#calculator-upload-note');

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

  if (modelNoteElement) {
    modelNoteElement.textContent = modelStatus.note;
  }

  if (uploadNoteElement) {
    uploadNoteElement.textContent = uploadedFileName
      ? `Fișier selectat: ${uploadedFileName}. Acesta ajută la estimare, dar nu este trimis automat prin butonul de email.`
      : 'Poți selecta un fișier STL, 3MF sau OBJ pentru verificare locală. Trimiterea efectivă se va face ulterior prin email/formular.';
  }

  if (breakdownElement) {
    const rows = [
      buildBreakdownRow(`Material — ${material.label}`, baseMaterialTotal, `${totalWeight} g × ${material.pricePerGram} RON/g (${weightModeLabel})`),
      buildBreakdownRow('Reducere după greutate', -materialDiscountTotal, weightDiscount.discountPerGram > 0 ? `${totalWeight} g × -${weightDiscount.discountPerGram.toFixed(2)} RON/g` : 'Neaplicat'),
      buildBreakdownRow('Timp mașină', machineTotal, !knowsExactTime ? 'Neestimat: timpul se confirmă după slicer sau când bifezi că îl știi exact' : machineTotal > 0 ? `${billableMachineHours} ore taxabile peste primele ${CALCULATOR.machine.includedHours} ore × ${CALCULATOR.machine.hourlyRate} RON/oră × ${quantity} buc.` : `Neaplicat. Primele ${CALCULATOR.machine.includedHours} ore nu se taxează separat.`),
      buildBreakdownRow(modelStatus.label, modelPreparationTotal, modelPreparationTotal > 0 ? 'Estimare minimă. Se confirmă după verificarea fișierului sau brief-ului.' : 'Neaplicat'),
      buildBreakdownRow('Post-procesare', postProcessingTotal, selectedPostProcessing.length ? `Calculat pentru ${finishingParts} piesă/piese de finisat, folosind capătul inferior al intervalelor` : 'Neaplicat')
    ];

    if (minimumOrderAdjustment > 0) {
      rows.push(buildBreakdownRow('Ajustare comandă minimă', minimumOrderAdjustment, `Comanda minimă este ${formatMoney(CALCULATOR.minimumOrder)}`));
    }

    breakdownElement.innerHTML = rows.join('');
  }

  if (noteElement) {
    noteElement.textContent = 'Estimarea este orientativă. Greutatea se introduce din 50 în 50 g pentru o estimare rapidă; dacă o știi exact, poți bifa opțiunea de greutate exactă. Timpul de printare apare doar când bifezi că îl știi exact; timpul mașină se taxează doar peste primele 5 ore și se rotunjește în trepte de 0.5 ore.';
  }

  if (mailtoElement) {
    const subject = encodeURIComponent('Estimare printare 3D');
    const body = encodeURIComponent(`Bună,\n\nAș dori o estimare pentru printare 3D.\n\nEstimare calculator: ${formatMoney(total)}\nPreț pe bucată: ${formatMoney(perUnit)}\nCantitate: ${quantity}\nGreutate estimată totală: ${totalWeight} g (${weightModeLabel})\nTimp estimat per bucată: ${knowsExactTime ? `${printHours} ore` : 'nu știu / de verificat'}\nNivel fișier: ${material.label}\nStare model: ${modelStatus.label}\nReducere greutate: ${weightDiscount.label}\nPost-procesare: ${selectedPostProcessing.length ? selectedPostProcessing.join(', ') : 'nu'}\nFișier selectat în calculator: ${uploadedFileName || 'nu'}\n\nAtașez fișierul sau trimit mai multe detalii.\n`);
    mailtoElement.href = `mailto:hello@example.com?subject=${subject}&body=${body}`;
  }
}

if (calculatorForm) {
  calculatorForm.addEventListener('input', updateCalculator);
  calculatorForm.addEventListener('change', updateCalculator);
  updateCalculator();
}
