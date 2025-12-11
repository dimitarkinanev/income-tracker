// utilities.js

function initUtilitiesPage() {
  // Ensure data.utilities structure
  if (!data.utilities) data.utilities = { cards: [] };
  renderNav();              // shared nav
  wireNewCardModal();       // open/close modal and schema builder
  renderUtilities();        // initial cards and notifications
}

/* ===== Modal wiring ===== */
function wireNewCardModal() {
  const modal = document.getElementById('newCardModal');
  const btn = document.getElementById('newCardBtn');
  const cancel = document.getElementById('nc_cancel');
  const create = document.getElementById('nc_create');
  const colsWrap = document.getElementById('nc_columns');
  const badgesWrap = document.getElementById('nc_badges');
  const filtersWrap = document.getElementById('nc_filters');
  const enableFilter = document.getElementById('nc_enableFilter');
  const enableNotifs = document.getElementById('nc_enableNotifications');
  const notifControls = document.getElementById('nc_notificationsControls');
  const notifyColumn = document.getElementById('nc_notifyColumn');

  let tempColumns = [];   // {id,title,kind}
  let tempBadges = [];    // {id,title,calc:{op,columns}}
  let tempFilters = [];   // {id,title,type,column}

  function openModal() {
    tempColumns = [
      { id: crypto.randomUUID(), title: 'Title', kind: 'text' },
      { id: crypto.randomUUID(), title: 'Amount', kind: 'number' }
    ];
    tempBadges = [];
    tempFilters = [];
    enableFilter.checked = false;
    enableNotifs.checked = false;
    notifControls.style.display = 'none';
    renderColumnEditor();
    renderBadgeEditor();
    renderFilterEditor();
    modal.style.display = 'block';
    refreshNotifyColumnOptions();
  }
  function closeModal() { modal.style.display = 'none'; }

  btn.addEventListener('click', openModal);
  cancel.addEventListener('click', closeModal);

  document.getElementById('nc_addColumn').addEventListener('click', () => {
    tempColumns.push({ id: crypto.randomUUID(), title: 'New column', kind: 'text' });
    renderColumnEditor();
    refreshNotifyColumnOptions();
  });

  document.getElementById('nc_addBadge').addEventListener('click', () => {
    tempBadges.push({
      id: crypto.randomUUID(),
      title: 'New badge',
      calc: { op: 'sum', columns: [] }
    });
    renderBadgeEditor();
  });

  document.getElementById('nc_addFilter').addEventListener('click', () => {
    tempFilters.push({
      id: crypto.randomUUID(),
      title: 'Month',
      type: 'month',
      column: tempColumns.find(c => c.kind === 'date')?.id || tempColumns[0]?.id
    });
    renderFilterEditor();
  });

  enableNotifs.addEventListener('change', () => {
    notifControls.style.display = enableNotifs.checked ? 'block' : 'none';
  });

  create.addEventListener('click', () => {
    const title = document.getElementById('nc_title').value.trim();
    if (!title) { alert('Please set a title'); return; }
    const cardId = crypto.randomUUID();
    const card = {
      id: cardId,
      title,
      type: 'type1',
      columns: tempColumns,
      rows: [],
      badges: tempBadges,
      filters: {
        enabled: enableFilter.checked,
        criteria: tempFilters,
        active: Object.fromEntries(tempFilters.map(f => [f.id, null]))
      },
      notifications: {
        enabled: enableNotifs.checked,
        column: enableNotifs.checked ? notifyColumn.value : null,
        daysBefore: enableNotifs.checked ? Number(document.getElementById('nc_notifyDaysBefore').value || 1) : 0
      }
    };
    data.utilities.cards.push(card);
    saveToFile();
    closeModal();
    renderUtilities();
  });

  function renderColumnEditor() {
    colsWrap.innerHTML = '';
    tempColumns.forEach((c, idx) => {
      const row = document.createElement('div');
      row.style.display = 'grid';
      row.style.gridTemplateColumns = '1fr 140px 80px 40px';
      row.style.gap = '8px';
      row.style.marginBottom = '6px';
      row.innerHTML = `
        <input data-id="${c.id}" class="col-title" value="${c.title}">
        <select data-id="${c.id}" class="col-kind">
          <option value="text" ${c.kind==='text'?'selected':''}>Text</option>
          <option value="number" ${c.kind==='number'?'selected':''}>Number</option>
          <option value="date" ${c.kind==='date'?'selected':''}>Date</option>
        </select>
        <button data-idx="${idx}" class="new-card-btn col-up">↑</button>
        <button data-idx="${idx}" class="new-card-btn col-del">✕</button>
      `;
      colsWrap.appendChild(row);
    });
    // wire events
    colsWrap.querySelectorAll('.col-title').forEach(el=>{
      el.addEventListener('input', () => {
        const col = tempColumns.find(c => c.id === el.dataset.id);
        if (col) col.title = el.value;
        refreshNotifyColumnOptions();
      });
    });
    colsWrap.querySelectorAll('.col-kind').forEach(el=>{
      el.addEventListener('change', () => {
        const col = tempColumns.find(c => c.id === el.dataset.id);
        if (col) col.kind = el.value;
        refreshNotifyColumnOptions();
      });
    });
    colsWrap.querySelectorAll('.col-up').forEach(el=>{
      el.addEventListener('click', () => {
        const i = Number(el.dataset.idx);
        if (i > 0) [tempColumns[i-1], tempColumns[i]] = [tempColumns[i], tempColumns[i-1]];
        renderColumnEditor();
        refreshNotifyColumnOptions();
      });
    });
    colsWrap.querySelectorAll('.col-del').forEach(el=>{
      el.addEventListener('click', () => {
        const i = Number(el.dataset.idx);
        tempColumns.splice(i,1);
        renderColumnEditor();
        refreshNotifyColumnOptions();
      });
    });
  }

  function renderBadgeEditor() {
    badgesWrap.innerHTML = '';
    tempBadges.forEach((b, idx) => {
      const row = document.createElement('div');
      row.style.display = 'grid';
      row.style.gridTemplateColumns = '1fr 120px 1fr 40px';
      row.style.gap = '8px';
      row.style.marginBottom = '6px';
      row.innerHTML = `
        <input data-id="${b.id}" class="badge-title" value="${b.title}" placeholder="Badge title">
        <select data-id="${b.id}" class="badge-op">
          <option value="sum" ${b.calc.op==='sum'?'selected':''}>Sum</option>
          <option value="avg" ${b.calc.op==='avg'?'selected':''}>Average</option>
          <option value="min" ${b.calc.op==='min'?'selected':''}>Min</option>
          <option value="max" ${b.calc.op==='max'?'selected':''}>Max</option>
          <option value="count" ${b.calc.op==='count'?'selected':''}>Count</option>
        </select>
        <select multiple data-id="${b.id}" class="badge-cols" style="min-height:28px;">
          ${tempColumns.map(c=>`<option value="${c.id}" ${b.calc.columns.includes(c.id)?'selected':''}>${c.title}</option>`).join('')}
        </select>
        <button data-idx="${idx}" class="new-card-btn badge-del">✕</button>
      `;
      badgesWrap.appendChild(row);
    });
    badgesWrap.querySelectorAll('.badge-title').forEach(el=>{
      el.addEventListener('input', () => {
        const b = tempBadges.find(x => x.id === el.dataset.id);
        if (b) b.title = el.value;
      });
    });
    badgesWrap.querySelectorAll('.badge-op').forEach(el=>{
      el.addEventListener('change', () => {
        const b = tempBadges.find(x => x.id === el.dataset.id);
        if (b) b.calc.op = el.value;
      });
    });
    badgesWrap.querySelectorAll('.badge-cols').forEach(el=>{
      el.addEventListener('change', () => {
        const b = tempBadges.find(x => x.id === el.dataset.id);
        if (b) b.calc.columns = Array.from(el.selectedOptions).map(o=>o.value);
      });
    });
    badgesWrap.querySelectorAll('.badge-del').forEach(el=>{
      el.addEventListener('click', () => {
        tempBadges.splice(Number(el.dataset.idx),1);
        renderBadgeEditor();
      });
    });
  }

  function renderFilterEditor() {
    filtersWrap.innerHTML = '';
    tempFilters.forEach((f, idx) => {
      const row = document.createElement('div');
      row.className = 'filter';
      row.innerHTML = `
        <input class="filter-title" data-id="${f.id}" value="${f.title}">
        <select class="filter-type" data-id="${f.id}">
          <option value="month" ${f.type==='month'?'selected':''}>Month</option>
          <option value="year" ${f.type==='year'?'selected':''}>Year</option>
          <option value="equals" ${f.type==='equals'?'selected':''}>Equals</option>
          <option value="contains" ${f.type==='contains'?'selected':''}>Contains</option>
        </select>
        <select class="filter-column" data-id="${f.id}">
          ${tempColumns.map(c=>`<option value="${c.id}" ${f.column===c.id?'selected':''}>${c.title}</option>`).join('')}
        </select>
        <button data-idx="${idx}" class="new-card-btn filter-del">✕</button>
      `;
      filtersWrap.appendChild(row);
    });
    filtersWrap.querySelectorAll('.filter-title').forEach(el=>{
      el.addEventListener('input',()=>{ const f = tempFilters.find(x=>x.id===el.dataset.id); if (f) f.title = el.value; });
    });
    filtersWrap.querySelectorAll('.filter-type').forEach(el=>{
      el.addEventListener('change',()=>{ const f = tempFilters.find(x=>x.id===el.dataset.id); if (f) f.type = el.value; });
    });
    filtersWrap.querySelectorAll('.filter-column').forEach(el=>{
      el.addEventListener('change',()=>{ const f = tempFilters.find(x=>x.id===el.dataset.id); if (f) f.column = el.value; });
    });
    filtersWrap.querySelectorAll('.filter-del').forEach(el=>{
      el.addEventListener('click',()=>{ tempFilters.splice(Number(el.dataset.idx),1); renderFilterEditor(); });
    });
  }

  function refreshNotifyColumnOptions() {
    notifyColumn.innerHTML = tempColumns
      .filter(c => c.kind === 'date')
      .map(c => `<option value="${c.id}">${c.title}</option>`)
      .join('');
  }
}

