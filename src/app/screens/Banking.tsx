import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Banknote, BookCheck, CircleCheckBig, CreditCard, FingerprintPattern, HandCoins, LogOut, Printer, QrCode, ReceiptText, ShieldCheck, Smartphone, Wallet } from 'lucide-react';
import { b } from '../../lib/sound';
import { useApp } from '../ctx';
import { Footer, FingerprintSensor, HoldToView, Keypad, Page, PrivacyBadge, QR, Title, btnPrimary, btnPrimaryDisabled, useDigits } from '../ui';
import { rupees, txnId, type Customer, type PayMethod, type Screen, type Txn } from '../state';

/**
 * NEW: banking for existing customers, opened with a fingerprint on the home screen.
 * Same privacy rules as account opening: the shield covers the screen when idle, and
 * signing out (or the shield running out) wipes the customer from this kiosk.
 */

const WITHDRAW_LIMIT = 20000;
const CARD_LIMIT = { select: 50000, gold: 100000, senior: 75000 } as const;
type CardId = keyof typeof CARD_LIMIT;
const CARD_STYLE: Record<CardId, string> = {
  select: 'from-blue-700 to-indigo-700',
  gold: 'from-amber-500 to-yellow-700',
  senior: 'from-teal-600 to-emerald-700',
};

const masked = (acc: string) => `XXXX XXXX ${acc.slice(-4)}`;
const ref = (prefix: string) => `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;

/** The signed-in customer. Banking screens are only reachable after a fingerprint match. */
function useCustomer(): Customer {
  const { user } = useApp();
  return user.customer!;
}

function withTxn(c: Customer, kind: Txn['kind'], amount: number, note: string): Customer {
  const txn: Txn = { at: Date.now(), kind, amount, note };
  return { ...c, balance: kind === 'credit' ? c.balance + amount : c.balance - amount, txns: [txn, ...c.txns] };
}

function BackFooter({ children }: { children?: ReactNode }) {
  const { go } = useApp();
  return (
    <Footer onBack={() => go('C1-banking')} showHome={false}>
      {children}
    </Footer>
  );
}

/** Left-hand summary of the account, shown on every banking screen. */
function AccountCard() {
  const { t } = useApp();
  const c = useCustomer();
  const k = t.x.bank;
  return (
    <div className="bg-gradient-to-br from-blue-700 to-indigo-700 rounded-3xl p-6 text-white shadow-md space-y-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold">{t.x.home.cards[c.accountType].product}</span>
        <span className="flex items-center gap-1 text-[11px] font-bold bg-white/15 px-2 py-1 rounded-full">
          <FingerprintPattern className="w-3.5 h-3.5" /> {k.signedIn}
        </span>
      </div>
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-blue-200">{k.account}</div>
        <div className="text-lg font-bold font-mono tracking-wider">{masked(c.accountNumber)}</div>
      </div>
      <div className="bg-white rounded-2xl p-4 text-slate-900">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{k.balance}</div>
        <div className="text-2xl font-black tracking-tight">
          <HoldToView shown={rupees(c.balance)} masked="₹ • • • • •" label={t.x.common.hold} />
        </div>
      </div>
      <div className="text-xs text-blue-100 font-semibold">{c.name} · IFSC {c.ifsc}</div>
    </div>
  );
}

function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-4"><AccountCard /></div>
      <div className="lg:col-span-8">{children}</div>
    </div>
  );
}

/** Big amount display with quick picks and the kiosk keypad. */
function AmountEntry({ value, onChange, picks, error }: { value: string; onChange: (v: string) => void; picks: number[]; error?: string | null }) {
  const { t } = useApp();
  const keys = useDigits(value, onChange, 6);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">{t.x.bank.amount}</label>
        <div className={`h-16 rounded-xl border-2 bg-white flex items-center px-4 text-3xl font-black text-slate-900 ${error ? 'border-red-400' : 'border-blue-500'}`}>
          {value ? rupees(Number(value)) : <span className="text-slate-300">₹0</span>}
        </div>
        {error ? <p className="text-xs font-semibold text-red-600">{error}</p> : <p className="text-xs text-slate-500 font-medium">{t.x.bank.typeAmount}</p>}
        <div className="grid grid-cols-2 gap-2">
          {picks.map((p) => (
            <button key={p} type="button" onClick={() => { b.playTap(); onChange(String(p)); }} className={`py-3 rounded-xl border-2 text-base font-bold cursor-pointer transition-all ${Number(value) === p ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-800 hover:border-blue-400'}`}>
              {rupees(p)}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-center"><Keypad {...keys} clearLabel={t.s9.clearBtn} /></div>
    </div>
  );
}

