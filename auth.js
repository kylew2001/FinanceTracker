import { getSupabaseClient, hashPassword, saveSession } from './db.js';

const form = document.querySelector('#auth-form');
const message = document.querySelector('#auth-message');

if (localStorage.getItem('financeTracker.session')) {
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

  try {
    const supabase = getSupabaseClient();
    const sessionToken = crypto.randomUUID();

    const { data: existingUsers, error: findError } = await supabase
      .from('users')
      .select('id, username, password_hash, salt')
      .eq('username', username)
      .limit(1);

    if (findError) throw findError;

    const existing = existingUsers?.[0];

    if (!existing) {
      const salt = crypto.randomUUID();
      const passwordHash = await hashPassword(password, salt);

      const { data: createdRows, error: createError } = await supabase
        .from('users')
        .insert({ username, password_hash: passwordHash, salt, session_token: sessionToken })
        .select('id, username')
        .limit(1);

      if (createError) throw createError;

      const created = createdRows?.[0];
      saveSession({ userId: created.id, username: created.username, token: sessionToken, loginAt: Date.now() });
      window.location.href = 'app.html';
      return;
    }

    const attemptedHash = await hashPassword(password, existing.salt);
    if (attemptedHash !== existing.password_hash) {
      setMessage('Invalid username/password.', true);
      return;
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ session_token: sessionToken })
      .eq('id', existing.id);

    if (updateError) throw updateError;

    saveSession({ userId: existing.id, username: existing.username, token: sessionToken, loginAt: Date.now() });
    window.location.href = 'app.html';
  } catch (err) {
    setMessage('Unable to sign in. Check Supabase config/schema.', true);
    console.error(err);
  }
});

function setMessage(text, isError = false) {
  message.textContent = text;
  message.style.color = isError ? '#b91c1c' : '#065f46';
}
