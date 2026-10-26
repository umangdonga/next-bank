/**
 * Screens, visitor data and the rules that drive the account-opening flow.
 * Screen ids are the same as in the original Vercel kiosk; new ones are marked NEW.
 */

export type Screen =
  | '00-home' // NEW: choose Savings / Current / Minor account
  | '01-before-start'
  | '02-aadhaar'
  | '03-otp'
  | '04-scan-cards'
  | '05-checking'
  | '05b-face' // NEW: live face match with the Aadhaar photo
  | '06-confirm-details'
  | '06m-child' // NEW: minor accounts only — the child's details and document
  | '07-more-details'
  | '08-review-agree'
  | '08a-deposit' // NEW: pay the opening deposit (UPI / QR / cash)
  | '08b-services'
  | '09-signature'
  | '10-bank-verifying'
  | '11-account-ready'
  | '12-print-passbook'
  | '13-all-set'
  | 'E1-docs-missing'
  | 'E2-otp-problem'
  | 'E3-scanner-error'
  | 'E5-session-cleared'
  | 'E6-help-coming'
  | 'E7-return-pass' // NEW: printed QR slip to come back with a missing document
  | 'E9-resume'; // NEW: scan the slip (or type its code) to continue

export type AccountType = 'savings' | 'current' | 'minor';
export const ACCOUNT_TYPES: AccountType[] = ['savings', 'current', 'minor'];
/** Opening deposit in rupees, shown on the home cards and charged on 08a. */
export const DEPOSIT: Record<AccountType, number> = { savings: 500, current: 1000, minor: 500 };
export const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;

/** What the visitor must bring. A minor account also needs the child's proof of age. */
export type Doc = 'aadhaar' | 'pan' | 'mobile' | 'child';
export const docsFor = (u: { accountType: AccountType }): Doc[] => (u.accountType === 'minor' ? ['aadhaar', 'pan', 'mobile', 'child'] : ['aadhaar', 'pan', 'mobile']);

export type Fix = 'phone' | 'later' | 'fingerprint' | 'staff';

/** Cards can be sent from the visitor's phone, or brought next time with a printed QR slip. */
export const FIXES: Record<Doc, Fix[]> = {
  aadhaar: ['phone', 'later'],
  pan: ['phone', 'later'],
  mobile: ['fingerprint', 'staff'],
  child: ['phone', 'later'],
};

export type DocStatus = { have: true } | { have: false; fix?: Fix };

export type PayMethod = 'upi' | 'qr' | 'cash';

export interface ChildData {
  name: string;
  /** ISO date, YYYY-MM-DD. */
  dob: string;
  gender: string;
  /** How the guardian is related to the child. */
  relation: string;
  docType: 'birth' | 'aadhaar';
  docScanned: boolean;
}

export interface UserData {
  accountType: AccountType;
  /** The visitor picked an account on the home screen (it stays selected when they come back). */
  typeChosen: boolean;
  docs: Partial<Record<Doc, DocStatus>>;
  aadhaarNumber: string;
  verifiedVia?: 'otp' | 'fingerprint';
  faceVerified: boolean;
  /** Filled only after Aadhaar eKYC + PAN check (step 05). Never pre-filled. For a minor account this is the guardian. */
  fullName: string;
  dob: string;
  gender: string;
  fatherName: string;
  address: string;
  mobile: string;
  panNumber: string;
  child: ChildData;
  nomineeName: string;
  nomineeRelation: string;
  /** ISO date, YYYY-MM-DD. */
  nomineeDob: string;
  occupation: string;
  yearlyIncome: string;
  deposit: { method: PayMethod; amount: number; txn: string } | null;
  wantDebitCard: boolean;
  debitCardType: string;
  wantNetBanking: boolean;
  wantChequeBook: boolean;
  signatureDataUrl: string | null;
  referenceNumber: string;
  accountNumber: string;
  ifsc: string;
  resumeCode?: string;
}

/** EMPTY visitor data. The original kiosk reset to pre-filled demo data, which leaked to the next visitor. */
export function emptyUser(): UserData {
  return {
    accountType: 'savings',
    typeChosen: false,
    docs: {},
    aadhaarNumber: '',
    faceVerified: false,
    fullName: '',
    dob: '',
    gender: '',
    fatherName: '',
    address: '',
    mobile: '',
    panNumber: '',
    child: { name: '', dob: '', gender: '', relation: '', docType: 'birth', docScanned: false },
    nomineeName: '',
    nomineeRelation: '',
    nomineeDob: '',
    occupation: '',
    yearlyIncome: '',
    deposit: null,
    wantDebitCard: true,
    debitCardType: 'RuPay Classic',
    wantNetBanking: true,
    wantChequeBook: false,
    signatureDataUrl: null,
    referenceNumber: '',
    accountNumber: '',
    ifsc: '',
  };
}

