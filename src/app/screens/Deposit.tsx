import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Banknote, CircleCheckBig, QrCode, ShieldCheck, Smartphone } from 'lucide-react';
import { b } from '../../lib/sound';
import { useApp } from '../ctx';
import { Footer, Keypad, Page, PrivacyBadge, QR, Title, btnPrimary, btnPrimaryDisabled, useDigits } from '../ui';
import { DEPOSIT, rupees, type PayMethod } from '../state';

const METHOD_ICON: Record<PayMethod, typeof QrCode> = { upi: Smartphone, qr: QrCode, cash: Banknote };
const NOTES = [100, 200, 500];

const txnId = () => String(Math.floor(1e11 + Math.random() * 9e11));

/* ================================================================ 08a */

/** NEW: pay the opening deposit for the chosen account before the debit card section. */
export function Deposit() {
  const { t, user, update, go, speed } = useApp();
  const d = t.x.deposit;
  const amount = DEPOSIT[user.accountType];
  const [method, setMethod] = useState<PayMethod | null>(null);
  const [upiStage, setUpiStage] = useState<'pick' | 'type' | 'sent'>('pick');
  const [upiNumber, setUpiNumber] = useState('');
  const [cash, setCash] = useState(0);
  const upiKeys = useDigits(upiNumber, setUpiNumber, 10);
  const paid = user.deposit;
  const waiting = !paid && (method === 'qr' || (method === 'upi' && upiStage === 'sent'));

  const complete = (m: PayMethod, amt: number) => {
    b.playSuccess();
    update({ deposit: { method: m, amount: amt, txn: txnId() } });
  };

  // UPI request and QR: the bank's payment system confirms after the visitor pays on their phone.
  useEffect(() => {
    if (!waiting || !method) return;
    const id = window.setTimeout(() => complete(method, amount), (method === 'qr' ? 9000 : 7000) / speed);
    return () => window.clearTimeout(id);
  }, [waiting, method, speed]);

  // Cash: done as soon as enough notes are in.
  useEffect(() => {
    if (method !== 'cash' || paid || cash < amount) return;
    const id = window.setTimeout(() => complete('cash', cash), 700);
    return () => window.clearTimeout(id);
  }, [cash, method, paid, amount]);

  const choose = (m: PayMethod) => {
    b.playTap();
    setMethod(m);
    setUpiStage('pick');
    setUpiNumber('');
    setCash(0);
  };

  const methodBtn = (m: PayMethod) => {
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
  };

  const waitingBox = (text: string) => (
    <div className="space-y-2 text-center">
      <div className="flex items-center justify-center gap-2 text-sm font-bold text-blue-700 bg-blue-50 rounded-xl py-3">
        <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> {text}
      </div>
      <button type="button" onClick={() => method && complete(method, amount)} className="text-xs text-slate-400 hover:text-blue-600 font-medium cursor-pointer">
        {d.simulate} →
      </button>
    </div>
  );

  let panel: ReactNode;
  if (paid) {
    panel = (
      <div className="bg-emerald-50/80 border-2 border-emerald-300 rounded-3xl p-8 flex flex-col items-center text-center space-y-3 animate-scale-in">
        <CircleCheckBig className="w-16 h-16 text-emerald-600" />
        <h2 className="text-2xl font-extrabold text-emerald-800">{d.paid}</h2>
        <p className="text-sm font-medium text-slate-700">{d.paidSub(rupees(paid.amount))}</p>
        <div className="w-full max-w-sm bg-white rounded-2xl border border-emerald-200 p-4 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">{d.methods[paid.method].title}</span><span className="font-bold text-slate-900">{rupees(paid.amount)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">{d.txn}</span><span className="font-bold text-slate-900 font-mono">{paid.txn}</span></div>
        </div>
        <p className="text-xs text-slate-500">{d.receipt}</p>
      </div>
    );
  } else if (!method) {
    panel = (
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">{d.choose}</h2>
        {(['upi', 'qr', 'cash'] as PayMethod[]).map(methodBtn)}
      </div>
    );
  } else {
    const Icon = METHOD_ICON[method];
    panel = (
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Icon className="w-5 h-5 text-blue-600" /> {d.methods[method].title}</h2>
          <button type="button" onClick={() => { b.playTap(); setMethod(null); }} className="flex items-center gap-1.5 text-xs font-bold text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5" /> {d.changeMethod}
          </button>
        </div>

        {method === 'upi' && upiStage === 'pick' && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 font-medium">{d.upiHint}</p>
            <button type="button" onClick={() => { b.playTap(); setUpiStage('sent'); }} className={`${btnPrimary} w-full justify-center py-4 text-base`}>
              <Smartphone className="w-5 h-5" /> {d.upiMine(user.mobile)}
            </button>
            <button type="button" onClick={() => { b.playTap(); setUpiStage('type'); }} className="w-full py-3.5 rounded-xl border border-blue-300 text-blue-700 bg-white hover:bg-blue-50 text-sm font-bold cursor-pointer">
              {d.upiOther}
            </button>
          </div>
        )}
        {method === 'upi' && upiStage === 'type' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">{d.upiLabel}</label>
              <div className="h-14 rounded-xl border-2 border-blue-500 bg-white flex items-center px-4 text-2xl font-bold font-mono tracking-wider text-slate-900">
                {upiNumber || <span className="text-slate-300">··········</span>}
              </div>
              <button type="button" disabled={upiNumber.length !== 10} onClick={() => { b.playTap(); setUpiStage('sent'); }} className={`${upiNumber.length === 10 ? btnPrimary : btnPrimaryDisabled} w-full justify-center`}>
                {d.sendRequest}
              </button>
            </div>
            <div className="flex justify-center"><Keypad {...upiKeys} clearLabel={t.s9.clearBtn} /></div>
          </div>
        )}
        {method === 'upi' && upiStage === 'sent' && (
          <div className="space-y-4 text-center">
            <Smartphone className="w-14 h-14 text-blue-600 mx-auto animate-pulse" />
            <p className="text-lg font-bold text-slate-900">{d.approveOnPhone}</p>
            <p className="text-sm text-slate-500 font-medium">{rupees(amount)} · {upiNumber ? `XXXXXX${upiNumber.slice(-4)}` : user.mobile}</p>
            {waitingBox(d.waiting)}
          </div>
        )}

        {method === 'qr' && (
          <div className="space-y-4 text-center">
            <div className="w-56 h-56 mx-auto bg-white rounded-2xl flex items-center justify-center border-2 border-blue-400 p-2 shadow-sm">
              <QR value={`upi://pay?pa=accountopening@nextbank&pn=NEXT%20Bank&am=${amount}.00&cu=INR&tn=Opening%20deposit`} className="w-full h-full" />
            </div>
            <p className="text-sm font-semibold text-slate-700">{d.qrHint}</p>
            <p className="text-xs text-slate-500">GPay · PhonePe · Paytm · BHIM</p>
            {waitingBox(d.waiting)}
          </div>
        )}

        {method === 'cash' && (
          <div className="space-y-4">
            <div className="relative bg-slate-900 rounded-2xl p-5 text-center">
              <div className="w-full max-w-xs mx-auto h-3 rounded-full bg-slate-700 border border-slate-600 shadow-inner" />
              <p className="text-sm font-semibold text-slate-300 mt-3">{d.cashInsert}</p>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{d.cashInserted}</div>
                <div className="text-3xl font-black text-slate-900">{rupees(cash)}</div>
              </div>
              <div className={`text-sm font-bold ${cash >= amount ? 'text-emerald-700' : 'text-amber-700'}`}>
                {cash < amount ? d.cashLeft(rupees(amount - cash)) : cash > amount ? d.cashExtra(rupees(cash - amount)) : '✓'}
              </div>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (cash / amount) * 100)}%` }} />
            </div>
            <div className="flex flex-wrap gap-2 justify-center pt-1">
              {NOTES.map((n) => (
                <button key={n} type="button" disabled={cash >= amount} onClick={() => { b.playBeep(); setCash((c) => c + n); }} className="px-3 py-2 rounded-lg border border-dashed border-slate-300 text-xs font-semibold text-slate-500 hover:text-blue-700 hover:border-blue-400 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                  {d.demoNote(rupees(n))}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Page
      footer={
        <Footer onBack={() => go('08-review-agree')}>
          <button disabled={!paid} onClick={() => { b.playSuccess(); go('08b-services'); }} className={paid ? btnPrimary : btnPrimaryDisabled}>
            <span>{t.x.common.continue}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </Footer>
      }
    >
      <Title badge="3" title={d.title} sub={d.sub(rupees(amount))} right={<PrivacyBadge />} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-gradient-to-br from-blue-700 to-indigo-700 rounded-3xl p-6 text-white shadow-md">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-200">{d.amountLabel}</div>
            <div className="text-5xl font-black tracking-tight mt-1">{rupees(amount)}</div>
            <div className="text-sm font-semibold text-blue-100 mt-3 border-t border-white/20 pt-3">{t.x.home.cards[user.accountType].product}</div>
          </div>
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-emerald-800 font-medium leading-relaxed">{d.safe}</p>
          </div>
        </div>
        <div className="lg:col-span-8">{panel}</div>
      </div>
    </Page>
  );
}
