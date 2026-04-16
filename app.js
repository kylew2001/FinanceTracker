import { clearSession, getSupabaseClient, requireSession } from './db.js';

const session = requireSession();
const supabase = getSupabaseClient();

const state = {
  budget: [],
  movements: [],
  profile: { name: '', phone: '', photoUrl: '' }
};

document.querySelector('#welcome-name').textContent = `Hi, ${session.username}`;

document.querySelector('#logout')?.addEventListener('click', async () => {
  try {
    await supabase.from('users').update({ session_token: null }).eq('id', session.userId);
  } finally {
    clearSession();
    window.location.href = 'index.html';
  }
});

setupNav();
setupBudget();
setupMovements();
setupProfile();

bootstrap().catch((err) => {
  console.error(err);
  alert('Could not load data. Check Supabase setup.');
});

async function bootstrap() {
  const { data: validUser, error: authErr } = await supabase
    .from('users')
    .select('id')
    .eq('id', session.userId)
    .eq('session_token', session.token)
    .limit(1);

  if (authErr || !validUser?.length) {
    clearSession();
    window.location.href = 'index.html';
    return;
  }

  await Promise.all([loadBudget(), loadMovements(), loadProfile()]);
  renderBudget();
  renderMovements();
  renderProfile();
}

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
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const entry = {
      user_id: session.userId,
      description: value('#budget-description'),
      entry_type: value('#budget-type'),
      amount: Number(value('#budget-amount')),
      period: value('#budget-period')
    };

    if (!entry.description || Number.isNaN(entry.amount)) return;

    const { error } = await supabase.from('budget_entries').insert(entry);
    if (error) return alert('Could not save budget item.');

    form.reset();
    await loadBudget();
    renderBudget();
  });
}

function setupMovements() {
  const form = document.querySelector('#movement-form');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const movement = {
      user_id: session.userId,
      account: value('#movement-account'),
      label: value('#movement-label'),
      amount: Number(value('#movement-amount')),
      movement_type: value('#movement-type')
    };

    if (!movement.account || !movement.label || Number.isNaN(movement.amount)) return;

    const { error } = await supabase.from('account_movements').insert(movement);
    if (error) return alert('Could not save movement.');

    form.reset();
    await loadMovements();
    renderMovements();
  });
}

function setupProfile() {
  const form = document.querySelector('#profile-form');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const row = {
      user_id: session.userId,
      name: value('#profile-name'),
      phone: value('#profile-phone'),
      photo_url: value('#profile-photo'),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('profiles').upsert(row, { onConflict: 'user_id' });
    if (error) return alert('Could not save profile.');

    await loadProfile();
    renderProfile();
  });
}

async function loadBudget() {
  const { data, error } = await supabase
    .from('budget_entries')
    .select('id, description, entry_type, amount, period')
    .eq('user_id', session.userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  state.budget = data || [];
}

async function loadMovements() {
  const { data, error } = await supabase
    .from('account_movements')
    .select('id, account, label, movement_type, amount')
    .eq('user_id', session.userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  state.movements = data || [];
}

async function loadProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .select('name, phone, photo_url')
    .eq('user_id', session.userId)
    .limit(1);

  if (error) throw error;

  const profile = data?.[0];
  state.profile = {
    name: profile?.name || '',
    phone: profile?.phone || '',
    photoUrl: profile?.photo_url || ''
  };
}

function renderBudget() {
  const table = document.querySelector('#budget-table');
  table.innerHTML = '';

  let monthlyIncome = 0;
  let monthlyExpenses = 0;

  state.budget.forEach((entry) => {
    const monthlyEq = toMonthly(Number(entry.amount), entry.period);
    if (entry.entry_type === 'income') monthlyIncome += monthlyEq;
    else monthlyExpenses += monthlyEq;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHtml(entry.description)}</td>
      <td>${entry.entry_type}</td>
      <td>${formatCurrency(Number(entry.amount))}</td>
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
    button.addEventListener('click', async () => {
      const id = button.getAttribute('data-del-budget');
      const { error } = await supabase.from('budget_entries').delete().eq('id', id).eq('user_id', session.userId);
      if (error) return alert('Could not delete budget item.');
      await loadBudget();
      renderBudget();
    });
  });
}

function renderMovements() {
  const table = document.querySelector('#movement-table');
  table.innerHTML = '';

  let running = 0;
  state.movements.forEach((m) => {
    const signed = m.movement_type === 'deposit' ? Math.abs(Number(m.amount)) : -Math.abs(Number(m.amount));
    running += signed;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHtml(m.account)}</td>
      <td>${escapeHtml(m.label)}</td>
      <td>${m.movement_type}</td>
      <td>${formatCurrency(signed)}</td>
      <td>${formatCurrency(running)}</td>
      <td><button data-del-movement="${m.id}">Delete</button></td>
    `;
    table.appendChild(row);
  });

  document.querySelector('#account-total').textContent = formatCurrency(running);

  table.querySelectorAll('button[data-del-movement]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.getAttribute('data-del-movement');
      const { error } = await supabase.from('account_movements').delete().eq('id', id).eq('user_id', session.userId);
      if (error) return alert('Could not delete movement.');
      await loadMovements();
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
