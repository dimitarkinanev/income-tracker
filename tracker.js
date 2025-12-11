import { defaultData, reloadFromFile, saveToFile, idbGet } from './js/persistence.js';

let data = structuredClone(defaultData);
let fileHandle = null;

async function initTracker() {
  const stored = await idbGet('trackerFileHandle');
  if (stored) {
    fileHandle = stored;
    await reloadFromFile(fileHandle, data);
  }
  renderAll();
}

function renderAll() {
  renderNav();
  renderFilters();
  renderTable('income','incomeTable','incomeSum',false);
  renderTable('expenses','expensesTable','expensesSum',true);
  renderExpensesCheckedTotal();
  renderTable('personal','personalTable','personalSum',false);
  renderSavings();
}

function addIncomeEntry(entry) {
  data.entries.income.push(entry);
  saveToFile(fileHandle, data, renderAll); // auto-refresh after save
}


window.addEventListener('load', initTracker);
