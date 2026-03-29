// ============================================================
// Consumer authentication (localStorage-based, demo)
// ============================================================

export interface ConsumerAccount {
  email: string;
  name: string;
  passwordHash: string; // NOTE: simple demo hash, not production-grade
  createdAt: string;
}

const ACCOUNTS_KEY = 'consumer_accounts';
const SESSION_KEY = 'consumer_session';

// Very simple hash for demo purposes only
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

function getAccounts(): ConsumerAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveAccounts(accounts: ConsumerAccount[]): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

/** Check whether a consumer account exists for the given email. */
export function getConsumerAccount(email: string): ConsumerAccount | null {
  const normalizedEmail = email.trim().toLowerCase();
  return getAccounts().find((a) => a.email === normalizedEmail) ?? null;
}

/**
 * Advisor creates (or overwrites) a consumer account.
 * Call this from the advisor dashboard when setting up portal access for a client.
 */
export function createConsumerAccount(
  email: string,
  password: string,
  name: string
): { success: true; account: ConsumerAccount } | { success: false; error: string } {
  if (!email.trim()) return { success: false, error: 'E-mailadres is verplicht.' };
  if (!password.trim()) return { success: false, error: 'Wachtwoord is verplicht.' };
  if (password.length < 6) return { success: false, error: 'Wachtwoord moet minimaal 6 tekens zijn.' };

  const normalizedEmail = email.trim().toLowerCase();
  const accounts = getAccounts().filter((a) => a.email !== normalizedEmail);

  const account: ConsumerAccount = {
    email: normalizedEmail,
    name: name.trim() || normalizedEmail,
    passwordHash: simpleHash(password),
    createdAt: new Date().toISOString(),
  };

  saveAccounts([...accounts, account]);
  return { success: true, account };
}

export function loginConsumer(
  email: string,
  password: string
): { success: true; account: ConsumerAccount } | { success: false; error: string } {
  const accounts = getAccounts();
  const normalizedEmail = email.trim().toLowerCase();
  const account = accounts.find((a) => a.email === normalizedEmail);

  if (!account) {
    return { success: false, error: 'Geen account gevonden met dit e-mailadres.' };
  }

  if (account.passwordHash !== simpleHash(password)) {
    return { success: false, error: 'Onjuist wachtwoord.' };
  }

  setCurrentConsumer(account);
  return { success: true, account };
}

export function getCurrentConsumer(): ConsumerAccount | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentConsumer(account: ConsumerAccount | null): void {
  if (account) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(account));
  } else {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

export function logoutConsumer(): void {
  setCurrentConsumer(null);
}