/** Success panel shared by deposit and withdrawal. */
function Receipt({ title, txn, balance, extra }: { title: string; txn: { amount: number; id: string }; balance: number; extra?: ReactNode }) {
  const { t } = useApp();
  const k = t.x.bank;
  return (
    <div className="bg-emerald-50/80 border-2 border-emerald-300 rounded-3xl p-8 flex flex-col items-center text-center space-y-3 animate-scale-in">
      <CircleCheckBig className="w-16 h-16 text-emerald-600" />
      <h2 className="text-2xl font-extrabold text-emerald-800">{title}</h2>
      <div className="text-4xl font-black text-slate-900">{rupees(txn.amount)}</div>
      {extra}
      <div className="w-full max-w-sm bg-white rounded-2xl border border-emerald-200 p-4 space-y-1.5 text-sm">
        <div className="flex justify-between gap-3"><span className="text-slate-500">{t.x.deposit.txn}</span><span className="font-bold text-slate-900 font-mono">{txn.id}</span></div>
        <div className="flex justify-between gap-3 items-center"><span className="text-slate-500 shrink-0">{k.newBalance}</span><span className="font-bold text-slate-900"><HoldToView shown={rupees(balance)} masked="₹ • • • • •" label={t.x.common.hold} /></span></div>
      </div>
      <p className="text-xs text-slate-500">{k.sms}</p>
    </div>
  );
}

const doneBtn = (label: string, onClick: () => void) => (
  <button onClick={() => { b.playSuccess(); onClick(); }} className={btnPrimary}>
    <CircleCheckBig className="w-4 h-4" /> <span>{label}</span>
  </button>
);

/* ================================================================ C1 */