/* ===== Rendering cards and notifications ===== */
function renderUtilities() {
  const area = document.getElementById('utilitiesCards');
  area.innerHTML = '';

  // Notifications summary
  renderNotificationsArea();

  data.utilities.cards.forEach(card => {
    const cardEl = document.createElement('div');
    cardEl.className = `card ${card.type || 'type1'}`;
    cardEl.dataset.cardId = card.id;

    // Header
    const header = document.createElement('div');
    header.className = 'card-header';
    header.innerHTML = `
      <div class="card-title">${card.title}</div>
      <div class="badge-bar">${renderBadgesHTML(card)}</div>
    `;
    cardEl.appendChild(header);

    // Filters section
    if (card.filters?.enabled && card.filters.criteria?.length) {
      const filtersEl = document.createElement('div');
      filtersEl.className = 'filters';
      card.filters.criteria.forEach(f => {
        const wrap = document.createElement('div');
        wrap.className = 'filter';
        wrap.innerHTML = `
          <label>${f.title}</label>
          ${renderFilterControlHTML(f, card)}
        `;
        filtersEl.appendChild(wrap);
      });
      cardEl.appendChild(filtersEl);
    }

    // Table
    const tableWrap = document.createElement('div');
    tableWrap.className = 'table-wrap';
    tableWrap.appendChild(renderCardTable(card));
    cardEl.appendChild(tableWrap);

    // Context menu on card
    cardEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      openCardContext(e.clientX, e.clientY, card.id);
    });

    area.appendChild(cardEl);
  });
}

