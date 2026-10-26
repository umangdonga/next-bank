import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Clock, Hourglass, House, Lock, Settings2, Trash2, UserRoundX, X, Check } from 'lucide-react';
import { y, type Lang } from '../i18n';
import { b } from '../lib/sound';
import { Ctx, type AppCtx } from './ctx';
import { FingerprintSensor, Header, Keypad, useDigits } from './ui';
import { DEPOSIT, emptyUser, hasProgress, isMinor, isVerified, rupees, IDLE_LIMIT, PREWARN_SECONDS, SHIELD_SECONDS, type Screen, type UserData } from './state';
import { AccountHome } from './screens/Home';
import { BeforeStart, DocsMissing, Resume, ReturnPass } from './screens/Start';
import { Aadhaar, Checking, FaceCheck, Otp, OtpProblem, ScanCards, ScannerError } from './screens/Verify';
import { ConfirmDetails, MoreDetails, ReviewAgree, Services } from './screens/Details';
import { ChildDetails } from './screens/Minor';
import { Deposit } from './screens/Deposit';
import { AccountReady, AllSet, BankVerifying, HelpComing, PrintPassbook, SessionCleared, Signature } from './screens/Finish';

/**
 * Controller for the kiosk (the original "lt" component), with the fixes for
 * problem 1 built in:
 *  - visitor data starts EMPTY and every exit really clears it
 *  - Home asks "Clear everything / Stay"
 *  - idle → gentle warning → privacy shield (details hidden instantly)
 *  - once identity is verified, only the owner can lift the shield
 *    (fingerprint or last 4 Aadhaar digits); otherwise the kiosk wipes itself
 */
