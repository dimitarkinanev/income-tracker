// persistence.js
const DB_NAME = 'tracker-db';
const DB_STORE = 'file-handles';

export const defaultData = {
  version: 1,
  ui: {
    fontSizes: { title: 20, th: 14, td: 14, icon: 18 },
    calendar: { monthTitle: 18, dayHeader: 12, dayValue: 12 }
  },
  nav: [{ label: 'Home', url: '#', id: 'home' }],
  filter: { month: new Date().getMonth()+1, year: new Date().getFullYear() },
  entries: { income: [], expenses: [], personal: [] },   // Tracker
  events: [],                                            // Calendar
  vacationAllowance: {},                                 // Calendar
  meta: { notes: '' }
};

export async function idbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbGet(key) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readonly');
    const store = tx.objectStore(DB_STORE);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbSet(key, value) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    const store = tx.objectStore(DB_STORE);
    const req = store.put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export function ensureCoreStructures(obj) {
  obj.ui ||= defaultData.ui;
  obj.nav ||= [{label:'Home',url:'#',id:'home'}];
  obj.filter ||= { month: new Date().getMonth()+1, year: new Date().getFullYear() };
  obj.entries ||= { income: [], expenses: [], personal: [] };
  obj.events ||= [];
  obj.vacationAllowance ||= {};
  obj.meta ||= { notes: '' };
  return obj;
}

export function deepMerge(target, source) {
  Object.keys(source || {}).forEach(key => {
    const sv = source[key];
    if (sv && typeof sv === 'object' && !Array.isArray(sv)) {
      target[key] ||= {};
      deepMerge(target[key], sv);
    } else {
      target[key] = sv;
    }
  });
}

export async function writeFile(fileHandle, obj) {
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(obj, null, 2));
  await writable.close();
}

export async function reloadFromFile(fileHandle, dataRef) {
  const file = await fileHandle.getFile();
  const text = await file.text();
  let parsed; try { parsed = JSON.parse(text || '{}'); } catch { parsed = {}; }
  if (!parsed || Object.keys(parsed).length === 0) {
    parsed = structuredClone(defaultData);
    await writeFile(fileHandle, parsed);
  }
  const merged = ensureCoreStructures(structuredClone(defaultData));
  deepMerge(merged, parsed);
  Object.assign(dataRef, merged); // update your in-memory data
}

export async function saveToFile(fileHandle, dataRef, renderFn=null) {
  if (!fileHandle) return;
  try {
    const file = await fileHandle.getFile();
    const currentText = await file.text().catch(()=> '{}');
    let current = {};
    try { current = JSON.parse(currentText || '{}'); } catch { current = {}; }
    current = ensureCoreStructures(current);

    const merged = structuredClone(current);
    deepMerge(merged, dataRef);

    await writeFile(fileHandle, merged);

    // 🔑 Automatically refresh UI if a render function is provided
    if (typeof renderFn === 'function') renderFn();

  } catch (e) {
    console.error('Autosave failed', e);
  }
}

