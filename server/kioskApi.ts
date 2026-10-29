/**
 * A tiny in-memory "bank server" that runs inside the Vite dev/preview server.
 *
 * Why it exists:
 *  - Applications saved with a QR return slip must live on the bank's side, never in
 *    the kiosk browser (localStorage would leak to the next visitor).
 *  - "Scan with my phone" needs a place where the phone and the kiosk can both see
 *    that a document arrived, so the kiosk never has to display it.
 *  - Existing customers sign in with a fingerprint; their account lives here, and an
 *    account opened at the kiosk is enrolled so the same finger opens it next visit.
 *
 * Data lives only in this Node process and disappears when the server stops.
 */
import type { Plugin, Connect } from 'vite';
import os from 'node:os';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Customer } from '../src/app/state';
import { demoCustomer } from '../src/lib/demoCustomer';

type Draft = { data: unknown; savedAt: number; expiresAt: number };
type Phone = { sid: string; createdAt: number; updatedAt: number; data: Record<string, unknown> };

const FIVE_DAYS = 5 * 24 * 60 * 60 * 1000;
const drafts = new Map<string, Draft>();
const phones = new Map<string, Phone>();
const seed = demoCustomer();
const customers = new Map<string, Customer>([[seed.id, seed]]);
/**
 * The demo reader cannot tell fingers apart, so a scan "matches" whoever enrolled last:
 * open an account, come back, and your own finger opens it.
 */
let lastEnrolled = seed.id;

function makeCode(): string {
  // Easy to read aloud and type on a keypad: VK- + 6 digits.
  let code = '';
  do code = 'VK-' + String(Math.floor(100000 + Math.random() * 900000));
  while (drafts.has(code));
  return code;
}

function lanAddresses(): string[] {
  const out: string[] = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const ni of list ?? []) {
      if (ni.family === 'IPv4' && !ni.internal) out.push(ni.address);
    }
  }
  return out;
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function handler(port: () => number | undefined): Connect.NextHandleFunction {
  return async (req, res, next) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (!url.pathname.startsWith('/api/')) return next();
    const parts = url.pathname.split('/').filter(Boolean); // ['api', 'phone', 'k3j9x2a1']
    const method = req.method ?? 'GET';

    // Forget expired drafts and old phone sessions lazily.
    const now = Date.now();
    for (const [k, d] of drafts) if (d.expiresAt < now) drafts.delete(k);
    for (const [k, p] of phones) if (now - p.updatedAt > 2 * 60 * 60 * 1000) phones.delete(k);

    if (parts[1] === 'info' && method === 'GET') {
      const p = port();
      return send(res, 200, { lan: lanAddresses().map((ip) => `http://${ip}:${p ?? 5173}`) });
    }

    if (parts[1] === 'drafts') {
      const code = parts[2]?.toUpperCase();
      if (method === 'POST' && !code) {
        const body = (await readBody(req)) as { code?: string; data?: unknown };
        const c = body.code && drafts.has(body.code) ? body.code : makeCode();
        drafts.set(c, { data: body.data ?? null, savedAt: now, expiresAt: now + FIVE_DAYS });
        return send(res, 200, { code: c, expiresAt: now + FIVE_DAYS });
      }
      if (code && method === 'GET') {
        const d = drafts.get(code);
        return d ? send(res, 200, d) : send(res, 404, { error: 'not_found' });
      }
      if (code && method === 'DELETE') {
        drafts.delete(code);
        return send(res, 200, { ok: true });
      }
    }

    if (parts[1] === 'phone' && parts[2]) {
      const sid = parts[2];
      if (method === 'GET') {
        // Nothing sent from the phone yet is a normal state while the kiosk polls.
        return send(res, 200, phones.get(sid) ?? { sid, data: {} });
      }
      if (method === 'PUT') {
        const body = (await readBody(req)) as Record<string, unknown>;
        const prev = phones.get(sid);
        const p: Phone = {
          sid,
          createdAt: prev?.createdAt ?? now,
          updatedAt: now,
          data: { ...(prev?.data ?? {}), ...body },
        };
        phones.set(sid, p);
        return send(res, 200, p);
      }
      if (method === 'DELETE') {
        phones.delete(sid);
        return send(res, 200, { ok: true });
      }
    }

    if (parts[1] === 'customers') {
      const id = parts[2];
      if (id === 'match' && method === 'POST') {
        const c = customers.get(lastEnrolled);
        return c ? send(res, 200, c) : send(res, 404, { error: 'not_found' });
      }
      if (!id && method === 'POST') {
        // Enrol a newly opened account.
        const c = (await readBody(req)) as Customer;
        if (!c?.id || !c.accountNumber) return send(res, 400, { error: 'bad_customer' });
        customers.set(c.id, c);
        lastEnrolled = c.id;
        return send(res, 200, c);
      }
      if (id && method === 'PUT') {
        if (!customers.has(id)) return send(res, 404, { error: 'not_found' });
        const c = { ...((await readBody(req)) as Customer), id };
        customers.set(id, c);
        return send(res, 200, c);
      }
    }

    return send(res, 404, { error: 'unknown_endpoint' });
  };
}

export function kioskApi(): Plugin {
  return {
    name: 'next-kiosk-api',
    configureServer(server) {
      server.middlewares.use(handler(() => server.config.server.port));
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler(() => server.config.preview.port));
    },
  };
}