/* ===== Badges ===== */
function renderBadgesHTML(card) {
  if (!card.badges || !card.badges.length) return '';
  const values = computeBadgeValues(card);
  return card.badges.map(b => {
    const v = values[b.id];
    return `<span class="badge"><strong>${b.title}:</strong> ${formatBadgeValue(b.calc.op, v)}</span>`;
  }).join('');
}
function computeBadgeValues(card) {
  const out = {};
  card.badges.forEach(b => {
    const cols = b.calc.columns;
    const op = b.calc.op;
    const values = card.rows.flatMap(r => cols.map(c => r.cells[c]).filter(v => v !== undefined));
    const numeric = values.map(v => typeof v === 'number' ? v : Number(v)).filter(v => !isNaN(v));
    let result = null;
    if (op === 'sum') result = numeric.reduce((a,b)=>a+b,0);
    else if (op === 'avg') result = numeric.length ? numeric.reduce((a,b)=>a+b,0)/numeric.length : 0;
    else if (op === 'min') result = numeric.length ? Math.min(...numeric) : null;
    else if (op === 'max') result = numeric.length ? Math.max(...numeric) : null;
    else if (op === 'count') result = values.length;
    out[b.id] = result;
  });
  return out;
}
function formatBadgeValue(op, v) {
  if (v === null || v === undefined) return '-';
  if (op === 'avg') return Number(v).toFixed(2);
  if (op === 'sum') return Number(v).toFixed(2);
  return String(v);
}