/** What the (simulated) UIDAI eKYC and PAN check return. Same demo person as the original kiosk. */
export const EKYC_RESULT = {
  fullName: 'Ramesh Kumar Patel',
  dob: '14 March 1962',
  gender: 'Male',
  fatherName: 'Mohan Patel',
  address: '12, Shanti Nagar Society, Navrangpura, Ahmedabad, Gujarat – 380009',
  mobile: 'XXXXXX4521',
  panNumber: 'ABCPK9481F',
};
/** Demo guardian for a minor account: a parent of a school-age child. */
export const EKYC_GUARDIAN = {
  fullName: 'Mahesh Ramesh Patel',
  dob: '9 July 1986',
  gender: 'Male',
  fatherName: 'Ramesh Patel',
  address: '12, Shanti Nagar Society, Navrangpura, Ahmedabad, Gujarat – 380009',
  mobile: 'XXXXXX7310',
  panNumber: 'BKZPP7731M',
};
export const ekycFor = (u: { accountType: AccountType }) => (u.accountType === 'minor' ? EKYC_GUARDIAN : EKYC_RESULT);

export const isMinor = (u: { accountType: AccountType }) => u.accountType === 'minor';
/** Name on the account: the child for a minor account. */
export const holderName = (u: UserData) => (isMinor(u) && u.child.name ? u.child.name : u.fullName);

export const isVerified = (u: UserData) => !!u.fullName;
export const hasPersonal = (u: UserData) => !!(u.fullName || u.aadhaarNumber || u.signatureDataUrl || u.nomineeName || u.panNumber || u.deposit || u.child.name);
/** Anything worth keeping when the visitor goes back to the home screen. */
export const hasProgress = (u: UserData) => hasPersonal(u) || Object.keys(u.docs).length > 0;

export const docResolved = (st?: DocStatus) => !!st && (st.have || !!st.fix);
export const missingDocs = (u: UserData) => docsFor(u).filter((d) => u.docs[d] && !u.docs[d]!.have);
export const fixOf = (u: UserData, d: Doc): Fix | undefined => {
  const st = u.docs[d];
  return st && !st.have ? st.fix : undefined;
};
export const fingerprintInsteadOfOtp = (u: UserData) => fixOf(u, 'mobile') === 'fingerprint' || fixOf(u, 'mobile') === 'staff';

/** Age in whole years on today's date, from YYYY-MM-DD. */
export function ageOf(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const now = new Date();
  return now.getFullYear() - y - (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d) ? 1 : 0);
}

export const maskAadhaar = (a: string) => `XXXX XXXX ${a.slice(-4) || '····'}`;
export const maskPan = (p: string) => (p.length === 10 ? `${p.slice(0, 5)}••••${p.slice(9)}` : '');

/** Seconds without a touch before the privacy shield covers the screen (null = no shield). */
export const IDLE_LIMIT: Record<Screen, number | null> = {
  '00-home': 60, // only while an application is kept in progress
  '01-before-start': 90,
  '02-aadhaar': 30,
  '03-otp': 45,
  '04-scan-cards': 60,
  '05-checking': 90,
  '05b-face': 60,
  '06-confirm-details': 30,
  '06m-child': 60,
  '07-more-details': 45,
  '08-review-agree': 30,
  '08a-deposit': 60,
  '08b-services': 45,
  '09-signature': 45,
  '10-bank-verifying': 90,
  '11-account-ready': 30,
  '12-print-passbook': 45,
  '13-all-set': null, // has its own visible auto-clear countdown
  'E1-docs-missing': 75,
  'E2-otp-problem': 60,
  'E3-scanner-error': 60,
  'E5-session-cleared': null,
  'E6-help-coming': 180,
  'E7-return-pass': null, // has its own visible auto-clear countdown
  'E9-resume': 60,
};
export const SHIELD_SECONDS = 30;
export const PREWARN_SECONDS = 10;

/** Header step (1–5) per screen, as in the original kiosk. */
export function stepOf(s: Screen): { n: number; key: 'check' | 'verify' | 'details' | 'approval' | 'passbook' } {
  if (['02-aadhaar', '03-otp', '04-scan-cards', '05-checking', '05b-face', '06-confirm-details', 'E2-otp-problem', 'E3-scanner-error'].includes(s)) return { n: 2, key: 'verify' };
  if (['06m-child', '07-more-details', '08-review-agree', '08a-deposit', '08b-services'].includes(s)) return { n: 3, key: 'details' };
  if (['09-signature', '10-bank-verifying'].includes(s)) return { n: 4, key: 'approval' };
  if (['11-account-ready', '12-print-passbook', '13-all-set', 'E5-session-cleared'].includes(s)) return { n: 5, key: 'passbook' };
  return { n: 1, key: 'check' };
}

export function makeAccountNumber() {
  const n = String(Math.floor(1e11 + Math.random() * 9e11));
  return `${n.slice(0, 4)} ${n.slice(4, 8)} ${n.slice(8)}`;
}