export function BankingHome() {
  const { t, go, signOut } = useApp();
  const c = useCustomer();
  const k = t.x.bank;
  const tiles: { key: keyof typeof k.services; icon: typeof Wallet; to: Screen; tone: string }[] = [
    { key: 'deposit', icon: Wallet, to: 'C2-deposit', tone: 'bg-emerald-50 text-emerald-600' },
    { key: 'withdraw', icon: HandCoins, to: 'C3-withdraw', tone: 'bg-amber-50 text-amber-600' },
    { key: 'credit', icon: CreditCard, to: 'C4-credit-card', tone: 'bg-violet-50 text-violet-600' },
    { key: 'statement', icon: ReceiptText, to: 'C5-statement', tone: 'bg-blue-50 text-blue-600' },
    { key: 'cheque', icon: BookCheck, to: 'C6-cheque-book', tone: 'bg-teal-50 text-teal-600' },
  ];
  return (
    <Page
      footer={
        <Footer showHome={false}>
          <button onClick={() => { b.playTap(); signOut(); }} className="flex items-center gap-2 px-6 py-3 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 text-sm font-bold cursor-pointer">
            <LogOut className="w-4 h-4" /> {k.signOut}
          </button>
        </Footer>
      }
    >
      <Title badge={<FingerprintPattern className="w-7 h-7" />} tone="green" title={k.welcome(c.name.split(' ')[0])} sub={k.sub} right={<PrivacyBadge />} />
      <Layout>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tiles.map(({ key, icon: Icon, to, tone }) => (
            <button key={key} type="button" onClick={() => { b.playTap(); go(to); }} className="group bg-white hover:bg-blue-50/40 border-2 border-slate-200 hover:border-blue-500 p-5 rounded-2xl text-left transition-all flex items-center gap-4 cursor-pointer shadow-2xs active:scale-[0.99]">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${tone}`}><Icon className="w-7 h-7" /></div>
              <div className="flex-1">
                <div className="text-lg font-bold text-slate-900 leading-tight">{k.services[key].title}</div>
                <div className="text-sm text-slate-500 font-medium mt-0.5">{k.services[key].sub}</div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
            </button>
          ))}
        </div>
      </Layout>
    </Page>
  );
}

/* ================================================================ C2 */

const METHOD_ICON: Record<PayMethod, typeof QrCode> = { upi: Smartphone, qr: QrCode, cash: Banknote };
const NOTES = [100, 200, 500];

export function BankDeposit() {
  const { t, go, updateCustomer, speed } = useApp();
  const c = useCustomer();
  const k = t.x.bank.deposit;
  const d = t.x.deposit;
  const [method, setMethod] = useState<PayMethod | null>(null);
  const [amount, setAmount] = useState('');
  const [paying, setPaying] = useState(false);
  const [cash, setCash] = useState(0);
  const [done, setDone] = useState<{ amount: number; id: string } | null>(null);
  const amt = Number(amount);

  const complete = (m: PayMethod, value: number) => {
    if (done) return;
    b.playSuccess();
    updateCustomer(withTxn(c, 'credit', value, k.notes[m]));
    setDone({ amount: value, id: txnId() });
  };

  // UPI request and QR: the payment system confirms once the customer pays on their phone.
  useEffect(() => {
    if (!paying || !method || done) return;
    const id = window.setTimeout(() => complete(method, amt), (method === 'qr' ? 9000 : 7000) / speed);
    return () => window.clearTimeout(id);
  }, [paying, method, speed]);

  const choose = (m: PayMethod | null) => {
    b.playTap();
    setMethod(m);
    setAmount('');
    setPaying(false);
    setCash(0);
  };

  let panel: ReactNode;
  if (done) {
    panel = <Receipt title={k.done} txn={done} balance={c.balance} />;
  } else if (!method) {
    panel = (
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">{d.choose}</h2>
        {(['cash', 'upi', 'qr'] as PayMethod[]).map((m) => {
          const Icon = METHOD_ICON[m];
          return (
            <button key={m} type="button" onClick={() => choose(m)} className="w-full bg-white hover:bg-blue-50/60 border-2 border-slate-200 hover:border-blue-500 p-5 rounded-2xl text-left transition-all flex items-center gap-4 cursor-pointer group shadow-2xs active:scale-[0.99]">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors"><Icon className="w-7 h-7" /></div>
              <div className="flex-1">
                <div className="text-lg font-bold text-slate-900">{d.methods[m].title}</div>
                <div className="text-sm text-slate-500 font-medium">{d.methods[m].sub}</div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
            </button>
          );
        })}
      </div>
    );
  } else {
    const Icon = METHOD_ICON[method];
    panel = (
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Icon className="w-5 h-5 text-blue-600" /> {d.methods[method].title}</h2>
          <button type="button" onClick={() => choose(null)} className="flex items-center gap-1.5 text-xs font-bold text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5" /> {d.changeMethod}
          </button>
        </div>

        {method === 'cash' && (
          <div className="space-y-4">
            <div className="bg-slate-900 rounded-2xl p-5 text-center">
              <div className="w-full max-w-xs mx-auto h-3 rounded-full bg-slate-700 border border-slate-600 shadow-inner" />
              <p className="text-sm font-semibold text-slate-300 mt-3">{d.cashInsert}</p>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{k.cashTotal}</div>
              <div className="text-4xl font-black text-slate-900">{rupees(cash)}</div>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {NOTES.map((n) => (
                <button key={n} type="button" onClick={() => { b.playBeep(); setCash((v) => v + n); }} className="px-3 py-2 rounded-lg border border-dashed border-slate-300 text-xs font-semibold text-slate-500 hover:text-blue-700 hover:border-blue-400 cursor-pointer">
                  {d.demoNote(rupees(n))}
                </button>
              ))}
            </div>
            <button type="button" disabled={cash === 0} onClick={() => complete('cash', cash)} className={`${cash ? btnPrimary : btnPrimaryDisabled} w-full justify-center py-4 text-base`}>
              <Wallet className="w-5 h-5" /> {k.depositBtn(rupees(cash))}
            </button>
          </div>
        )}

        {method !== 'cash' && !paying && (
          <>
            <AmountEntry value={amount} onChange={setAmount} picks={[500, 1000, 2000, 5000]} />
            <button type="button" disabled={!amt} onClick={() => { b.playTap(); setPaying(true); }} className={`${amt ? btnPrimary : btnPrimaryDisabled} w-full justify-center`}>
              {method === 'upi' ? d.sendRequest : t.x.common.continue} <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}
        {method !== 'cash' && paying && (
          <div className="space-y-4 text-center">
            {method === 'upi' ? (
              <>
                <Smartphone className="w-14 h-14 text-blue-600 mx-auto animate-pulse" />
                <p className="text-lg font-bold text-slate-900">{d.approveOnPhone}</p>
                <p className="text-sm text-slate-500 font-medium">{rupees(amt)} · {c.mobile}</p>
              </>
            ) : (
              <>
                <div className="w-56 h-56 mx-auto bg-white rounded-2xl flex items-center justify-center border-2 border-blue-400 p-2 shadow-sm">
                  <QR value={`upi://pay?pa=deposit@nextbank&pn=NEXT%20Bank&am=${amt}.00&cu=INR&tn=Deposit%20${c.accountNumber.slice(-4)}`} className="w-full h-full" />
                </div>
                <p className="text-sm font-semibold text-slate-700">{d.qrHint} · {rupees(amt)}</p>
              </>
            )}
            <div className="flex items-center justify-center gap-2 text-sm font-bold text-blue-700 bg-blue-50 rounded-xl py-3">
              <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> {d.waiting}
            </div>
            <button type="button" onClick={() => complete(method, amt)} className="text-xs text-slate-400 hover:text-blue-600 font-medium cursor-pointer">
              {d.simulate} →
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <Page footer={<BackFooter>{done && doneBtn(t.x.common.continue, () => go('C1-banking'))}</BackFooter>}>
      <Title badge={<Wallet className="w-7 h-7" />} title={k.title} sub={k.sub} right={<PrivacyBadge />} />
      <Layout>{panel}</Layout>
    </Page>
  );
}

