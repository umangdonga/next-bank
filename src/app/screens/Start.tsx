import { useEffect, useRef, useState } from 'react';
import { Baby, CalendarClock, Check, CircleAlert, Clock, CreditCard, FingerprintPattern, Info, Printer, RotateCcw, ScanLine, Smartphone, Users, CircleCheckBig, Lock } from 'lucide-react';
import { b } from '../../lib/sound';
import { deleteDraft, lanBases, lastSlipCode, loadDraft, phoneDelete, phoneGet, saveDraft } from '../../lib/api';
import { useApp } from '../ctx';
import { Footer, FingerprintSensor, Keypad, Modal, Page, PrivacyBadge, QR, Title, btnOutline, btnPrimary, btnPrimaryDisabled, useCountdown, useDigits, useDocInfo } from '../ui';
import { DEPOSIT, FIXES, docResolved, docsFor, ekycFor, fixOf, missingDocs, rupees, type Doc, type Fix, type Screen, type UserData } from '../state';

/* ================================================================ 01 */

/**
 * Original "Open a Savings Account" screen, now for the account chosen on the home
 * screen. NEW: each "Keep these with you" card can be marked "I have it" or
 * "Not with me", so missing items are caught before the visitor starts.
 */
export function BeforeStart() {
  const { t, user, update, go } = useApp();
  const i = t.s1;
  const x = t.x.check;
  const h = t.x.home;
  const info = useDocInfo();
  const icons: Record<Doc, typeof CreditCard> = { aadhaar: CreditCard, pan: CreditCard, mobile: Smartphone, child: Baby };
  const docs = docsFor(user);
  const cards = docs.map((d) => ({ d, ...info[d], Icon: icons[d] }));
  const missing = missingDocs(user);
  const unresolved = missing.filter((d) => !docResolved(user.docs[d]));
  const note = h.note[user.accountType];

  const mark = (d: Doc, have: boolean) => {
    b.playTap();
    const docs = { ...user.docs };
    docs[d] = have ? { have: true } : { have: false };
    update({ docs });
  };

  const start = () => {
    // "I have everything" counts every unmarked card as "I have it".
    const marked = { ...user.docs };
    docs.forEach((d) => {
      if (!marked[d]) marked[d] = { have: true };
    });
    update({ docs: marked });
    if (missingDocs({ ...user, docs: marked }).some((d) => !docResolved(marked[d]))) go('E1-docs-missing');
    else go('02-aadhaar');
  };

  const minor = user.accountType === 'minor';
  const steps = minor
    ? [t.x.minor.guardianBanner, t.x.minor.childBanner, `${t.x.minor.docTitle}: ${t.x.minor.docTypes.birth}`, i.step3, h.stepDeposit(rupees(DEPOSIT.minor)), i.step4, i.step5]
    : [i.step1, i.step2, h.stepFinger, i.step3, h.stepDeposit(rupees(DEPOSIT[user.accountType])), i.step4, i.step5];

  return (
    <Page
      footer={
        <Footer onBack={() => go('00-home')} showHome={false}>
          <button onClick={() => { b.playTap(); go('E1-docs-missing'); }} className={btnOutline}>
            {i.somethingMissingBtn}
          </button>
          <button onClick={() => { b.playSuccess(); start(); }} className={btnPrimary.replace('px-8', 'px-6')}>
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{unresolved.length ? x.seeOptions : i.startBtn}</span>
          </button>
        </Footer>
      }
    >
      <Title
        badge="1"
        title={h.cards[user.accountType].open}
        sub={i.time}
        right={
          <div className="hidden md:block text-right shrink-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{h.deposit}</div>
            <div className="text-2xl font-black text-blue-700">{rupees(DEPOSIT[user.accountType])}</div>
          </div>
        }
      />
      {note && (
        <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-700 font-medium leading-relaxed">{note}</p>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-800 mb-1">{i.keepThese}</h2>
            <p className="text-xs text-slate-500 mb-3">{x.tapHint}</p>
            <div className={`grid grid-cols-1 gap-3.5 ${minor ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
              {cards.map(({ d, title, sub, Icon }) => {
                const st = user.docs[d];
                const have = st?.have === true;
                const miss = st && !st.have;
                const fix = miss ? (st as { fix?: Fix }).fix : undefined;
                return (
                  <div
                    key={d}
                    className={`bg-white rounded-2xl p-4 border shadow-2xs flex flex-col justify-between transition-all ${have ? 'border-emerald-400 ring-2 ring-emerald-100' : miss ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-200/90 hover:border-blue-300'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${have ? 'bg-emerald-50 text-emerald-600' : miss ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      {have && <CircleCheckBig className="w-5 h-5 text-emerald-600" />}
                      {miss && <CircleAlert className="w-5 h-5 text-amber-600" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{sub}</p>
                    </div>
                    {fix ? (
                      <div className="mt-3 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1.5 text-center">{t.x.missing.resolvedBy[fix]}</div>
                    ) : (
                      <div className="mt-3 grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => mark(d, true)}
                          className={`py-2 rounded-lg text-[11px] font-bold border cursor-pointer transition-all ${have ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400'}`}
                        >
                          {x.have}
                        </button>
                        <button
                          type="button"
                          onClick={() => mark(d, false)}
                          className={`py-2 rounded-lg text-[11px] font-bold border cursor-pointer transition-all ${miss ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-700 border-slate-200 hover:border-amber-400'}`}
                        >
                          {x.notWithMe}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-900">
            <CircleAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-amber-800 leading-relaxed font-medium">{unresolved.length ? x.missingCount(unresolved.length) : i.missingBanner}</p>
          </div>
        </div>
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 md:p-6 border border-slate-200 shadow-2xs">
          <h2 className="text-base font-bold text-slate-900 mb-4 tracking-tight">{i.whatNext}</h2>
          <ul className="space-y-3">
            {steps.map((s, n) => (
              <li key={n} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">{n + 1}</span>
                <span className="text-sm font-medium text-slate-700 leading-snug">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Page>
  );
}

/* ================================================================ E1 */

const FIX_ICON: Record<Fix, typeof Clock> = {
  phone: ScanLine,
  later: Clock,
  fingerprint: FingerprintPattern,
  staff: Users,
};

/**
 * Original "Documents not with you?" screen, rebuilt so every option works and is
 * specific to the missing item (problem 2). Only two choices per item.
 */
export function DocsMissing() {
  const { t, user, update, go, help } = useApp();
  const x = t.x.missing;
  const [open, setOpen] = useState<{ d: Doc; f: Fix } | null>(null);
  const info = useDocInfo();
  const docs = docsFor(user);
  const missing = missingDocs(user);
  const allSorted = missing.length > 0 && missing.every((d) => docResolved(user.docs[d]));

  const toggleMissing = (d: Doc) => {
    b.playTap();
    const docs = { ...user.docs };
    docs[d] = docs[d] && !docs[d]!.have ? { have: true } : { have: false };
    update({ docs });
  };

  const resolve = (d: Doc, f: Fix, extra: Partial<UserData> = {}) => {
    const docs = { ...user.docs, [d]: { have: false, fix: f } };
    update({ docs, ...extra });
    setOpen(null);
    if (f === 'staff') help();
  };

  const pick = (d: Doc, f: Fix) => {
    b.playTap();
    if (f === 'staff' || f === 'later') resolve(d, f);
    else setOpen({ d, f });
  };

  const next = () => {
    const marked = { ...user.docs };
    docs.forEach((d) => {
      if (!marked[d]) marked[d] = { have: true };
    });
    update({ docs: marked });
    go('02-aadhaar');
  };

  return (
    <Page
      footer={
        <Footer onBack={() => go('01-before-start')}>
          <button disabled={!allSorted} onClick={() => { b.playSuccess(); next(); }} className={allSorted ? btnPrimary : btnPrimaryDisabled}>
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{x.continueBtn}</span>
          </button>
        </Footer>
      }
    >
      <Title badge="!" tone="amber" title={x.title} sub={x.sub} right={<PrivacyBadge />} />

      <div className="flex flex-wrap items-center gap-2">
        {docs.map((d) => {
          const miss = missing.includes(d);
          return (
            <button
              key={d}
              type="button"
              onClick={() => toggleMissing(d)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border cursor-pointer transition-all ${miss ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-600 border-slate-300 hover:border-amber-400'}`}
            >
              {miss ? <CircleAlert className="w-4 h-4" /> : <Check className="w-4 h-4 text-emerald-600" />}
              {info[d].title} · {miss ? t.x.check.notWithMe : t.x.check.have}
            </button>
          );
        })}
      </div>

      {missing.length === 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 text-sm text-slate-600 font-medium">{t.e1.sub}</div>
      )}

      {missing.map((d) => {
        const st = user.docs[d] as { have: false; fix?: Fix };
        return (
          <div key={d} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CircleAlert className="w-5 h-5 text-amber-500" /> {info[d].title}
              </h2>
              {st.fix ? (
                <span className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  <CircleCheckBig className="w-4 h-4" /> {x.resolvedBy[st.fix]}
                </span>
              ) : (
                <span className="text-xs font-bold text-amber-700">{x.chooseOne}</span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FIXES[d].map((f, n) => {
                const c = (x.fixes[d] as Record<string, { badge: string; title: string; sub: string; btn: string }>)[f];
                const Icon = FIX_ICON[f];
                const chosen = st.fix === f;
                return (
                  <div
                    key={f}
                    className={`bg-white rounded-2xl p-5 border shadow-2xs flex flex-col justify-between space-y-4 transition-all ${chosen ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200 hover:border-blue-400'}`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                          <Icon className="w-5 h-5" />
                        </div>
                        {c.badge && <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">{c.badge}</span>}
                      </div>
                      <h3 className="text-base font-bold text-slate-900">{c.title}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">{c.sub}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => pick(d, f)}
                      className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 ${
                        chosen ? 'bg-emerald-600 text-white' : n === 0 ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border border-blue-300 hover:border-blue-400 text-blue-700 bg-white hover:bg-blue-50'
                      }`}
                    >
                      {chosen ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-4 h-4" />}
                      <span>{chosen ? x.resolvedBy[f] : c.btn}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {allSorted && (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-sm font-bold text-emerald-800">
          <CircleCheckBig className="w-5 h-5 text-emerald-600" /> {x.allSorted}
        </div>
      )}

      {open?.f === 'phone' && <PhoneScanModal doc={open.d} onClose={() => setOpen(null)} onDone={() => resolve(open.d, 'phone')} />}
      {open?.f === 'fingerprint' && (
        <Modal onClose={() => setOpen(null)}>
          <FingerprintPattern className="w-12 h-12 text-blue-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">{x.fingerTitle}</h3>
          <p className="text-sm text-slate-600">{x.fingerBody}</p>
          <button type="button" onClick={() => resolve(open.d, 'fingerprint')} className={`${btnPrimary} w-full justify-center`}>
            <Check className="w-4 h-4 stroke-[3]" /> {t.x.common.continue}
          </button>
        </Modal>
      )}
    </Page>
  );
}

/* ------------------------------------------------------- phone scan */

/**
 * NEW: the visitor scans a QR with their own phone and sends a photo of the card.
 * The kiosk only learns that it arrived; the photo itself is never shown here.
 */
export function PhoneScanModal({ doc, onClose, onDone }: { doc: Doc; onClose: () => void; onDone: () => void }) {
  const { t, lang, speed } = useApp();
  const x = t.x.phoneScan;
  const info = useDocInfo();
  const [sid] = useState(() => Math.random().toString(36).slice(2, 10));
  const [base, setBase] = useState(location.origin);
  const [done, setDone] = useState(false);
  const finish = useRef(() => {});
  finish.current = () => {
    if (done) return;
    b.playSuccess();
    setDone(true);
    window.setTimeout(onDone, 1100);
  };

  useEffect(() => {
    // A phone cannot open "localhost", so point the QR at this computer's Wi-Fi address when we know it.
    if (['localhost', '127.0.0.1'].includes(location.hostname)) void lanBases().then((l) => l[0] && setBase(l[0]));
    const id = window.setInterval(async () => {
      if ((await phoneGet(sid))?.done) finish.current();
    }, 1500 / speed);
    return () => {
      window.clearInterval(id);
      void phoneDelete(sid);
    };
  }, [sid, speed]);

  return (
    <Modal onClose={onClose}>
      <h3 className="text-lg font-bold text-slate-900">{x.title}</h3>
      <div className="text-sm font-bold text-blue-700">{info[doc].title}</div>
      <div className="w-48 h-48 mx-auto bg-white rounded-2xl flex items-center justify-center border-2 border-dashed border-blue-400 p-2">
        <QR value={`${base}/#/up/${sid}?doc=${doc}&lang=${lang}`} className="w-full h-full" />
      </div>
      <ol className="text-left space-y-2">
        {x.steps.map((s, n) => (
          <li key={s} className="flex items-start gap-2.5 text-sm text-slate-700">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">{n + 1}</span>
            {s}
          </li>
        ))}
      </ol>
      <div className={`flex items-center justify-center gap-2 text-sm font-semibold rounded-xl py-3 ${done ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
        {done ? <CircleCheckBig className="w-4 h-4" /> : <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
        {done ? x.done : x.waiting}
      </div>
      <p className="flex items-start gap-2 text-left text-[11px] text-slate-500"><Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {x.privacy}</p>
      {!done && (
        <button type="button" onClick={() => finish.current()} className="text-xs text-slate-400 hover:text-blue-600 font-medium cursor-pointer">
          {x.simulate} →
        </button>
      )}
    </Modal>
  );
}

/* ================================================================ E7 */

/** Where a saved application continues: the step that needs the missing item. */
const resumeScreenFor = (u: UserData): Screen => (fixOf(u, 'aadhaar') === 'later' || fixOf(u, 'pan') === 'later' ? '04-scan-cards' : '06m-child');

/**
 * NEW: QR return slip. The application is saved on the bank server; the slip's QR
 * (or its code) brings the visitor back to the same step after an OTP or fingerprint.
 */
export function ReturnPass() {
  const { t, user, clearAll, speed } = useApp();
  const x = t.x.returnPass;
  const info = useDocInfo();
  const [saved, setSaved] = useState<{ code: string; expiresAt: number } | null>(null);
  const [print, setPrint] = useState<'idle' | 'printing' | 'done'>('idle');
  const docs = docsFor(user);
  const bring = docs.filter((d) => fixOf(user, d) === 'later');
  const ready = docs.filter((d) => !bring.includes(d));
  const left = useCountdown(90, () => clearAll(), speed);

  useEffect(() => {
    void saveDraft({ user, screen: resumeScreenFor(user) }, user.resumeCode).then(setSaved);
    // Saved once, when the slip screen opens.
  }, []);

  useEffect(() => {
    if (print !== 'printing') return;
    b.playPrintWhir();
    const id = window.setTimeout(() => {
      b.playSuccess();
      setPrint('done');
    }, 2500 / speed);
    return () => window.clearTimeout(id);
  }, [print, speed]);

  const valid = saved ? new Date(saved.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const qr = saved ? `NEXT-RESUME:${saved.code}` : 'NEXT';

  return (
    <Page
      footer={
        <Footer showHome={false} showHelp={false}>
          <span className="text-xs text-slate-400 font-medium">{t.x.common.autoClear(left)}</span>
          <button onClick={() => { b.playTap(); clearAll(); }} className={btnPrimary}>
            <Check className="w-4 h-4 stroke-[3]" /> <span>{x.finish}</span>
          </button>
        </Footer>
      }
    >
      <Title badge={<CalendarClock className="w-6 h-6" />} title={x.title} sub={x.sub} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 w-full bg-amber-50/50 border-2 border-dashed border-amber-300 rounded-2xl p-6 text-left font-mono space-y-4 shadow-inner">
          <div className="text-center border-b border-amber-300 pb-2">
            <div className="font-bold text-xs tracking-wider text-slate-900 uppercase">NEXT BANK · {t.x.home.cards[user.accountType].product}</div>
            <div className="text-[10px] text-slate-500">BRANCH KIOSK SELF-SERVICE DESK</div>
          </div>
          <div className="flex items-center gap-5">
            <div className="w-36 h-36 bg-white rounded-xl p-1.5 border border-amber-200 shrink-0">
              <QR value={qr} className="w-full h-full" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 uppercase">{x.code}</div>
              <div className="text-4xl font-extrabold text-blue-700 tracking-tight">{saved?.code ?? '…'}</div>
              <div className="text-xs text-emerald-700 font-bold mt-2">{saved && x.valid(valid)}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs border-t border-amber-200 pt-3">
            <div>
              <div className="font-bold text-amber-800 uppercase mb-1">{x.bring}</div>
              {bring.map((d) => (
                <div key={d} className="flex items-center gap-1.5 font-bold text-slate-900">
                  <CircleAlert className="w-4 h-4 text-amber-600 shrink-0" /> {info[d].title}
                </div>
              ))}
            </div>
            <div>
              <div className="font-bold text-emerald-700 uppercase mb-1">{x.ready}</div>
              {ready.map((d) => (
                <div key={d} className="flex items-center gap-1.5 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" /> {info[d].title}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs text-center space-y-3">
            {print === 'idle' && (
              <button type="button" disabled={!saved} onClick={() => setPrint('printing')} className={`${saved ? btnPrimary : btnPrimaryDisabled} w-full justify-center`}>
                <Printer className="w-4 h-4" /> {x.print}
              </button>
            )}
            {print === 'printing' && (
              <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-600">
                <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> {x.printing}
              </div>
            )}
            {print === 'done' && <div className="text-sm font-bold text-emerald-700">✓ {x.printed}</div>}
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center gap-4">
            <QR value={qr} className="w-24 h-24 shrink-0" />
            <p className="text-sm font-semibold text-slate-700">{x.phoneQr}</p>
          </div>
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-emerald-800 font-medium">
            <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              {x.secure} {user.verifiedVia === 'otp' && x.sms(ekycFor(user).mobile)}
            </span>
          </div>
        </div>
      </div>
    </Page>
  );
}

/* ================================================================ E9 */

type Draft = { user: UserData; screen: Screen };

/** NEW: scan the QR return slip (or type its code), confirm with OTP or fingerprint, carry on. */
export function Resume() {
  const { t, go, restore } = useApp();
  const x = t.x.resume;
  const [code, setCode] = useState('');
  const [otp, setOtp] = useState('');
  const [st, setSt] = useState<'code' | 'searching' | 'notFound' | 'noDemo' | 'verify' | 'finger' | 'restoring'>('code');
  const [draft, setDraft] = useState<{ code: string; d: Draft } | null>(null);
  const codeKeys = useDigits(code, (v) => { setCode(v); setSt('code'); }, 6);
  const otpKeys = useDigits(otp, setOtp, 6);
  const verifying = st === 'verify' || st === 'finger';

  const find = async (full: string) => {
    setSt('searching');
    const d = await loadDraft<Draft>(full);
    if (!d) {
      b.playError();
      setSt('notFound');
      return;
    }
    b.playBeep();
    setDraft({ code: full, d });
    setSt('verify');
  };

  const scanSlip = () => {
    const c = lastSlipCode();
    if (!c) {
      b.playError();
      setSt('noDemo');
      return;
    }
    setCode(c.slice(3));
    void find(c);
  };

  const finish = () => {
    if (!draft) return;
    setSt('restoring');
    b.playSuccess();
    // The visitor came back with what was missing, so those items now count as "I have it".
    const docs = { ...draft.d.user.docs };
    docsFor(draft.d.user).forEach((k) => {
      if (fixOf(draft.d.user, k) === 'later') docs[k] = { have: true };
    });
    // One slip, one use: nobody can open the same application again with it.
    void deleteDraft(draft.code);
    window.setTimeout(() => restore({ ...draft.d.user, docs, typeChosen: true, resumeCode: undefined }, draft.d.screen), 1200);
  };

  return (
    <Page
      footer={
        <Footer onBack={() => (verifying ? setSt('code') : go('00-home'))} showHome={false}>
          {verifying ? (
            <button disabled={otp.length !== 6 || st !== 'verify'} onClick={finish} className={otp.length === 6 ? btnPrimary : btnPrimaryDisabled}>
              <Check className="w-4 h-4 stroke-[3]" /> <span>{t.s3.verifyOtpBtn}</span>
            </button>
          ) : (
            <button disabled={code.length !== 6 || st === 'searching'} onClick={() => void find(`VK-${code}`)} className={code.length === 6 ? btnPrimary : btnPrimaryDisabled}>
              <span>{x.find}</span>
            </button>
          )}
        </Footer>
      }
    >
      <Title badge={<RotateCcw className="w-6 h-6" />} title={verifying ? x.verifyTitle : x.title} sub={verifying && draft ? x.verifySub(ekycFor(draft.d.user).mobile) : x.sub} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-5">
          {!verifying && (
            <div className="relative bg-slate-900 rounded-2xl p-6 text-white overflow-hidden shadow-md flex items-center gap-4">
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-sky-200 to-blue-400 shadow-[0_0_15px_#38bdf8] animate-pulse top-1/2" />
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 relative"><ScanLine className="w-8 h-8 text-cyan-400 animate-pulse" /></div>
              <div className="relative flex-1">
                <div className="text-base font-bold">{x.scanHint}</div>
                <button type="button" onClick={scanSlip} className="mt-2 text-xs text-slate-400 hover:text-cyan-300 font-medium cursor-pointer">{x.demoScan} →</button>
              </div>
            </div>
          )}
          <div className="bg-white rounded-2xl p-6 border-2 border-blue-500 shadow-sm">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">{verifying ? t.s3.label : x.orType}</label>
            <div className="flex items-center gap-2.5 sm:gap-3">
              {!verifying && <span className="text-3xl font-extrabold text-blue-700 font-mono mr-1">VK-</span>}
              {Array.from({ length: 6 }, (_, n) => {
                const v = (verifying ? otp : code)[n] ?? '';
                const cur = (verifying ? otp : code).length === n;
                return (
                  <div key={n} className={`w-12 h-16 rounded-xl flex items-center justify-center text-3xl font-extrabold border-2 ${cur ? 'border-blue-600 bg-blue-50/40' : v ? 'border-blue-300 bg-white text-slate-900' : 'border-slate-200 bg-slate-50/50'}`}>
                    {v}
                  </div>
                );
              })}
            </div>
            {st === 'notFound' && <p className="text-sm font-semibold text-red-600 mt-4">{x.notFound}</p>}
            {st === 'noDemo' && <p className="text-sm font-semibold text-amber-700 mt-4">{x.noDemo}</p>}
            {st === 'restoring' && <p className="text-sm font-semibold text-emerald-700 mt-4">✓ {x.restored}</p>}
            {verifying && <p className="text-xs text-slate-400 mt-3">{t.x.common.demoDigits(6)}</p>}
          </div>
          {verifying && (
            <button type="button" onClick={() => setSt('finger')} className="bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-blue-400 p-4 rounded-xl text-left flex items-center gap-3 cursor-pointer shadow-2xs w-full">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600"><FingerprintPattern className="w-5 h-5" /></div>
              <div className="text-sm font-bold text-slate-900">{x.useFinger}</div>
            </button>
          )}
        </div>
        <div className="lg:col-span-5 flex justify-center">
          <Keypad {...(verifying ? otpKeys : codeKeys)} clearLabel={t.s9.clearBtn} />
        </div>
      </div>
      {st === 'finger' && (
        <Modal onClose={() => setSt('verify')}>
          <h3 className="text-lg font-bold text-slate-900">{t.e2.scannerModalTitle}</h3>
          <FingerprintSensor onMatched={finish} idleText={t.e2.scannerModalSub} scanningText={t.e2.scannerScanning} matchedText={t.e2.scannerSuccess} />
        </Modal>
      )}
    </Page>
  );
}
