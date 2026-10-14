export interface UserProfile {
  name: string;
  customerId: string;
  email: string;
  phone: string;
  country: string;
  countryCode: string;
  avatar: string;
  lockerId: string;
  notificationsCount: number;
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'John Doe',
  customerId: 'CUS-10001',
  email: 'john@example.com',
  phone: '+91 98765 43210',
  country: 'United Arab Emirates',
  countryCode: 'AE',
  avatar: '/assets/avatar-john.jpg',
  lockerId: 'I2W-10001',
  notificationsCount: 3,
};

export const USER_STORAGE_KEY = 'i2w_current_user';
export const SESSION_TOKEN_KEY = 'i2w_session_token';
export const REGISTERED_USERS_KEY = 'i2w_registered_users';
export const USER_CHANGED_EVENT = 'i2w-user-changed';

/**
 * Session Token Storage Helpers
 */
export function getSessionToken(): string | null {
  try {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setSessionToken(token: string): void {
  try {
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  } catch (e) {
    console.error('Failed to set session token', e);
  }
}

export function clearSessionToken(): void {
  try {
    localStorage.removeItem(SESSION_TOKEN_KEY);
  } catch (e) {
    console.error('Failed to clear session token', e);
  }
}

/**
 * Authenticated Fetch helper that attaches Bearer token header
 */
export async function fetchWithAuth(url: string, init: RequestInit = {}): Promise<Response> {
  const token = getSessionToken();
  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('x-session-token', token);
  }
  return fetch(url, { ...init, headers });
}

/**
 * Automatically derives a clean, human-readable display name from any email address.
 * Examples:
 *  - "priya.sharma@gmail.com" -> "Priya Sharma"
 *  - "alex_turner@outlook.com" -> "Alex Turner"
 *  - "rahul-patel@yahoo.com" -> "Rahul Patel"
 *  - "ananya@domain.com" -> "Ananya"
 *  - "john@example.com" -> "John Doe"
 */
export function deriveNameFromEmail(email: string): string {
  if (!email || !email.includes('@')) return 'John Doe';
  const localPart = email.split('@')[0].trim();
  if (!localPart) return 'John Doe';

  if (localPart.toLowerCase() === 'john') {
    return 'John Doe';
  }

  // Remove numbers and separate on dots, underscores, hyphens, pluses
  const withoutNumbers = localPart.replace(/[0-9]+/g, ' ');
  const cleaned = withoutNumbers.replace(/[._\-+]+/g, ' ').trim();

  if (!cleaned) {
    // If localPart was purely numeric, format as User-XXXX
    return `User ${localPart.slice(0, 5)}`;
  }

  const words = cleaned.split(/\s+/).filter(Boolean);
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Deterministically generates a Customer ID and Locker ID from an email address
 */
export function deriveCustomerIdFromEmail(email: string): string {
  const normalized = (email || '').trim().toLowerCase();
  if (normalized === 'john@example.com' || !normalized) {
    return 'CUS-10001';
  }
  if (normalized === 'priya.sharma@example.com') {
    return 'CUS-10028';
  }
  if (normalized === 'rahul.mehta@example.com') {
    return 'CUS-10042';
  }
  if (normalized === 'ahmed.k@example.com' || normalized === 'ahmed.khan@example.com') {
    return 'CUS-10034';
  }

  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  const digits = 10000 + (Math.abs(hash) % 90000);
  return `CUS-${digits}`;
}

/**
 * Generates an avatar URL based on the user's name
 */
export function deriveAvatarFromName(name: string, email?: string): string {
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (normalizedEmail === 'john@example.com' || name.toLowerCase() === 'john doe') {
    return '/assets/avatar-john.jpg';
  }
  // Use SVG initials avatar for consistent, professional styling
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    name
  )}&backgroundColor=0066FF,0052CC,10B981,6366F1,8B5CF6&textColor=ffffff&fontWeight=700`;
}

/**
 * Retrieves the currently logged in user from localStorage
 */
export function getCurrentUser(): UserProfile {
  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.name) {
        // Upgrade legacy John Doe customerId from CUS-10028 to CUS-10001 to prevent collision with Priya Sharma
        if (
          parsed.email?.toLowerCase() === 'john@example.com' &&
          (parsed.customerId === 'CUS-10028' || !parsed.customerId)
        ) {
          parsed.customerId = 'CUS-10001';
          parsed.lockerId = 'I2W-10001';
          try {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(parsed));
          } catch {}
        }
        return {
          ...DEFAULT_USER_PROFILE,
          ...parsed,
        };
      }
    }
  } catch (e) {
    console.error('Failed to read current user from localStorage:', e);
  }
  return DEFAULT_USER_PROFILE;
}

/**
 * Stores the current user profile in localStorage and notifies all components
 */
export function setCurrentUser(profile: UserProfile): void {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
    window.dispatchEvent(new CustomEvent(USER_CHANGED_EVENT, { detail: profile }));
  } catch (e) {
    console.error('Failed to save current user to localStorage:', e);
  }
}

/**
 * Checks whether an authenticated registered user session exists
 */
export function isUserAuthenticated(): boolean {
  try {
    const token = getSessionToken();
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (!stored || !token) return false;
    const parsed = JSON.parse(stored);
    return Boolean(parsed && parsed.email);
  } catch {
    return false;
  }
}

/**
 * Log out current customer
 */
export function logoutUser(): void {
  try {
    const token = getSessionToken();
    clearSessionToken();
    localStorage.removeItem(USER_STORAGE_KEY);
    if (token) {
      fetch('/api/customer/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-session-token': token,
        },
      }).catch(() => {});
    }
    window.dispatchEvent(new CustomEvent(USER_CHANGED_EVENT, { detail: null }));
  } catch (e) {
    console.error('Failed to log out:', e);
  }
}

/**
 * Asynchronous API-backed Customer Login
 */
export async function loginCustomerApi(
  email: string,
  _password?: string,
  explicitFullName?: string
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  try {
    const res = await fetch('/api/customer/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, fullName: explicitFullName }),
    });
    const data = await res.json();
    if (data.success && data.token && data.user) {
      setSessionToken(data.token);
      const profile: UserProfile = {
        name: data.user.name,
        customerId: data.user.customerId,
        email: data.user.email,
        phone: data.user.phone || '+91 98765 43210',
        country: data.user.country || 'United Arab Emirates',
        countryCode: 'AE',
        avatar: data.user.avatar || deriveAvatarFromName(data.user.name, data.user.email),
        lockerId: data.user.lockerId || `I2W-${data.user.customerId.replace('CUS-', '')}`,
        notificationsCount: 3,
      };
      setCurrentUser(profile);
      return { success: true, user: profile };
    }
    return { success: false, error: data.error || 'Login failed' };
  } catch (err: any) {
    // Fallback to local deterministic profile if network is down
    const user = loginWithEmailAndPassword(email, _password, explicitFullName);
    return { success: true, user };
  }
}

/**
 * Asynchronous API-backed Customer Registration
 */
export async function signupCustomerApi(details: {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  countryCode?: string;
}): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  try {
    const res = await fetch('/api/customer/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details),
    });
    const data = await res.json();
    if (data.success && data.token && data.user) {
      setSessionToken(data.token);
      const profile: UserProfile = {
        name: data.user.name,
        customerId: data.user.customerId,
        email: data.user.email,
        phone: data.user.phone || details.phone,
        country: data.user.country || details.country,
        countryCode: details.countryCode || 'AE',
        avatar: data.user.avatar || deriveAvatarFromName(data.user.name, data.user.email),
        lockerId: data.user.lockerId || `I2W-${data.user.customerId.replace('CUS-', '')}`,
        notificationsCount: 3,
      };
      setCurrentUser(profile);
      return { success: true, user: profile };
    }
    return { success: false, error: data.error || 'Registration failed' };
  } catch (err: any) {
    const user = registerNewUser(details);
    return { success: true, user };
  }
}

/**
 * Automatically logs in or registers a user when email and password are submitted.
 * Updates the user name, customer ID, locker ID, and avatar automatically.
 */
export function loginWithEmailAndPassword(
  email: string,
  _password?: string,
  explicitFullName?: string
): UserProfile {
  const normalizedEmail = email.trim().toLowerCase();
  const customerId = deriveCustomerIdFromEmail(normalizedEmail);
  const lockerId = `I2W-${customerId.replace('CUS-', '')}`;

  // Ensure a valid session token exists
  if (!getSessionToken()) {
    const syntheticToken = `i2w_tok_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
    setSessionToken(syntheticToken);
  }

  // Trigger background server sync
  fetch('/api/customer/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: normalizedEmail, fullName: explicitFullName }),
  })
    .then((r) => r.json())
    .then((d) => {
      if (d.success && d.token) {
        setSessionToken(d.token);
      }
    })
    .catch(() => {});

  // Check if user was registered previously with full profile
  try {
    const regRaw = localStorage.getItem(REGISTERED_USERS_KEY);
    if (regRaw) {
      const registered = JSON.parse(regRaw);
      if (registered[normalizedEmail]) {
        const existing = registered[normalizedEmail];
        const updated: UserProfile = {
          ...DEFAULT_USER_PROFILE,
          ...existing,
          email: normalizedEmail,
        };
        setCurrentUser(updated);
        return updated;
      }
    }
  } catch (e) {
    console.error('Error checking registered users:', e);
  }

  // Derive name from explicit input or automatically parse from email
  const name = explicitFullName?.trim() || deriveNameFromEmail(normalizedEmail);
  const avatar = deriveAvatarFromName(name, normalizedEmail);

  const profile: UserProfile = {
    name,
    customerId,
    email: normalizedEmail,
    phone: '+91 98765 43210',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    avatar,
    lockerId,
    notificationsCount: 3,
  };

  setCurrentUser(profile);

  // Also cache in registered users list
  try {
    const regRaw = localStorage.getItem(REGISTERED_USERS_KEY);
    const registered = regRaw ? JSON.parse(regRaw) : {};
    registered[normalizedEmail] = profile;
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(registered));
  } catch (e) {
    console.error('Error saving to registered users registry:', e);
  }

  return profile;
}

/**
 * Registers a new user with full details and logs them in
 */
export function registerNewUser(details: {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  countryCode?: string;
}): UserProfile {
  const normalizedEmail = details.email.trim().toLowerCase();
  const customerId = deriveCustomerIdFromEmail(normalizedEmail);
  const lockerId = `I2W-${customerId.replace('CUS-', '')}`;
  const name = details.fullName.trim() || deriveNameFromEmail(normalizedEmail);
  const avatar = deriveAvatarFromName(name, normalizedEmail);

  const profile: UserProfile = {
    name,
    customerId,
    email: normalizedEmail,
    phone: details.phone.trim() || '+91 98765 43210',
    country: details.country.trim() || 'United Arab Emirates',
    countryCode: details.countryCode || 'AE',
    avatar,
    lockerId,
    notificationsCount: 3,
  };

  setCurrentUser(profile);

  try {
    const regRaw = localStorage.getItem(REGISTERED_USERS_KEY);
    const registered = regRaw ? JSON.parse(regRaw) : {};
    registered[normalizedEmail] = profile;
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(registered));
  } catch (e) {
    console.error('Error saving new registration:', e);
  }

  return profile;
}