/* ================================================================ C3 */

export function Withdraw() {
  const { t, go, updateCustomer, speed } = useApp();
  const c = useCustomer();
  const k = t.x.bank.withdraw;
  const [amount, setAmount] = useState('');
  const [stage, setStage] = useState<'amount' | 'confirm' | 'counting' | 'done'>('amount');
  const [done, setDone] = useState<{ amount: number; id: string } | null>(null);
  const amt = Number(amount);
  const error = !amt ? null : amt > c.balance ? k.notEnough : amt > WITHDRAW_LIMIT ? k.overLimit(rupees(WITHDRAW_LIMIT)) : amt % 100 ? k.hundreds : null;

  useEffect(() => {
    if (stage !== 'counting') return;
    const id = window.setTimeout(() => {
      b.playSuccess();
      updateCustomer(withTxn(c, 'debit', amt, k.note));
      setDone({ amount: amt, id: txnId() });
      setStage('done');
    }, 2500 / speed);
    return () => window.clearTimeout(id);
  }, [stage, speed]);

  let panel: ReactNode;
  if (stage === 'done' && done) {
    panel = (
      <Receipt
        title={k.done}
        txn={done}
        balance={c.balance}
        extra={
          <div className="flex items-center gap-2 text-sm font-bold text-amber-900 bg-amber-50 border border-amber-300 rounded-xl px-4 py-2.5">
            <Banknote className="w-5 h-5 text-amber-600 animate-bounce" /> {k.take}
          </div>
        }
      />
    );
  } else if (stage === 'counting') {
    panel = (
      <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-2xs flex flex-col items-center text-center space-y-5">
        <div className="w-20 h-20 rounded-full border-4 border-amber-100 border-t-amber-500 animate-spin" />
        <h2 className="text-xl font-extrabold text-slate-900">{k.counting}</h2>
        <div className="text-3xl font-black text-slate-900">{rupees(amt)}</div>
      </div>
    );
  } else if (stage === 'confirm') {
    panel = (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-2xs flex flex-col items-center text-center space-y-5">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{t.x.bank.amount}</div>
          <div className="text-4xl font-black text-slate-900">{rupees(amt)}</div>
        </div>
        <FingerprintSensor onMatched={() => setStage('counting')} idleText={k.confirm} scanningText={k.reading} matchedText={k.matched} />
        <button type="button" onClick={() => { b.playTap(); setStage('amount'); }} className="text-sm font-bold text-blue-700 cursor-pointer">
          ← {t.back}
        </button>
      </div>
    );
  } else {
    panel = (
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-5">
        <p className="text-sm font-semibold text-slate-600">{k.limit(rupees(WITHDRAW_LIMIT))}</p>
        <AmountEntry value={amount} onChange={setAmount} picks={[500, 1000, 2000, 5000]} error={error} />
        <button type="button" disabled={!amt || !!error} onClick={() => { b.playTap(); setStage('confirm'); }} className={`${amt && !error ? btnPrimary : btnPrimaryDisabled} w-full justify-center`}>
          <FingerprintPattern className="w-4 h-4" /> {t.x.common.continue}
        </button>
      </div>
    );
  }

  return (
    <Page footer={<BackFooter>{stage === 'done' && doneBtn(t.x.common.continue, () => go('C1-banking'))}</BackFooter>}>
      <Title badge={<HandCoins className="w-7 h-7" />} title={k.title} sub={k.sub} right={<PrivacyBadge />} />
      <Layout>{panel}</Layout>
    </Page>
  );
}

