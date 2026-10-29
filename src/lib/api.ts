/**
 * Client for the simulated bank server (see server/kioskApi.ts).
 *
 * If the API is not reachable (for example a static deployment), the same calls fall
 * back to memory in this tab, plus a BroadcastChannel so a "phone" tab opened on the
 * same computer can still talk to the kiosk tab. Nothing is ever written to
 * localStorage or sessionStorage: a shared kiosk must not keep personal data.
 */
import type { Customer } from '../app/state';
import { demoCustomer } from './demoCustomer';

export interface PhoneState {
  done?: boolean;
  doc?: string;
}

const memPhone = new Map<string, PhoneState>();
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('next-kiosk-phone') : null;
channel?.addEventListener('message', (e: MessageEvent<{ sid: string; data: PhoneState }>) => {
  const { sid, data } = e.data ?? {};
  if (sid) memPhone.set(sid, { ...(memPhone.get(sid) ?? {}), ...data });
});

async function request<T>(path: string, init?: RequestInit): Promise<{ ok: boolean; status: number; body: T | null }> {
  try {
    const res = await fetch(path, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
    const isJson = res.headers.get('content-type')?.includes('application/json');
    if (!isJson) return { ok: false, status: 0, body: null }; // static host served index.html
    return { ok: res.ok, status: res.status, body: (await res.json()) as T };
  } catch {
    return { ok: false, status: 0, body: null };
  }
}

const memDrafts = new Map<string, { data: unknown; expiresAt: number }>();
/** Demo only: lets "scan my slip" find the last slip this kiosk printed. Just a code, never personal data. */
let lastCode: string | null = null;
export const lastSlipCode = () => lastCode;

/** Save an application on the bank server; returns its resume code (VK-123456). */
export async function saveDraft(data: unknown, code?: string): Promise<{ code: string; expiresAt: number }> {
  const r = await request<{ code: string; expiresAt: number }>('/api/drafts', { method: 'POST', body: JSON.stringify({ code, data }) });
  let out = r.ok && r.body ? r.body : null;
  if (!out) {
    const c = code && memDrafts.has(code) ? code : 'VK-' + String(Math.floor(100000 + Math.random() * 900000));
    out = { code: c, expiresAt: Date.now() + 5 * 24 * 3600 * 1000 };
    memDrafts.set(c, { data, expiresAt: out.expiresAt });
  }
  lastCode = out.code;
  return out;
}

export async function loadDraft<T>(code: string): Promise<T | null> {
  const c = code.toUpperCase();
  const r = await request<{ data: T }>(`/api/drafts/${encodeURIComponent(c)}`);
  if (r.ok && r.body) return r.body.data;
  if (r.status === 404) return null;
  return (memDrafts.get(c)?.data as T) ?? null;
}

/** A saved application can be opened once; after that it lives on in the visitor's session. */
export async function deleteDraft(code: string): Promise<void> {
  memDrafts.delete(code);
  if (lastCode === code) lastCode = null;
  await request(`/api/drafts/${encodeURIComponent(code)}`, { method: 'DELETE' });
}

export async function phonePut(sid: string, data: PhoneState): Promise<void> {
  memPhone.set(sid, { ...(memPhone.get(sid) ?? {}), ...data });
  channel?.postMessage({ sid, data });
  await request(`/api/phone/${sid}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function phoneGet(sid: string): Promise<PhoneState | null> {
  const r = await request<{ data: PhoneState }>(`/api/phone/${sid}`);
  if (r.ok && r.body) return r.body.data;
  return memPhone.get(sid) ?? null;
}

export async function phoneDelete(sid: string): Promise<void> {
  memPhone.delete(sid);
  await request(`/api/phone/${sid}`, { method: 'DELETE' });
}

/** LAN addresses of the dev server, so a real phone on the same Wi-Fi can open the QR link. */
export async function lanBases(): Promise<string[]> {
  const r = await request<{ lan: string[] }>('/api/info');
  return r.ok && r.body ? r.body.lan : [];
}

/* ----------------------------------------------------- existing customers */

const seedCustomer = demoCustomer();
const memCustomers = new Map<string, Customer>([[seedCustomer.id, seedCustomer]]);
let memLastEnrolled = seedCustomer.id;

/** Send a fingerprint scan to the bank; returns the account it belongs to. */
export async function matchFingerprint(): Promise<Customer | null> {
  const r = await request<Customer>('/api/customers/match', { method: 'POST', body: '{}' });
  if (r.ok && r.body) return r.body;
  if (r.status === 404) return null;
  return memCustomers.get(memLastEnrolled) ?? null;
}

/** Register an account opened at this kiosk, so the holder's fingerprint opens it next time. */
export async function enrollCustomer(c: Customer): Promise<void> {
  memCustomers.set(c.id, c);
  memLastEnrolled = c.id;
  await request('/api/customers', { method: 'POST', body: JSON.stringify(c) });
}

/** Save a deposit, withdrawal or request on the bank's side. */
export async function saveCustomer(c: Customer): Promise<void> {
  memCustomers.set(c.id, c);
  await request(`/api/customers/${encodeURIComponent(c.id)}`, { method: 'PUT', body: JSON.stringify(c) });
}