/* ===== Filters ===== */
function renderFilterControlHTML(f, card) {
  const active = card.filters.active?.[f.id] ?? null;
  if (f.type === 'month') {
    const months = Array.from({length:12},(_,i)=>i+1);
    return `<select data-card="${card.id}" data-filter="${f.id}" class="filter-dd">
      <option value="">All</option>
      ${months.map(m=>`<option value="${m}" ${active==m?'selected':''}>${m}</option>`).join('')}
    </select>`;
  }
  if (f.type === 'year') {
    const years = collectYears(card, f.column);
    return `<select data-card="${card.id}" data-filter="${f.id}" class="filter-dd">
      <option value="">All</option>
      ${years.map(y=>`<option value="${y}" ${active==y?'selected':''}>${y}</option>`).join('')}
    </select>`;
  }
  // equals/contains (text)
  return `<input data-card="${card.id}" data-filter="${f.id}" class="filter-dd" value="${active??''}" placeholder="${f.type}...">`;
}
function collectYears(card, columnId) {
  const years = new Set();
  card.rows.forEach(r => {
    const v = r.cells[columnId];
    const d = v ? new Date(v) : null;
    if (d && !isNaN(d)) years.add(d.getFullYear());
  });
  return Array.from(years).sort((a,b)=>a-b);
}
// Delegated events for filters
document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.classList.contains('filter-dd')) {
    const cardId = el.dataset.card;
    const filterId = el.dataset.filter;
    const card = data.utilities.cards.find(c => c.id === cardId);
    if (!card) return;
    const val = el.tagName === 'SELECT' ? (el.value || null) : (el.value.trim() || null);
    card.filters.active[filterId] = val;
    saveToFile();
    // Re-render only the table of this card
    rerenderCardTable(cardId);
  }
});
function applyFilters(card) {
  if (!card.filters?.enabled || !card.filters.criteria?.length) return card.rows;
  return card.rows.filter(r => {
    return card.filters.criteria.every(f => {
      const val = card.filters.active?.[f.id];
      if (val === null || val === '' || val === undefined) return true; // no filter
      const cell = r.cells[f.column];
      if (f.type === 'month') {
        const d = cell ? new Date(cell) : null;
        if (!d || isNaN(d)) return false;
        return (d.getMonth()+1) == Number(val);
      }
      if (f.type === 'year') {
        const d = cell ? new Date(cell) : null;
        if (!d || isNaN(d)) return false;
        return d.getFullYear() == Number(val);
      }
      if (f.type === 'equals') return String(cell) === String(val);
      if (f.type === 'contains') return String(cell).toLowerCase().includes(String(val).toLowerCase());
      return true;
    });
  });
}

/* ===== Card table and row operations ===== */
function renderCardTable(card) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const trh = document.createElement('tr');
  card.columns.forEach(c => {
    const th = document.createElement('th');
    th.textContent = c.title;
    trh.appendChild(th);
  });
  thead.appendChild(trh);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  const rows = applyFilters(card);
  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.dataset.rowId = r.id;
    card.columns.forEach(c => {
      const td = document.createElement('td');
      const v = r.cells[c.id];
      td.textContent = formatCell(v, c.kind);
      tr.appendChild(td);
    });
    // row context menu
    tr.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      openRowContext(e.clientX, e.clientY, card.id, r.id);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  return table;
}
function formatCell(v, kind) {
  if (v == null) return '';
  if (kind === 'number') return Number(v).toFixed(2);
  if (kind === 'date') return new Date(v).toISOString().slice(0,10);
  return String(v);
}
function rerenderCardTable(cardId) {
  const area = document.getElementById('utilitiesCards');
  const cardEl = area.querySelector(`.card[data-card-id="${cardId}"]`);
  const card = data.utilities.cards.find(c => c.id === cardId);
  if (!card || !cardEl) return;
  const tableWrap = cardEl.querySelector('.table-wrap');
  tableWrap.innerHTML = '';
  tableWrap.appendChild(renderCardTable(card));
}

/* ===== Notifications ===== */
function renderNotificationsArea() {
  const area = document.getElementById('notificationsArea');
  area.innerHTML = '';
  const items = collectNotifications();
  if (!items.length) return;
  const wrap = document.createElement('div');
  wrap.className = 'notification-card';
  wrap.innerHTML = items.map(n =>
    `<div><strong>${n.cardTitle}</strong> — ${n.rowSummary} (due ${n.dateStr})</div>`
  ).join('');
  area.appendChild(wrap);
}
function collectNotifications() {
  const today = new Date();
  return (data.utilities.cards || []).flatMap(card => {
    const notif = card.notifications;
    if (!notif?.enabled || !notif.column) return [];
    const days = Number(notif.daysBefore || 0);
    return card.rows.flatMap(r => {
      const v = r.cells[notif.column];
      if (!v) return [];
      const d = new Date(v);
      if (isNaN(d)) return [];
      const diffDays = Math.ceil((d - today) / (1000*60*60*24));
      if (diffDays <= days && diffDays >= 0) {
        const rowSummary = summarizeRow(card, r);
        return [{ cardId: card.id, cardTitle: card.title, rowSummary, dateStr: d.toISOString().slice(0,10) }];
      }
      return [];
    });
  });
}
function summarizeRow(card, row) {
  const firstTextCol = card.columns.find(c => c.kind === 'text') || card.columns[0];
  const txt = row.cells[firstTextCol.id];
  return txt ? String(txt) : `Row ${row.id}`;
}