/* ================================================================ C4 */

export function CreditCardApply() {
  const { t, go, updateCustomer, speed } = useApp();
  const c = useCustomer();
  const k = t.x.bank.credit;
  const o = t.s7;
  const [card, setCard] = useState<CardId | null>(null);
  const [occupation, setOccupation] = useState('');
  const [income, setIncome] = useState('');
  const [agree, setAgree] = useState(false);
  const [checking, setChecking] = useState(false);
  const ready = !!card && !!occupation && !!income && agree;

  useEffect(() => {
    if (!checking || !card) return;
    const id = window.setTimeout(() => {
      b.playSuccess();
      updateCustomer({ ...c, creditCard: { card: k.cards[card].name, limit: CARD_LIMIT[card], ref: ref('CC') } });
      setChecking(false);
    }, 3000 / speed);
    return () => window.clearTimeout(id);
  }, [checking, speed]);

  const chip = (on: boolean) => `px-4 py-2.5 rounded-xl border-2 text-sm font-bold cursor-pointer transition-all ${on ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-400'}`;

  let panel: ReactNode;
  if (c.creditCard) {
    panel = (
      <div className="bg-emerald-50/80 border-2 border-emerald-300 rounded-3xl p-8 flex flex-col items-center text-center space-y-4 animate-scale-in">
        <CircleCheckBig className="w-16 h-16 text-emerald-600" />
        <h2 className="text-2xl font-extrabold text-emerald-800">{k.approved}</h2>
        <p className="text-sm font-medium text-slate-700 max-w-md">{k.approvedSub(c.creditCard.card, rupees(c.creditCard.limit))}</p>
        <div className="w-full max-w-sm bg-white rounded-2xl border border-emerald-200 p-4 flex justify-between text-sm">
          <span className="text-slate-500">{k.ref}</span>
          <span className="font-bold text-slate-900 font-mono">{c.creditCard.ref}</span>
        </div>
        <p className="text-xs text-slate-500">{t.x.bank.sms}</p>
      </div>
    );
  } else if (checking) {
    panel = (
      <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-2xs flex flex-col items-center text-center space-y-5">
        <div className="w-20 h-20 rounded-full border-4 border-violet-100 border-t-violet-600 animate-spin" />
        <h2 className="text-xl font-extrabold text-slate-900">{k.checking}</h2>
      </div>
    );
  } else {
    panel = (
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(Object.keys(CARD_LIMIT) as CardId[]).map((id) => {
            const info = k.cards[id];
            const on = card === id;
            return (
              <button key={id} type="button" aria-pressed={on} onClick={() => { b.playTap(); setCard(id); }} className={`bg-white rounded-2xl p-4 border-2 text-left space-y-3 cursor-pointer transition-all ${on ? 'border-blue-600 ring-4 ring-blue-100' : 'border-slate-200 hover:border-blue-400'}`}>
                <div className={`h-20 rounded-xl bg-gradient-to-br ${CARD_STYLE[id]} p-3 flex flex-col justify-between text-white shadow-sm`}>
                  <span className="text-xs font-extrabold tracking-wide">{info.name}</span>
                  <span className="text-[11px] font-mono opacity-80">•••• {c.accountNumber.slice(-4)}</span>
                </div>
                <div className="text-xs font-bold text-slate-500">{k.limit} <span className="text-slate-900">{rupees(CARD_LIMIT[id])}</span></div>
                <div className="text-xs font-semibold text-blue-700">{info.fee}</div>
                <ul className="space-y-1">
                  {info.perks.map((p) => <li key={p} className="text-xs text-slate-600 font-medium">• {p}</li>)}
                </ul>
              </button>
            );
          })}
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-bold text-slate-900">{o.occupationTitle}</div>
            <div className="flex flex-wrap gap-2">
              {Object.values(o.occupations).map((x) => (
                <button key={x} type="button" onClick={() => { b.playTap(); setOccupation(x); }} className={chip(occupation === x)}>{x}</button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-bold text-slate-900">{o.incomeTitle}</div>
            <div className="flex flex-wrap gap-2">
              {o.incomes.map((x) => (
                <button key={x} type="button" onClick={() => { b.playTap(); setIncome(x); }} className={chip(income === x)}>{x}</button>
              ))}
            </div>
          </div>
          <label className="flex items-start gap-3 cursor-pointer pt-1">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="w-5 h-5 mt-0.5 accent-blue-600" />
            <span className="text-sm font-semibold text-slate-700">{k.consent}</span>
          </label>
        </div>
      </div>
    );
  }

  return (
    <Page
      footer={
        <BackFooter>
          {c.creditCard ? (
            doneBtn(t.x.common.continue, () => go('C1-banking'))
          ) : (
            <button disabled={!ready || checking} onClick={() => { b.playTap(); setChecking(true); }} className={ready && !checking ? btnPrimary : btnPrimaryDisabled}>
              <CreditCard className="w-4 h-4" /> <span>{k.apply}</span>
            </button>
          )}
        </BackFooter>
      }
    >
      <Title badge={<CreditCard className="w-7 h-7" />} title={k.title} sub={k.sub} right={<PrivacyBadge />} />
      <Layout>{panel}</Layout>
    </Page>
  );
}

/* ================================================================ C5 */

export function MiniStatement() {
  const { t } = useApp();
  const c = useCustomer();
  const k = t.x.bank.statement;
  const [printed, setPrinted] = useState(false);
  const months = t.x.date.months;
  const fmt = (at: number) => {
    const d = new Date(at);
    return `${d.getDate()} ${months[d.getMonth()]}`;
  };
  const rows = c.txns.slice(0, 10);
  return (
    <Page
      footer={
        <BackFooter>
          <button onClick={() => { b.playSuccess(); setPrinted(true); }} className={btnPrimary}>
            <Printer className="w-4 h-4" /> <span>{k.print}</span>
          </button>
        </BackFooter>
      }
    >
      <Title badge={<ReceiptText className="w-7 h-7" />} title={k.title} sub={k.sub} right={<PrivacyBadge />} />
      <Layout>
        <div className="space-y-4">
          {printed && (
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-xl px-4 py-3 animate-fade-in">
              <Printer className="w-5 h-5 text-emerald-600" /> {k.printed}
            </div>
          )}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
              <span className="col-span-3">{k.date}</span>
              <span className="col-span-6">{k.details}</span>
              <span className="col-span-3 text-right">{k.amount}</span>
            </div>
            {rows.length === 0 && <div className="px-5 py-8 text-center text-sm text-slate-500">{k.empty}</div>}
            {rows.map((x, n) => (
              <div key={`${x.at}-${n}`} className="grid grid-cols-12 gap-3 px-5 py-3.5 border-b border-slate-100 last:border-0 text-sm items-center">
                <span className="col-span-3 font-semibold text-slate-600">{fmt(x.at)}</span>
                <span className="col-span-6 font-medium text-slate-800">{x.note}</span>
                <span className={`col-span-3 text-right font-bold ${x.kind === 'credit' ? 'text-emerald-700' : 'text-slate-900'}`}>
                  {x.kind === 'credit' ? '+' : '−'} {rupees(x.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    </Page>
  );
}

/* ================================================================ C6 */

export function ChequeBook() {
  const { t, go, updateCustomer } = useApp();
  const c = useCustomer();
  const k = t.x.bank.cheque;
  const [leaves, setLeaves] = useState<25 | 50>(25);

  const request = () => {
    b.playSuccess();
    updateCustomer({ ...c, chequeBook: { leaves, ref: ref('CB') } });
  };

  return (
    <Page
      footer={
        <BackFooter>
          {c.chequeBook ? (
            doneBtn(t.x.common.continue, () => go('C1-banking'))
          ) : (
            <button onClick={request} className={btnPrimary}>
              <BookCheck className="w-4 h-4" /> <span>{k.request}</span>
            </button>
          )}
        </BackFooter>
      }
    >
      <Title badge={<BookCheck className="w-7 h-7" />} title={k.title} sub={k.sub} right={<PrivacyBadge />} />
      <Layout>
        {c.chequeBook ? (
          <div className="bg-emerald-50/80 border-2 border-emerald-300 rounded-3xl p-8 flex flex-col items-center text-center space-y-4 animate-scale-in">
            <CircleCheckBig className="w-16 h-16 text-emerald-600" />
            <h2 className="text-2xl font-extrabold text-emerald-800">{k.done}</h2>
            <p className="text-sm font-medium text-slate-700">{k.leaves(c.chequeBook.leaves)} · {k.doneSub}</p>
            <div className="w-full max-w-sm bg-white rounded-2xl border border-emerald-200 p-4 flex justify-between text-sm">
              <span className="text-slate-500">{k.ref}</span>
              <span className="font-bold text-slate-900 font-mono">{c.chequeBook.ref}</span>
            </div>
            <p className="text-xs text-slate-500">{t.x.bank.sms}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {([25, 50] as const).map((n) => (
                <button key={n} type="button" aria-pressed={leaves === n} onClick={() => { b.playTap(); setLeaves(n); }} className={`bg-white rounded-2xl p-6 border-2 flex flex-col items-center gap-2 cursor-pointer transition-all ${leaves === n ? 'border-blue-600 ring-4 ring-blue-100' : 'border-slate-200 hover:border-blue-400'}`}>
                  <BookCheck className={`w-10 h-10 ${leaves === n ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="text-xl font-extrabold text-slate-900">{k.leaves(n)}</span>
                </button>
              ))}
            </div>
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-800 font-medium">{k.sub}</p>
            </div>
          </div>
        )}
      </Layout>
    </Page>
  );
}
