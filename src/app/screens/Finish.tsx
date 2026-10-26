import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { ArrowDown, BookOpen, Check, CircleAlert, CircleQuestionMark, Clock, CreditCard, Globe, House, Lock, PenTool, Printer, RotateCcw, ShieldCheck, Smartphone, Sparkles, Users, X } from 'lucide-react';
import { b } from '../../lib/sound';
import { useApp } from '../ctx';
import { Footer, HoldToView, Page, PrivacyBadge, SignaturePad, Title, btnPrimary, btnPrimaryDisabled, btnSoft, useCountdown } from '../ui';
import { holderName, isMinor, makeAccountNumber, rupees } from '../state';

const plainFooter = 'w-full bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between';

/* ================================================================ 09 */

export function Signature() {
  const { t, user, update, go } = useApp();
  const s = t.s9;
  const ok = !!user.signatureDataUrl;
  return (
    <Page
      footer={
        <Footer onBack={() => go('08b-services')}>
          <button disabled={!ok} onClick={() => { b.playSuccess(); go('10-bank-verifying'); }} className={ok ? btnPrimary : btnPrimaryDisabled}>
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{s.saveAndContinue}</span>
          </button>
        </Footer>
      }
    >
      <Title badge="4" title={isMinor(user) ? t.x.minor.signTitle : s.title} sub={isMinor(user) ? t.x.minor.signSub : s.sub} right={<PrivacyBadge />} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5 text-emerald-800 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{t.x.face.verifiedTitle}</span>
            </div>
            <p className="text-xs text-emerald-700 leading-relaxed font-medium">{t.x.face.verifiedSub}</p>
            <div className="pt-2 flex items-center gap-3 bg-white/80 p-3 rounded-xl border border-emerald-100">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">✓</div>
              <div>
                <div className="text-xs font-bold text-slate-900">{user.fullName}</div>
                <div className="text-[11px] text-slate-500 font-mono">Aadhaar verified · UIDAI</div>
              </div>
            </div>
          </div>
          <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 text-xs text-slate-600 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>{s.photoMatchReassurance}</span>
          </div>
        </div>
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><PenTool className="w-4 h-4 text-blue-600" /> <span>{s.yourSignature}</span></h2>
              <p className="text-xs text-slate-500 mt-0.5">{s.chequeHint}</p>
            </div>
          </div>
          <SignaturePad initialSignature={user.signatureDataUrl} onSave={(d) => update({ signatureDataUrl: d })} clearLabel={s.clearBtn} sampleLabel={s.trySample} hintText={s.signHint} />
        </div>
      </div>
    </Page>
  );
}

/* ================================================================ 10 */

export function BankVerifying() {
  const { t, user, update, go, help, speed } = useApp();
  const a = t.s10;
  const [ref] = useState(() => user.referenceNumber || `VK-${Math.floor(100000 + Math.random() * 900000)}`);
  const done = () => {
    b.playSuccess();
    update({ referenceNumber: ref, accountNumber: user.accountNumber || makeAccountNumber(), ifsc: 'NEXT0000404' });
    go('11-account-ready');
  };
  useEffect(() => {
    const id = window.setTimeout(done, 4500 / speed);
    return () => window.clearTimeout(id);
  }, []);
  const li = (state: 'done' | 'spin' | 'wait', label: string) => (
    <li className="flex items-center gap-3">
      {state === 'done' ? (
        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><Check className="w-4 h-4 stroke-[3]" /></div>
      ) : state === 'spin' ? (
        <div className="w-6 h-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin shrink-0" />
      ) : (
        <div className="w-6 h-6 rounded-full border-2 border-slate-300 text-slate-400 flex items-center justify-center shrink-0"><Clock className="w-3.5 h-3.5" /></div>
      )}
      <span className={`text-sm sm:text-base ${state === 'done' ? 'font-semibold text-slate-800' : state === 'spin' ? 'font-semibold text-blue-700' : 'font-medium text-slate-400'}`}>{label}</span>
    </li>
  );
  return (
    <div className="flex-1 flex flex-col justify-between bg-slate-50 overflow-y-auto">
      <div className="max-w-6xl w-full mx-auto p-6 md:p-8 space-y-6">
        <Title badge="4" title={a.title} sub={a.sub} />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-2xs space-y-6">
            <h2 className="text-base font-bold text-slate-900">{a.whatIsHappening}</h2>
            <ul className="space-y-4">
              {li('done', a.step1)}
              {li('done', a.step2)}
              {li('spin', a.step3)}
              {li('wait', a.step4)}
            </ul>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-6"><div className="bg-blue-600 h-full w-3/4 rounded-full animate-pulse" /></div>
            <button type="button" onClick={done} className="text-xs text-slate-400 hover:text-blue-600 font-medium cursor-pointer">Simulate approval complete →</button>
          </div>
          <div className="lg:col-span-5 bg-blue-50/60 border border-blue-200 rounded-2xl p-6 md:p-8 space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{a.refTitle}</span>
              <div className="text-3xl sm:text-4xl font-extrabold text-blue-700 font-mono tracking-tight mt-1">{ref}</div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 pt-2 border-t border-blue-200/60">
              <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{a.smsSent}</span>
            </div>
          </div>
        </div>
      </div>
      <footer className={plainFooter}>
        <button onClick={() => { b.playTap(); help(); }} className={btnSoft}>{t.needHelp}</button>
      </footer>
    </div>
  );
}

