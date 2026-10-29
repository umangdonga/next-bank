import type { Customer } from '../app/state';

const DAY = 24 * 60 * 60 * 1000;

/**
 * The account holder the kiosk's (simulated) fingerprint reader recognises until someone
 * opens a new account. Same demo person as the eKYC result, with a few months of history.
 * Shared by the bank server and the in-tab fallback in api.ts.
 */
export function demoCustomer(now = Date.now()): Customer {
  return {
    id: 'CUST-1001',
    name: 'Ramesh Kumar Patel',
    accountType: 'savings',
    accountNumber: '5021 4478 1290',
    ifsc: 'NEXT0000404',
    mobile: 'XXXXXX4521',
    aadhaarLast4: '7714',
    balance: 48250,
    txns: [
      { at: now - 2 * DAY, kind: 'debit', amount: 1850, note: 'UPI · Gujarat Gas bill' },
      { at: now - 4 * DAY, kind: 'debit', amount: 5000, note: 'ATM cash withdrawal' },
      { at: now - 9 * DAY, kind: 'credit', amount: 21500, note: 'Pension credit' },
      { at: now - 12 * DAY, kind: 'debit', amount: 640, note: 'UPI · Shree Medical Store' },
      { at: now - 18 * DAY, kind: 'credit', amount: 2000, note: 'UPI from Mahesh Patel' },
      { at: now - 25 * DAY, kind: 'debit', amount: 1200, note: 'Electricity bill · Torrent Power' },
      { at: now - 39 * DAY, kind: 'credit', amount: 21500, note: 'Pension credit' },
      { at: now - 41 * DAY, kind: 'credit', amount: 312, note: 'Savings interest' },
    ],
  };
}
