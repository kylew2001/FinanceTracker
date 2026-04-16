const SESSION_KEY = 'financeTracker.session';
const BUDGET_KEY = 'financeTracker.budget';
const MOVEMENT_KEY = 'financeTracker.movements';
const PROFILE_KEY = 'financeTracker.profile';

const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
if (!session?.username) {
  window.location.href = 'index.html';
}

const state = {
  budget: loadByUser(BUDGET_KEY),
  movements: loadByUser(MOVEMENT_KEY),
  profile: loadByUser(PROFILE_KEY, { name: '', phone: '', photoUrl: '' })
};

document.querySelector('#welcome-name').textContent = `Hi, ${session.username}`;

setupNav();
setupBudget();
setupMovements();
setupProfile();

renderBudget();
renderMovements();
renderProfile();

document.querySelector('#logout')?.addEventListener('click', () => {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = 'index.html';
});

function setupNav() {
  document.querySelectorAll('.menu-item').forEach((button) => {
    button.addEventListener('click', () => {
      const page = button.dataset.page;

      document.querySelectorAll('.menu-item').forEach((b) => b.classList.remove('active'));
      button.classList.add('active');

      document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
      document.querySelector(`#page-${page}`)?.classList.add('active');
    });
  });
}

function setupBudget() {
  const form = document.querySelector('#budget-form');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();

    const entry = {
      id: crypto.randomUUID(),
      description: value('#budget-description'),
      type: value('#budget-type'),
      amount: Number(value('#budget-amount')),
      period: value('#budget-period')
    };

    if (!entry.description || Number.isNaN(entry.amount)) {
      return;
    }

    state.budget.push(entry);
    persistByUser(BUDGET_KEY, state.budget);
    form.reset();
    renderBudget();
  });
}

function setupMovements() {
  const form = document.querySelector('#movement-form');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();

    const movement = {
      id: crypto.randomUUID(),
      account: value('#movement-account'),
      label: value('#movement-label'),
      amount: Number(value('#movement-amount')),
      type: value('#movement-type')
    };

    if (!movement.account || !movement.label || Number.isNaN(movement.amount)) {
      return;
    }

    state.movements.push(movement);
    persistByUser(MOVEMENT_KEY, state.movements);
    form.reset();
    renderMovements();
  });
}

function setupProfile() {
  const form = document.querySelector('#profile-form');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();

    state.profile = {
      name: value('#profile-name'),
      phone: value('#profile-phone'),
      photoUrl: value('#profile-photo')
    };

    persistByUser(PROFILE_KEY, state.profile);
    renderProfile();
  });
}

function renderBudget() {
  const table = document.querySelector('#budget-table');
  table.innerHTML = '';

  let monthlyIncome = 0;
  let monthlyExpenses = 0;

  state.budget.forEach((entry) => {
    const monthlyEq = toMonthly(entry.amount, entry.period);
    if (entry.type === 'income') monthlyIncome += monthlyEq;
    else monthlyExpenses += monthlyEq;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHtml(entry.description)}</td>
      <td>${entry.type}</td>
      <td>${formatCurrency(entry.amount)}</td>
      <td>${entry.period}</td>
      <td>${formatCurrency(monthlyEq)}</td>
      <td><button data-del-budget="${entry.id}">Delete</button></td>
    `;
    table.appendChild(row);
  });

  document.querySelector('#monthly-income').textContent = formatCurrency(monthlyIncome);
  document.querySelector('#monthly-expenses').textContent = formatCurrency(monthlyExpenses);
  document.querySelector('#monthly-left').textContent = formatCurrency(monthlyIncome - monthlyExpenses);

  table.querySelectorAll('button[data-del-budget]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-del-budget');
      state.budget = state.budget.filter((x) => x.id !== id);
      persistByUser(BUDGET_KEY, state.budget);
      renderBudget();
    });
  });
}

function renderMovements() {
  const table = document.querySelector('#movement-table');
  table.innerHTML = '';

  let running = 0;
  state.movements.forEach((m) => {
    const signed = m.type === 'deposit' ? Math.abs(m.amount) : -Math.abs(m.amount);
    running += signed;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHtml(m.account)}</td>
      <td>${escapeHtml(m.label)}</td>
      <td>${m.type}</td>
      <td>${formatCurrency(signed)}</td>
      <td>${formatCurrency(running)}</td>
      <td><button data-del-movement="${m.id}">Delete</button></td>
    `;
    table.appendChild(row);
  });

  document.querySelector('#account-total').textContent = formatCurrency(running);

  table.querySelectorAll('button[data-del-movement]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-del-movement');
      state.movements = state.movements.filter((x) => x.id !== id);
      persistByUser(MOVEMENT_KEY, state.movements);
      renderMovements();
    });
  });
}

function renderProfile() {
  document.querySelector('#profile-name').value = state.profile.name || '';
  document.querySelector('#profile-phone').value = state.profile.phone || '';
  document.querySelector('#profile-photo').value = state.profile.photoUrl || '';

  document.querySelector('#profile-name-preview').textContent = state.profile.name || 'No name set';
  document.querySelector('#profile-phone-preview').textContent = state.profile.phone || 'No phone set';

  const img = document.querySelector('#profile-photo-preview');
  img.src = state.profile.photoUrl || 'https://via.placeholder.com/64?text=User';
}

function loadByUser(key, fallback = []) {
  const raw = JSON.parse(localStorage.getItem(key) || '{}');
  return raw[session.username] ?? fallback;
}

function persistByUser(key, value) {
  const raw = JSON.parse(localStorage.getItem(key) || '{}');
  raw[session.username] = value;
  localStorage.setItem(key, JSON.stringify(raw));
}

function value(selector) {
  return document.querySelector(selector)?.value.trim() || '';
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function toMonthly(amount, period) {
  const map = {
    weekly: 52 / 12,
    fortnightly: 26 / 12,
    monthly: 1,
    yearly: 1 / 12
  };
  return amount * (map[period] || 1);
}

function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
