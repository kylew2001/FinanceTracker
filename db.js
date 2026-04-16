const config = window.FINANCE_TRACKER_SUPABASE;

export function getSupabaseClient() {
  if (!config?.url || !config?.anonKey || !window.supabase?.createClient) {
    throw new Error('Supabase is not configured. Add supabase-config.js with url and anonKey.');
  }

  return window.supabase.createClient(config.url, config.anonKey);
}

export async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function requireSession() {
  const session = JSON.parse(localStorage.getItem('financeTracker.session') || 'null');
  if (!session?.username || !session?.token || !session?.userId) {
    window.location.href = 'index.html';
    return null;
  }
  return session;
}

export function saveSession(payload) {
  localStorage.setItem('financeTracker.session', JSON.stringify(payload));
}

export function clearSession() {
  localStorage.removeItem('financeTracker.session');
}