/* ===== Card context menu ===== */
function openCardContext(x, y, cardId) {
  const menu = document.getElementById('rowContext'); // reuse but we will handle card ops separately
  // For cards, we’ll open a dedicated card menu:
  const cm = ensureCardContextMenu();
  cm.style.left = x + 'px';
  cm.style.top = y + 'px';
  cm.style.display = 'block';
  cm.dataset.cardId = cardId;
}
function ensureCardContextMenu() {
  let cm = document.getElementById('cardContext');
  if (!cm) {
    cm = document.createElement('div');
    cm.id = 'cardContext';
    cm.className = 'context-menu';
    cm.innerHTML = `
      <button data-action="add-row">Add row</button>
      <button data-action="edit-card">Edit card</button>
      <button data-action="delete-card">Delete card</button>
    `;
    document.body.appendChild(cm);
    cm.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      const cardId = cm.dataset.cardId;
      if (!action || !cardId) return;
      handleCardAction(action, cardId);
      cm.style.display = 'none';
    });
    document.addEventListener('click', (e) => {
      if (cm.style.display === 'block' && !cm.contains(e.target)) cm.style.display = 'none';
    });
  }
  return cm;
}
function handleCardAction(action, cardId) {
  const card = data.utilities.cards.find(c => c.id === cardId);
  if (!card) return;
  if (action === 'add-row') {
    const row = promptNewRow(card);
    if (row) {
      card.rows.push(row);
      saveToFile();
      rerenderCardTable(cardId);
      renderNotificationsArea();
    }
  } else if (action === 'edit-card') {
    editCardModal(card);
  } else if (action === 'delete-card') {
    if (confirm('Delete this card?')) {
      data.utilities.cards = data.utilities.cards.filter(c => c.id !== cardId);
      saveToFile();
      renderUtilities();
      renderNotificationsArea();
    }
  }
}

/* ===== Row context ===== */
function openRowContext(x, y, cardId, rowId) {
  const menu = document.getElementById('rowContext');
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  menu.style.display = 'block';
  menu.dataset.cardId = cardId;
  menu.dataset.rowId = rowId;
}
document.getElementById('rowContext').addEventListener('click', (e) => {
  const action = e.target.dataset.action;
  const menu = e.currentTarget;
  const { cardId, rowId } = menu.dataset;
  if (!action || !cardId || !rowId) return;
  const card = data.utilities.cards.find(c => c.id === cardId);
  const rowIdx = card?.rows.findIndex(r => r.id === rowId);
  if (card && rowIdx >= 0) {
    if (action === 'edit-row') {
      const newRow = promptEditRow(card, card.rows[rowIdx]);
      if (newRow) card.rows[rowIdx] = newRow;
    } else if (action === 'delete-row') {
      if (confirm('Delete row?')) card.rows.splice(rowIdx, 1);
    }
    saveToFile();
    rerenderCardTable(cardId);
    renderNotificationsArea();
  }
  menu.style.display = 'none';
});
document.addEventListener('click', (e) => {
  const menu = document.getElementById('rowContext');
  if (menu.style.display === 'block' && !menu.contains(e.target)) menu.style.display = 'none';
});

/* ===== Simple row prompts (replace with form if desired) ===== */
function promptNewRow(card) {
  const cells = {};
  for (const c of card.columns) {
    const val = prompt(`Value for ${c.title} (${c.kind})`);
    if (val == null) return null;
    cells[c.id] = coerceVal(val, c.kind);
  }
  return { id: crypto.randomUUID(), cells };
}
function promptEditRow(card, row) {
  const cells = {};
  for (const c of card.columns) {
    const cur = row.cells[c.id];
    const val = prompt(`Value for ${c.title} (${c.kind})`, c.kind==='date' && cur ? new Date(cur).toISOString().slice(0,10) : cur);
    if (val == null) return null;
    cells[c.id] = coerceVal(val, c.kind);
  }
  return { id: row.id, cells };
}
function coerceVal(val, kind) {
  if (kind === 'number') return Number(val);
  if (kind === 'date') return new Date(val).toISOString();
  return val;
}