/* ================================================================ 11 */

export function AccountReady() {
  const { t, user, go, help } = useApp();
  const i = t.s11;
  useEffect(() => {
    b.playSuccess();
    try {
      void confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch {
      /* no canvas */
    }
  }, []);
  return (
    <div className="flex-1 flex flex-col justify-between bg-slate-50 overflow-y-auto">
      <div className="max-w-6xl w-full mx-auto p-6 md:p-8 space-y-6">
        <Title badge={<Check className="w-7 h-7 stroke-[3]" />} tone="green" title={i.title} sub={`${i.welcome.split(',')[0]}, ${holderName(user).split(' ')[0]}.`} right={<PrivacyBadge />} />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-2xs space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{i.accountNumLabel}</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-blue-700 font-mono tracking-wider mt-0.5">
                  <HoldToView shown={user.accountNumber} masked={`XXXX XXXX ${user.accountNumber.slice(-4)}`} label={t.x.common.hold} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-sm">
                <div><span className="text-slate-400 text-xs font-semibold block">{isMinor(user) ? t.x.minor.holder : i.holderLabel}</span><span className="font-bold text-slate-800">{holderName(user)}</span></div>
                {isMinor(user) && <div><span className="text-slate-400 text-xs font-semibold block">{t.x.minor.guardian}</span><span className="font-bold text-slate-800">{user.fullName}</span></div>}
                <div><span className="text-slate-400 text-xs font-semibold block">{i.typeLabel}</span><span className="font-bold text-slate-800">{t.x.home.cards[user.accountType].name}</span></div>
                <div><span className="text-slate-400 text-xs font-semibold block">{t.x.account.opening}</span><span className="font-bold text-emerald-700">{user.deposit ? rupees(user.deposit.amount) : '—'}</span></div>
                <div><span className="text-slate-400 text-xs font-semibold block">{i.ifscLabel}</span><span className="font-bold text-slate-800 font-mono">{user.ifsc}</span></div>
                <div><span className="text-slate-400 text-xs font-semibold block">{i.branchLabel}</span><span className="font-bold text-slate-800">{i.branchVal}</span></div>
              </div>
            </div>
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-900 mt-4">
              <CircleAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{i.paymentsNotice}</span>
            </div>
          </div>
          <div className="lg:col-span-5 bg-blue-50/60 border border-blue-200 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-2xs">
            <div className="w-20 h-20 rounded-full bg-white border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm"><Printer className="w-10 h-10" /></div>
            <h2 className="text-xl font-bold text-slate-900">{i.collectPassbookTitle}</h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xs leading-relaxed font-medium">{i.collectPassbookSub}</p>
          </div>
        </div>
      </div>
      <footer className={plainFooter}>
        <button onClick={() => { b.playTap(); help(); }} className={btnSoft}>{t.needHelp}</button>
        <button onClick={() => { b.playTap(); go('12-print-passbook'); }} className={btnPrimary}>
          <Printer className="w-4 h-4" />
          <span>{i.printPassbookBtn}</span>
        </button>
      </footer>
    </div>
  );
}

/* ================================================================ 12 */

export function PrintPassbook() {
  const { t, user, go, help, speed } = useApp();
  const i = t.s12;
  const [page, setPage] = useState(1);
  const [done, setDone] = useState(false);
  const run = () => {
    b.playPrintWhir();
    setDone(false);
    setPage(1);
    const a = window.setTimeout(() => { setPage(2); b.playPrintWhir(); }, 2200 / speed);
    const c = window.setTimeout(() => { setDone(true); b.playSuccess(); }, 4200 / speed);
    return () => { window.clearTimeout(a); window.clearTimeout(c); };
  };
  useEffect(run, []);
  return (
    <div className="flex-1 flex flex-col justify-between bg-slate-50 overflow-y-auto">
      <div className="max-w-6xl w-full mx-auto p-6 md:p-8 space-y-6">
        <Title badge="5" title={i.title} sub={i.sub} right={<PrivacyBadge />} />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-2xs flex flex-col items-center justify-center space-y-5">
            <div className="w-64 sm:w-72 bg-gradient-to-br from-blue-700 to-blue-900 text-white rounded-xl p-5 shadow-lg border border-blue-600">
              <div className="border border-blue-400/40 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between border-b border-blue-400/30 pb-2">
                  <span className="font-extrabold text-xs tracking-wider uppercase text-blue-100">NEXT Bank</span>
                  <BookOpen className="w-4 h-4 text-blue-200" />
                </div>
                <div className="text-sm font-bold text-white pt-1">{holderName(user)}</div>
                {isMinor(user) && <div className="text-[11px] text-blue-200">{t.x.minor.guardian}: {user.fullName}</div>}
                <div className="text-xs text-blue-200 font-mono">A/c XXXX XXXX {user.accountNumber.slice(-4)}</div>
              </div>
            </div>
            <ArrowDown className="w-6 h-6 text-blue-500 animate-bounce mt-1" />
            <div className="w-full max-w-md bg-slate-900 h-8 rounded-full shadow-inner border-2 border-slate-700 flex items-center justify-center relative overflow-hidden">
              <div className="w-48 h-1 bg-cyan-400/60 rounded-full animate-pulse shadow-[0_0_10px_#38bdf8]" />
            </div>
            <div className="text-center w-full max-w-md pt-2">
              <div className="text-sm font-bold text-slate-800 mb-2">
                {done ? <span className="text-emerald-600 flex items-center justify-center gap-1.5"><Check className="w-4 h-4 stroke-[3]" />{i.printingDone}</span> : <span>{i.printingPage} {page} of 2</span>}
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full transition-all duration-700" style={{ width: done ? '100%' : page === 2 ? '75%' : '35%' }} />
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-2xs space-y-5">
            <h2 className="text-base font-bold text-slate-900">{i.beforeYouLeave}</h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5"><Check className="w-4 h-4 stroke-[3]" /></div><span className="text-sm font-medium text-slate-700 leading-snug">{i.tip1}</span></li>
              <li className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5"><ShieldCheck className="w-4 h-4" /></div><span className="text-sm font-medium text-slate-700 leading-snug">{i.tip2}</span></li>
              <li className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5"><CircleQuestionMark className="w-4 h-4" /></div><span className="text-sm font-medium text-slate-700 leading-snug">{i.tip3}</span></li>
            </ul>
          </div>
        </div>
      </div>
      <footer className={plainFooter}>
        <button onClick={() => { b.playTap(); help(); }} className={btnSoft}>{t.needHelp}</button>
        <div className="flex items-center gap-3">
          <button onClick={() => run()} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-700 bg-white hover:bg-slate-50 text-sm font-semibold transition-all cursor-pointer shadow-2xs">
            <RotateCcw className="w-4 h-4 text-slate-500" /> <span>{i.printAgain}</span>
          </button>
          <button onClick={() => { b.playSuccess(); go('13-all-set'); }} className={btnPrimary}>
            <Check className="w-4 h-4 stroke-[3]" /> <span>{i.haveMyPassbook}</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

/* ================================================================ 13 */

export function AllSet() {
  const { t, user, help, clearAll, speed } = useApp();
  const i = t.s13;
  // Was: no timer at all, so details stayed on screen after the visitor left.
  const left = useCountdown(30, () => clearAll(), speed);
  return (
    <div className="flex-1 flex flex-col justify-between bg-slate-50 overflow-y-auto">
      <div className="max-w-6xl w-full mx-auto p-6 md:p-8 space-y-6">
        <Title badge={<Check className="w-7 h-7 stroke-[3]" />} tone="green" title={i.title} sub={i.sub} />
        <div className="max-w-2xl mx-auto w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-sm space-y-7">
          <ul className="space-y-4">
            {[i.done1.replace('7781', user.accountNumber.slice(-4)), i.done2, i.done3].map((d) => (
              <li key={d} className="flex items-center gap-3.5">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><Check className="w-4 h-4 stroke-[3]" /></div>
                <span className="text-base sm:text-lg font-bold text-slate-800">{d}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{i.nextAsk}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600"><CreditCard className="w-5 h-5" /></div>
                <div>
                  <div className="text-sm font-bold text-slate-900">{user.wantDebitCard ? `${user.debitCardType} Ordered` : i.debitCard}</div>
                  <div className="text-xs text-slate-500">{user.wantDebitCard ? 'Dispatched to home address' : 'Ask counter or apply in the NEXT app'}</div>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600"><Globe className="w-5 h-5" /></div>
                <div>
                  <div className="text-sm font-bold text-slate-900">{i.netBanking}</div>
                  <div className="text-xs text-slate-500">{user.wantNetBanking ? 'App setup SMS sent to your phone' : 'Available anytime online'}</div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400 text-center font-medium flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> {i.removeNotice} · {t.x.common.autoClear(left)}
          </p>
        </div>
      </div>
      <footer className={plainFooter}>
        <button onClick={() => { b.playTap(); help(); }} className={btnSoft}>{t.needHelp}</button>
        <button onClick={() => { b.playTap(); clearAll(); }} className={btnPrimary}>
          <ShieldCheck className="w-4 h-4 stroke-[3]" /> <span>{i.finishBtn} ({left})</span>
        </button>
      </footer>
    </div>
  );
}

/* ================================================================ E5 */

export function SessionCleared() {
  const { t, go, help, speed } = useApp();
  const r = t.e5;
  const left = useCountdown(10, () => go('00-home'), speed);
  return (
    <div className="flex-1 flex flex-col justify-between bg-slate-50 overflow-y-auto">
      <div className="max-w-6xl w-full mx-auto p-6 md:p-8 space-y-6">
        <Title badge={<Check className="w-7 h-7 stroke-[3]" />} tone="green" title={r.title} sub={r.sub} />
        <div className="max-w-2xl mx-auto w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-sm space-y-6 my-4">
          <ul className="space-y-5">
            <li className="flex items-start gap-3.5">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5"><Check className="w-4 h-4 stroke-[3]" /></div>
              <span className="text-sm sm:text-base font-bold text-slate-800">{r.item1}</span>
            </li>
            <li className="flex items-start gap-3.5">
              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5"><Clock className="w-4 h-4" /></div>
              <span className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">{t.x.cleared.notFinished}</span>
            </li>
            <li className="flex items-start gap-3.5">
              <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 mt-0.5"><House className="w-4 h-4" /></div>
              <span className="text-xs sm:text-sm font-semibold text-slate-500">This kiosk goes back to the Home screen in {left} seconds.</span>
            </li>
          </ul>
        </div>
      </div>
      <footer className={plainFooter}>
        <button onClick={() => { b.playTap(); help(); }} className={btnSoft}>{t.needHelp}</button>
        <button onClick={() => { b.playTap(); go('00-home'); }} className={btnPrimary}>
          <House className="w-4 h-4" /> <span>{r.btn}</span>
        </button>
      </footer>
    </div>
  );
}

/* ================================================================ E6 */

export function HelpComing({ onBack }: { onBack: () => void }) {
  const { t } = useApp();
  const r = t.e6;
  const [token] = useState(() => `H-${10 + Math.floor(Math.random() * 80)}`);
  return (
    <div className="flex-1 flex flex-col justify-between bg-slate-50 overflow-y-auto">
      <div className="max-w-6xl w-full mx-auto p-6 md:p-8 space-y-6">
        <Title badge={<Users className="w-7 h-7" />} title={r.title} sub={r.sub} />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-6 bg-blue-50/70 border border-blue-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-2xs">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-700">{r.tokenTitle}</span>
            <div className="text-6xl sm:text-7xl font-black text-blue-700 tracking-tight font-mono">{token}</div>
            <div className="space-y-1">
              <div className="text-sm font-bold text-slate-800">{r.kioskInfo}</div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium"><Clock className="w-4 h-4 text-blue-600" /> <span>{r.eta}</span></div>
            </div>
          </div>
          <div className="lg:col-span-6 bg-white rounded-3xl p-8 border border-slate-200 shadow-2xs flex flex-col justify-between space-y-6">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">{r.whileWait}</h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-3"><div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5"><Lock className="w-4 h-4" /></div><span className="text-sm font-medium text-slate-700 leading-snug">{r.w1}</span></li>
              <li className="flex items-start gap-3"><div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5"><ShieldCheck className="w-4 h-4" /></div><span className="text-sm font-medium text-slate-700 leading-snug">{r.w2}</span></li>
              <li className="flex items-start gap-3"><div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5"><Check className="w-4 h-4 stroke-[3]" /></div><span className="text-sm font-medium text-slate-700 leading-snug">{r.w3}</span></li>
            </ul>
            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-400 text-center font-medium">Token {token} has been broadcasted to the branch floor assistant.</div>
          </div>
        </div>
      </div>
      <footer className={plainFooter}>
        <button onClick={() => { b.playTap(); onBack(); }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold transition-all cursor-pointer shadow-2xs">
          <X className="w-4 h-4" /> <span>{r.cancelHelpBtn}</span>
        </button>
        <button onClick={() => { b.playTap(); onBack(); }} className={btnPrimary}>
          <span>{r.continueBtn}</span>
        </button>
      </footer>
    </div>
  );
}
