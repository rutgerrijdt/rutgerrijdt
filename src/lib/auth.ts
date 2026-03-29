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

export function registerConsumer(
  email: string,
  password: string,
  name: string
): { success: true; account: ConsumerAccount } | { success: false; error: string } {
  const accounts = getAccounts();
  const normalizedEmail = email.trim().toLowerCase();

  if (accounts.find((a) => a.email === normalizedEmail)) {
    return { success: false, error: 'Dit e-mailadres is al geregistreerd.' };
  }

  const account: ConsumerAccount = {
    email: normalizedEmail,
    name: name.trim(),
    passwordHash: simpleHash(password),
    createdAt: new Date().toISOString(),
  };

  saveAccounts([...accounts, account]);
  setCurrentConsumer(account);
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
