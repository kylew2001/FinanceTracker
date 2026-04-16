const STORAGE_KEY = 'financeTracker.users';
const SESSION_KEY = 'financeTracker.session';

const form = document.querySelector('#auth-form');
const message = document.querySelector('#auth-message');

if (localStorage.getItem(SESSION_KEY)) {
  window.location.href = 'app.html';
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const username = document.querySelector('#username')?.value.trim();
  const password = document.querySelector('#password')?.value;

  if (!username || !password) {
    setMessage('Enter username and password.', true);
    return;
  }

  const users = loadUsers();
  const existing = users.find((u) => u.username === username);

  if (!existing) {
    const salt = crypto.randomUUID();
    const hash = await hashPassword(password, salt);
    users.push({
      username,
      passwordHash: hash,
      salt,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    createSession(username);
    window.location.href = 'app.html';
    return;
  }

  const attemptedHash = await hashPassword(password, existing.salt);
  if (attemptedHash !== existing.passwordHash) {
    setMessage('Invalid username/password.', true);
    return;
  }

  createSession(username);
  window.location.href = 'app.html';
});

function loadUsers() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function setMessage(text, isError = false) {
  message.textContent = text;
  message.style.color = isError ? '#b91c1c' : '#065f46';
}

function createSession(username) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username, loginAt: Date.now() }));
}

async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
