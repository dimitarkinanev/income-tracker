import { defaultData, reloadFromFile, saveToFile, idbGet } from './js/persistence.js';

let data = structuredClone(defaultData);
let fileHandle = null;
let currentYear = new Date().getFullYear();

async function initCalendar() {
  const stored = await idbGet('trackerFileHandle');
  if (stored) {
    fileHandle = stored;
    await reloadFromFile(fileHandle, data);
  }
  renderAll();
}

function renderAll() {
  setYear(currentYear);
  renderCalendar();
  renderSummary();
  renderEventsList();
}

function addEvent(event) {
  data.events.push(event);
  saveToFile(fileHandle, data, renderAll); // auto-refresh after save
}


window.addEventListener('load', initCalendar);