export function App() {
  const [screen, setScreen] = useState<Screen>('00-home');
  const [lang, setLang] = useState<Lang>('en');
  const [user, setUser] = useState<UserData>(emptyUser);
  const [returnTo, setReturnTo] = useState<Screen>('00-home');
  const [voice, setVoice] = useState(false);
  const [moreTime, setMoreTime] = useState(false);
  const [fast, setFast] = useState(() => new URLSearchParams(location.search).has('fast'));
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const speed = fast ? 6 : 1;
  const t = y[lang];
  // The privacy overlays read the visitor's language from here.
  document.documentElement.dataset.lang = lang;

  const userRef = useRef(user);
  userRef.current = user;
  const screenRef = useRef(screen);
  screenRef.current = screen;
  /** Last step of the application, so "Continue my application" on Home goes back there. */
  const lastStep = useRef<Screen | null>(null);
  if (!['00-home', 'E5-session-cleared', 'E6-help-coming', 'E7-return-pass', 'E9-resume'].includes(screen)) lastStep.current = screen;

  const update = useCallback((p: Partial<UserData>) => setUser((u) => ({ ...u, ...p })), []);
  const go = useCallback((s: Screen) => {
    b.stopSpeaking();
    setScreen(s);
  }, []);

  /** Wipe every trace of the visitor and start a fresh session. */
  const wipe = useCallback((next: Screen) => {
    b.stopSpeaking();
    lastStep.current = null;
    setUser(emptyUser());
    setLang('en');
    setMoreTime(false);
    setLeaveOpen(false);
    setSessionKey((k) => k + 1);
    setScreen(next);
  }, []);

  const clearAll = useCallback(() => wipe('E5-session-cleared'), [wipe]);

  const home = useCallback(() => {
    if (hasProgress(userRef.current)) setLeaveOpen(true);
    else wipe('00-home');
  }, [wipe]);

  const help = useCallback(() => {
    setReturnTo(screenRef.current);
    setScreen('E6-help-coming');
  }, []);

  const continueApp = useCallback(() => go(lastStep.current ?? '01-before-start'), [go]);

  const restore = useCallback((u: UserData, s: Screen) => {
    setUser(u);
    setSessionKey((k) => k + 1);
    setScreen(s);
  }, []);

  const ctx: AppCtx = useMemo(
    () => ({ lang, t, screen, user, update, go, help, home, clearAll, continueApp, restore, moreTime, setMoreTime, speed }),
    [lang, t, screen, user, update, go, help, home, clearAll, continueApp, restore, moreTime, speed],
  );

  const narration = (): string => {
    const amt = rupees(DEPOSIT[user.accountType]);
    switch (screen) {
      case '00-home': return `${t.x.home.title} ${(['savings', 'current', 'minor'] as const).map((k) => `${t.x.home.cards[k].name}, ${t.x.home.deposit} ${rupees(DEPOSIT[k])}`).join('. ')}.`;
      case '01-before-start': return `${t.x.home.cards[user.accountType].open}. ${t.s1.time}. ${t.s1.keepThese}. ${t.s1.c1Title}, ${t.s1.c2Title}, ${t.s1.c3Title}. ${t.x.check.tapHint}`;
      case '02-aadhaar': return `${t.s2.title}. ${t.s2.sub}`;
      case '03-otp': return `${t.s3.title}. ${t.s3.sub}`;
      case '04-scan-cards': return `${t.s4.title}. ${t.s4.sub}. ${t.s4.instruction1}`;
      case '05-checking': return `${t.s5.title}. ${t.s5.sub}`;
      case '05b-face': return `${t.x.face.title}. ${t.x.face.sub} ${t.x.face.tips.join('. ')}.`;
      case '06-confirm-details': return `${isMinor(user) ? t.x.minor.confirmTitle : t.s6.title}. ${t.s6.sub}. ${user.fullName}.`;
      case '06m-child': return `${t.x.minor.childTitle}. ${t.x.minor.childSub}`;
      case '07-more-details': return `${t.s7.title}. ${t.s7.sub}`;
      case '08-review-agree': return `${t.s8.title}. ${t.s8.sub}. ${t.s8.t1}`;
      case '08a-deposit': return `${t.x.deposit.title}. ${t.x.deposit.sub(amt)} ${t.x.deposit.choose}`;
      case '08b-services': return `${t.s8b.title}. ${t.s8b.sub}.`;
      case '09-signature': return `${t.s9.title}. ${t.s9.sub}.`;
      case '10-bank-verifying': return `${t.s10.title}. ${t.s10.sub}.`;
      case '11-account-ready': return `${t.s11.title}. ${t.s11.collectPassbookTitle}.`;
      case '12-print-passbook': return `${t.s12.title}. ${t.s12.sub}`;
      case '13-all-set': return `${t.s13.title}. ${t.s13.sub}`;
      case 'E1-docs-missing': return `${t.x.missing.title} ${t.x.missing.sub}`;
      case 'E7-return-pass': return `${t.x.returnPass.title}. ${t.x.returnPass.sub}`;
      case 'E9-resume': return `${t.x.resume.title}. ${t.x.resume.sub}`;
      default: return `${t.appName}.`;
    }
  };

  let body: ReactNode;
  switch (screen) {
    case '00-home': body = <AccountHome />; break;
    case '01-before-start': body = <BeforeStart />; break;
    case '02-aadhaar': body = <Aadhaar />; break;
    case '03-otp': body = <Otp />; break;
    case '04-scan-cards': body = <ScanCards />; break;
    case '05-checking': body = <Checking />; break;
    case '05b-face': body = <FaceCheck />; break;
    case '06-confirm-details': body = <ConfirmDetails />; break;
    case '06m-child': body = <ChildDetails />; break;
    case '07-more-details': body = <MoreDetails />; break;
    case '08-review-agree': body = <ReviewAgree />; break;
    case '08a-deposit': body = <Deposit />; break;
    case '08b-services': body = <Services />; break;
    case '09-signature': body = <Signature />; break;
    case '10-bank-verifying': body = <BankVerifying />; break;
    case '11-account-ready': body = <AccountReady />; break;
    case '12-print-passbook': body = <PrintPassbook />; break;
    case '13-all-set': body = <AllSet />; break;
    case 'E1-docs-missing': body = <DocsMissing />; break;
    case 'E2-otp-problem': body = <OtpProblem />; break;
    case 'E3-scanner-error': body = <ScannerError />; break;
    case 'E5-session-cleared': body = <SessionCleared />; break;
    case 'E6-help-coming': body = <HelpComing onBack={() => setScreen(returnTo)} />; break;
    case 'E7-return-pass': body = <ReturnPass />; break;
    case 'E9-resume': body = <Resume />; break;
  }

  return (
    <Ctx.Provider value={ctx}>
      <div className="flex flex-col h-screen w-screen bg-slate-100 font-sans text-slate-800 antialiased overflow-hidden select-none">
        <Header
          screen={screen}
          minor={isMinor(user) && user.typeChosen}
          language={lang}
          onLanguageChange={setLang}
          isVoiceActive={voice}
          onVoiceRead={() => {
            if (voice) {
              b.stopSpeaking();
              setVoice(false);
              return;
            }
            setVoice(true);
            b.speak(narration(), lang);
            window.setTimeout(() => setVoice(false), 6000);
          }}
        />
        <main className="flex-1 flex flex-col overflow-hidden relative" key={`${sessionKey}-${screen}`}>
          {body}
        </main>
        <PrivacyLayer screen={screen} user={user} sessionKey={sessionKey} speed={speed} moreTime={moreTime} setMoreTime={setMoreTime} onExpire={clearAll} fast={fast} setFast={setFast} />
        {leaveOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-2xl w-full space-y-6 shadow-2xl border border-slate-100 animate-scale-in">
              <div className="text-center">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{t.x.leave.title}</h2>
                <p className="text-slate-500 font-medium text-sm mt-1">{t.x.leave.sub}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button type="button" onClick={() => { b.playTap(); setLeaveOpen(false); go('00-home'); }} className="p-4 rounded-2xl border-2 border-blue-500 bg-blue-50/60 text-left cursor-pointer hover:bg-blue-50">
                  <House className="w-6 h-6 text-blue-600" />
                  <div className="mt-2 text-sm font-bold text-blue-800">{t.x.leave.keep}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{t.x.leave.keepSub}</div>
                </button>
                <button type="button" onClick={() => { b.playTap(); setLeaveOpen(false); clearAll(); }} className="p-4 rounded-2xl border-2 border-red-200 bg-red-50/50 text-left cursor-pointer hover:bg-red-50">
                  <Trash2 className="w-6 h-6 text-red-600" />
                  <div className="mt-2 text-sm font-bold text-red-700">{t.x.leave.clear}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{t.x.leave.clearSub}</div>
                </button>
                <button type="button" onClick={() => { b.playTap(); setLeaveOpen(false); }} className="p-4 rounded-2xl border-2 border-slate-200 bg-white text-left cursor-pointer hover:bg-slate-50">
                  <X className="w-6 h-6 text-slate-500" />
                  <div className="mt-2 text-sm font-bold text-slate-800">{t.x.leave.stay}</div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}

/* ---------------------------------------------------------- privacy layer */

function PrivacyLayer({
  screen,
  user,
  sessionKey,
  speed,
  moreTime,
  setMoreTime,
  onExpire,
  fast,
  setFast,
}: {
  screen: Screen;
  user: UserData;
  sessionKey: number;
  speed: number;
  moreTime: boolean;
  setMoreTime: (v: boolean) => void;
  onExpire: () => void;
  fast: boolean;
  setFast: (v: boolean) => void;
}) {
  // Home needs a shield only while an application is being kept.
  const base = screen === '00-home' && !hasProgress(user) ? null : IDLE_LIMIT[screen];
  const limit = base == null ? null : base * (moreTime ? 2 : 1);
  const shieldTotal = Math.round(SHIELD_SECONDS * (moreTime ? 1.5 : 1));
  const last = useRef(Date.now());
  const [now, setNow] = useState(Date.now());
  const [shieldAt, setShieldAt] = useState<number | null>(null);
  const shieldRef = useRef(false);
  shieldRef.current = shieldAt !== null;
  const expiring = useRef(false);
  const [demoOpen, setDemoOpen] = useState(false);

  useEffect(() => {
    const bump = () => {
      if (!shieldRef.current) last.current = Date.now();
    };
    window.addEventListener('pointerdown', bump, true);
    window.addEventListener('keydown', bump, true);
    const id = window.setInterval(() => setNow(Date.now()), 250);
    const toggle = (e: KeyboardEvent) => e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd' && setDemoOpen((o) => !o);
    window.addEventListener('keydown', toggle);
    return () => {
      window.removeEventListener('pointerdown', bump, true);
      window.removeEventListener('keydown', bump, true);
      window.removeEventListener('keydown', toggle);
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    last.current = Date.now();
  }, [screen]);
  useEffect(() => {
    setShieldAt(null);
    expiring.current = false;
  }, [sessionKey]);

  const idle = ((now - last.current) / 1000) * speed;
  const prewarn = shieldAt === null && limit != null && idle >= limit - PREWARN_SECONDS && idle < limit;
  useEffect(() => {
    if (shieldAt === null && limit != null && idle >= limit) {
      b.playWarn();
      setShieldAt(Date.now());
    }
  }, [idle, limit, shieldAt]);

  const left = shieldAt === null ? shieldTotal : Math.max(0, Math.ceil(shieldTotal - ((now - shieldAt) / 1000) * speed));
  useEffect(() => {
    if (shieldAt !== null && left <= 0 && !expiring.current) {
      expiring.current = true;
      onExpire();
    }
  }, [left, shieldAt, onExpire]);

  const unlock = () => {
    b.playSuccess();
    last.current = Date.now();
    setShieldAt(null);
  };
  const clearNow = () => {
    if (!expiring.current) {
      expiring.current = true;
      onExpire();
    }
  };

  return (
    <>
      {prewarn && <PreWarn left={Math.max(1, Math.ceil(limit! - idle))} />}
      {shieldAt !== null && (
        <Shield
          left={left}
          ownerDigits={isVerified(user) && user.aadhaarNumber.length === 12 ? user.aadhaarNumber.slice(-4) : null}
          onUnlock={unlock}
          onClear={clearNow}
          moreTime={moreTime}
          setMoreTime={setMoreTime}
        />
      )}
      <DemoPanel
        open={demoOpen}
        setOpen={setDemoOpen}
        idleLeft={limit == null ? null : Math.max(0, Math.ceil(limit - idle))}
        onWalkAway={() => {
          if (limit == null || !hasProgress(user)) return;
          b.playWarn();
          setShieldAt(Date.now());
        }}
        fast={fast}
        setFast={setFast}
      />
    </>
  );
}

function useT() {
  // The privacy UI follows the visitor's chosen language via the document context.
  return y[(document.documentElement.dataset.lang as Lang) || 'en'];
}

function PreWarn({ left }: { left: number }) {
  const t = useT();
  return (
    <div className="pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 z-40 animate-fade-in">
      <div className="flex items-center gap-3 bg-amber-50 border-2 border-amber-400 rounded-2xl px-5 py-3 shadow-xl">
        <Clock className="w-5 h-5 text-amber-600" />
        <span className="text-sm font-bold text-amber-900">{t.x.shield.prewarn(left)}</span>
        <span className="text-xs text-amber-800">· {t.x.shield.prewarnTap}</span>
      </div>
    </div>
  );
}

function Shield({
  left,
  ownerDigits,
  onUnlock,
  onClear,
  moreTime,
  setMoreTime,
}: {
  left: number;
  ownerDigits: string | null;
  onUnlock: () => void;
  onClear: () => void;
  moreTime: boolean;
  setMoreTime: (v: boolean) => void;
}) {
  const t = useT();
  const s = t.x.shield;
  const [digits, setDigits] = useState('');
  const [wrong, setWrong] = useState(false);
  const keys = useDigits(digits, (v) => { setWrong(false); setDigits(v); }, 4);
  useEffect(() => {
    if (ownerDigits && digits.length === 4) {
      if (digits === ownerDigits) onUnlock();
      else {
        b.playError();
        setWrong(true);
        setDigits('');
      }
    }
  }, [digits, ownerDigits, onUnlock]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-2xl flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-7 sm:p-8 max-w-2xl w-full text-center space-y-5 shadow-2xl border border-slate-100 animate-scale-in max-h-[96vh] overflow-y-auto">
        <div className="w-14 h-14 mx-auto rounded-full bg-blue-100 text-blue-700 flex items-center justify-center"><Lock className="w-7 h-7" /></div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{s.title}</h2>
          <p className="text-slate-500 font-medium text-xs sm:text-sm mt-1">{s.sub}</p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-full border-4 border-red-500 flex items-center justify-center text-2xl font-extrabold text-red-600">{left}</div>
          <span className="text-sm font-semibold text-red-600">{s.clearing(left)}</span>
        </div>
        {ownerDigits ? (
          <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-5 space-y-4">
            <div className="text-sm font-bold text-blue-800">{s.locked}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center">
              <FingerprintSensor onMatched={onUnlock} idleText={s.fingerprint} scanningText={s.reading} matchedText={s.matched} />
              <div className="flex flex-col items-center gap-3">
                <div className="text-xs text-slate-600 font-medium">{s.orDigits}</div>
                <div className="flex gap-2">
                  {[0, 1, 2, 3].map((n) => (
                    <div key={n} className={`w-11 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-extrabold ${digits[n] ? 'border-blue-400 bg-white' : n === digits.length ? 'border-blue-600 bg-white' : 'border-slate-200 bg-slate-50'}`}>
                      {digits[n] ? '•' : ''}
                    </div>
                  ))}
                </div>
                {wrong && <div className="text-xs font-semibold text-red-600">{s.wrong}</div>}
                <div className="scale-90 origin-top"><Keypad {...keys} /></div>
              </div>
            </div>
          </div>
        ) : (
          <button type="button" onClick={onUnlock} className="w-full py-4 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95">
            <Check className="w-5 h-5 stroke-[3]" /> <span>{s.yes}</span>
          </button>
        )}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button type="button" onClick={() => setMoreTime(!moreTime)} className={`flex-1 py-3 px-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 cursor-pointer ${moreTime ? 'bg-blue-600 text-white border-blue-600' : 'border-blue-200 text-blue-700 bg-blue-50/50'}`}>
            <Hourglass className="w-4 h-4" /> {moreTime ? t.x.common.moreTimeOn : t.x.common.moreTime}
          </button>
          <button type="button" onClick={onClear} className="flex-1 py-3 px-4 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer">
            <X className="w-4 h-4 stroke-[3]" /> {s.clearNow}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Prototype-only: simulate the presence sensor and speed up timers for usability tests. */
function DemoPanel({ open, setOpen, idleLeft, onWalkAway, fast, setFast }: { open: boolean; setOpen: (v: boolean) => void; idleLeft: number | null; onWalkAway: () => void; fast: boolean; setFast: (v: boolean) => void }) {
  const t = useT();
  const d = t.x.demo;
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} title={d.title} className="fixed bottom-1 right-1 z-[60] w-7 h-7 flex items-center justify-center rounded-full text-slate-300 hover:text-blue-600 hover:bg-white cursor-pointer">
        <Settings2 className="w-4 h-4" />
      </button>
    );
  return (
    <div className="fixed bottom-2 right-2 z-[60] w-72 bg-white/95 border border-slate-300 rounded-2xl p-4 shadow-2xl text-xs space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="font-bold text-slate-600">{d.title}</span>
        <button type="button" onClick={() => setOpen(false)} className="text-blue-600 font-semibold cursor-pointer">{d.hide}</button>
      </div>
      <button type="button" onClick={onWalkAway} className="w-full flex items-center gap-2 bg-slate-900 hover:bg-slate-700 text-white font-semibold px-3 py-2.5 rounded-xl cursor-pointer">
        <UserRoundX className="w-4 h-4" /> {d.walkAway}
      </button>
      <p className="text-slate-500 leading-snug">{d.hint}</p>
      <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
        <input type="checkbox" checked={fast} onChange={(e) => setFast(e.target.checked)} /> {d.fast}
      </label>
      <p className="text-slate-500">{idleLeft == null ? d.none : d.idle(idleLeft)}</p>
    </div>
  );
}
