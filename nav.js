// nav.js

function renderNav() {
  const wrap = document.getElementById('navLeft');
  wrap.innerHTML = '';

  data.nav.forEach(btn => {
    const el = document.createElement('button');
    el.className = 'nav-btn' + (btn.label === 'Home' ? ' active' : '');
    el.textContent = btn.label;
    el.dataset.url = btn.url;
    el.dataset.id = btn.id || crypto.randomUUID();
    el.dataset.label = btn.label;

    el.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      el.classList.add('active');
      if (btn.url && btn.url !== '#') {
        window.location.href = btn.url; // same tab navigation
      }
    });

    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      openNavContext(e.clientX, e.clientY, el.dataset.id);
    });

    wrap.appendChild(el);
  });

  // Add button
  const addBtn = document.createElement('button');
  addBtn.id = 'addNavBtn';
  addBtn.className = 'nav-btn add-btn';
  addBtn.textContent = '+ Add';
  wrap.appendChild(addBtn);

  addBtn.addEventListener('click', () => {
    const label = prompt('New button label:');
    if (!label) return;
    const url = prompt('Button URL:', '#') || '#';
    data.nav.push({ label, url, id: crypto.randomUUID() });
    renderNav();
    saveToFile();
  });
}

function openNavContext(x, y, id) {
  const menu = document.getElementById('navContext');
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  menu.style.display = 'block';
  menu.dataset.targetId = id;
}

function closeNavContext() {
  const menu = document.getElementById('navContext');
  menu.style.display = 'none';
  delete menu.dataset.targetId;
}

document.addEventListener('click', (e) => {
  const menu = document.getElementById('navContext');
  if (menu.style.display === 'block' && !menu.contains(e.target)) closeNavContext();
});

document.getElementById('navContext').addEventListener('click', (e) => {
  const action = e.target.dataset.action;
  const id = e.currentTarget.dataset.targetId;
  if (!action || !id) return;
  const idx = data.nav.findIndex(n => (n.id || n.label) === id);
  if (idx === -1) return;

  if (action === 'edit') {
    const cur = data.nav[idx];
    const label = prompt('Label:', cur.label) ?? cur.label;
    const url = prompt('URL:', cur.url) ?? cur.url;
    data.nav[idx] = { ...cur, label, url };
  } else if (action === 'delete') {
    if (confirm('Delete this nav button?')) {
      data.nav.splice(idx, 1);
      if (!data.nav.find(n => n.label === 'Home')) {
        data.nav.unshift({ label: 'Home', url: '#', id: 'home' });
      }
    }
  }
  closeNavContext();
  renderNav();
  saveToFile();
});
