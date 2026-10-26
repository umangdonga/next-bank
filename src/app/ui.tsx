/**
 * Shared building blocks, ported from the original Vercel kiosk with the same
 * Tailwind classes (header "Ie", footer "Re", keypad "Be", signature pad "Ye").
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import QRCode from 'qrcode';
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  CircleCheckBig,
  CircleQuestionMark,
  Delete,
  Eye,
  EyeOff,
  FingerprintPattern,
  Hourglass,
  House,
  Lock,
  PenTool,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  Check,
} from 'lucide-react';
import { b } from '../lib/sound';
import { y, type Lang } from '../i18n';
import { useApp } from './ctx';
import { isMinor, stepOf, type Doc, type Screen } from './state';

/* ----------------------------------------------------------------- header */

export function Header({
  screen,
  minor,
  language,
  onLanguageChange,
  onVoiceRead,
  isVoiceActive,
}: {
  screen: Screen;
  minor: boolean;
  language: Lang;
  onLanguageChange: (l: Lang) => void;
  onVoiceRead: () => void;
  isVoiceActive: boolean;
}) {
  const a = y[language];
  const { n, key } = stepOf(screen);
  const stage = minor && (key === 'verify' || key === 'details') ? a.x.minor.stages[key] : a.stepStages[key];
  const showSteps = !['00-home', 'E6-help-coming', 'E5-session-cleared', 'E7-return-pass', 'E9-resume'].includes(screen);
  const langBtn = (l: Lang, label: string) => (
    <button
      onClick={() => {
        b.playTap();
        onLanguageChange(l);
      }}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${language === l ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'}`}
    >
      {label}
    </button>
  );
  return (
    <header className="w-full bg-white border-b border-slate-200 px-6 py-3 select-none flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
          <div className="grid grid-cols-2 gap-1 p-1">
            <span className="w-2 h-2 rounded-full bg-white" />
            <span className="w-2 h-2 rounded-full bg-blue-200" />
            <span className="w-2 h-2 rounded-full bg-blue-300" />
            <span className="w-2 h-2 rounded-full bg-white" />
          </div>
        </div>
        <div>
          <div className="text-slate-900 font-bold text-base leading-tight tracking-tight">Information</div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 font-semibold text-xs tracking-wide">Kiosk</span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-blue-700 bg-blue-50 px-1 rounded">NEXT</span>
          </div>
        </div>
      </div>
      {showSteps ? (
        <div className="flex flex-col items-center gap-1.5">
          <div className="text-xs sm:text-sm font-bold text-slate-800 tracking-wide flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Step {n} of 5 ·</span>
            <span className="text-blue-600 font-extrabold capitalize">{stage}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === n ? 'w-7 sm:w-9 bg-blue-600' : i < n ? 'w-4 sm:w-5 bg-blue-300' : 'w-4 sm:w-5 bg-slate-200'}`}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-sm font-semibold text-slate-600">NEXT Bank Self-Service Kiosk</div>
      )}
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <div className="px-2 text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <path strokeWidth="2" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
            </svg>
          </div>
          {langBtn('en', 'English')}
          {langBtn('hi', 'हिन्दी')}
          {langBtn('gu', 'ગુજરાતી')}
        </div>
        <button
          onClick={() => {
            b.playTap();
            onVoiceRead();
          }}
          title="Listen to this screen instructions"
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${isVoiceActive ? 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-400' : 'bg-white hover:bg-slate-50 text-blue-700 border-blue-200 hover:border-blue-300'}`}
        >
          {isVoiceActive ? (
            <>
              <VolumeX className="w-4 h-4 text-amber-700 animate-pulse" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-blue-600" />
              <span>{a.voiceBtn}</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}

/* --------------------------------------------------------- page + title */

export const btnPrimary =
  'flex items-center gap-2 px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95';
export const btnPrimaryDisabled = 'flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold bg-slate-200 text-slate-400 cursor-not-allowed shadow-none';
export const btnSoft =
  'flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 hover:border-blue-400 text-blue-700 bg-blue-50/50 hover:bg-blue-100/50 text-sm font-semibold transition-all cursor-pointer shadow-2xs active:scale-95';
export const btnOutline =
  'px-5 py-3 rounded-xl border border-blue-300 hover:border-blue-400 text-blue-700 bg-white hover:bg-blue-50/50 text-sm font-semibold transition-all cursor-pointer shadow-2xs';

/** Page body + footer, the layout every original screen used. */
export function Page({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  return (
    <div className="flex-1 flex flex-col justify-between bg-slate-50 overflow-y-auto">
      <div className="max-w-6xl w-full mx-auto p-6 md:p-8 space-y-6">{children}</div>
      {footer}
    </div>
  );
}

export function Title({ badge, title, sub, tone = 'blue', right }: { badge: ReactNode; title: ReactNode; sub?: ReactNode; tone?: 'blue' | 'green' | 'amber'; right?: ReactNode }) {
  const bg = tone === 'green' ? 'bg-emerald-600' : tone === 'amber' ? 'bg-amber-500' : 'bg-blue-600';
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl ${bg} text-white font-extrabold text-2xl flex items-center justify-center shadow-md shrink-0`}>{badge}</div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
          {sub && <p className="text-slate-500 font-medium text-sm md:text-base mt-0.5">{sub}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

/** NEW: small "Private session" badge with the extra-time switch (problem 1). */
export function PrivacyBadge() {
  const { t, moreTime, setMoreTime } = useApp();
  return (
    <div className="hidden md:flex items-center gap-2 shrink-0">
      <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-full" title={t.x.common.privateHint}>
        <Lock className="w-3.5 h-3.5" /> {t.x.common.privateSession}
      </span>
      <button
        type="button"
        onClick={() => {
          b.playTap();
          setMoreTime(!moreTime);
        }}
        className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full border cursor-pointer transition-all ${moreTime ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-700 border-blue-200 hover:border-blue-400'}`}
      >
        <Hourglass className="w-3.5 h-3.5" /> {moreTime ? t.x.common.moreTimeOn : t.x.common.moreTime}
      </button>
    </div>
  );
}

/** Name and hint for each item the visitor brings; a minor account asks for the guardian's cards. */
export function useDocInfo(): Record<Doc, { title: string; sub: string }> {
  const { t, user } = useApp();
  if (isMinor(user)) return t.x.minor.docs;
  return {
    aadhaar: { title: t.s1.c1Title, sub: t.s1.c1Sub },
    pan: { title: t.s1.c2Title, sub: t.s1.c2Sub },
    mobile: { title: t.s1.c3Title, sub: t.s1.c3Sub },
    child: t.x.minor.docs.child,
  };
}

/** NEW: tells the visitor whose details a minor-account screen is about. */
export function MinorBanner({ step }: { step: 'guardian' | 'child' }) {
  const { t, user } = useApp();
  if (!isMinor(user)) return null;
  return (
    <div className="bg-violet-50 border border-violet-200 rounded-2xl px-4 py-3 flex items-center gap-3 text-sm font-bold text-violet-800">
      <span className="w-2.5 h-2.5 rounded-full bg-violet-500 shrink-0" />
      {step === 'guardian' ? t.x.minor.guardianBanner : t.x.minor.childBanner}
    </div>
  );
}

/* ----------------------------------------------------------------- footer */

export function Footer({
  onBack,
  showHome = true,
  showHelp = true,
  children,
}: {
  onBack?: () => void;
  showHome?: boolean;
  showHelp?: boolean;
  children?: ReactNode;
}) {
  const { t, home, help } = useApp();
  return (
    <footer className="w-full bg-white border-t border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 select-none">
      <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={() => { b.playTap(); onBack(); }} className={btnSoft}>
            <ArrowLeft className="w-4 h-4 text-blue-700" />
            <span>{t.back}</span>
          </button>
        )}
        {showHome && (
          <button onClick={() => { b.playTap(); home(); }} className={btnSoft}>
            <House className="w-4 h-4 text-blue-700" />
            <span>{t.home}</span>
          </button>
        )}
        {showHelp && (
          <button onClick={() => { b.playTap(); help(); }} className={btnSoft}>
            <CircleQuestionMark className="w-4 h-4 text-blue-600" />
            <span>{t.needHelp}</span>
          </button>
        )}
      </div>
      <div className="flex items-center gap-3 ml-auto">{children}</div>
    </footer>
  );
}

/* ----------------------------------------------------------------- keypad */

// Only the most recently mounted keypad takes physical key presses (handy for testing).
const keypadOwners: string[] = [];

export function Keypad({
  onDigit,
  onClear,
  onBackspace,
  clearLabel = 'Clear',
}: {
  onDigit: (d: string) => void;
  onClear: () => void;
  onBackspace: () => void;
  clearLabel?: string;
}) {
  const id = useRef(Math.random().toString(36)).current;
  const cbs = useRef({ onDigit, onBackspace });
  cbs.current = { onDigit, onBackspace };
  useEffect(() => {
    keypadOwners.push(id);
    const h = (e: KeyboardEvent) => {
      if (keypadOwners[keypadOwners.length - 1] !== id) return;
      if (/^\d$/.test(e.key)) cbs.current.onDigit(e.key);
      else if (e.key === 'Backspace') cbs.current.onBackspace();
    };
    window.addEventListener('keydown', h);
    return () => {
      window.removeEventListener('keydown', h);
      keypadOwners.splice(keypadOwners.lastIndexOf(id), 1);
    };
  }, [id]);

  const key =
    'h-14 sm:h-16 bg-white hover:bg-blue-50 active:bg-blue-100 border border-slate-200 hover:border-blue-300 text-slate-800 text-2xl font-bold rounded-xl shadow-2xs transition-all flex items-center justify-center cursor-pointer select-none active:scale-95';
  return (
    <div className="w-full max-w-[320px] bg-slate-50/70 p-3 rounded-2xl border border-slate-200 shadow-xs">
      <div className="grid grid-cols-3 gap-2.5">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} type="button" onClick={() => { b.playTap(); onDigit(d); }} className={key}>
            {d}
          </button>
        ))}
        <button
          type="button"
          onClick={() => { b.playTap(); onClear(); }}
          className="h-14 sm:h-16 bg-red-50/80 hover:bg-red-100/90 active:bg-red-200 border border-red-200 text-red-600 font-bold text-base rounded-xl transition-all flex items-center justify-center cursor-pointer select-none active:scale-95"
        >
          {clearLabel}
        </button>
        <button type="button" onClick={() => { b.playTap(); onDigit('0'); }} className={key}>
          0
        </button>
        <button
          type="button"
          onClick={() => { b.playTap(); onBackspace(); }}
          title="Backspace"
          className="h-14 sm:h-16 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border border-slate-300 text-slate-700 rounded-xl transition-all flex items-center justify-center cursor-pointer select-none active:scale-95"
        >
          <Delete className="w-6 h-6 text-slate-600" />
        </button>
      </div>
    </div>
  );
}

/** Keypad bound to a string value with a max length. */
export function useDigits(value: string, set: (v: string) => void, max: number) {
  return {
    onDigit: (d: string) => value.length < max && set(value + d),
    onClear: () => set(''),
    onBackspace: () => value.length > 0 && set(value.slice(0, -1)),
  };
}

/* ------------------------------------------------------------------ modal */

export function Modal({ children, onClose, wide }: { children: ReactNode; onClose?: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className={`relative bg-white rounded-3xl p-7 sm:p-8 ${wide ? 'max-w-2xl' : 'max-w-md'} w-full text-center space-y-5 shadow-2xl border border-slate-100 animate-scale-in max-h-[95vh] overflow-y-auto`}>
        {onClose && (
          <button type="button" onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- QR */

export function QR({ value, className = 'w-44 h-44' }: { value: string; className?: string }) {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    let alive = true;
    QRCode.toString(value, { type: 'svg', margin: 1 }).then((s) => alive && setSvg(s));
    return () => {
      alive = false;
    };
  }, [value]);
  return <div className={`mx-auto [&>svg]:w-full [&>svg]:h-full ${className}`} dangerouslySetInnerHTML={{ __html: svg }} />;
}

/* ------------------------------------------------------------ date picker */

export const formatDate = (iso: string, months: string[]) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${months[m - 1]} ${y}`;
};

/** NEW: date field that opens a big-button picker (year → month → day), so nobody has to type a date. Value is YYYY-MM-DD. */
export function DateField({ value, onChange, startDecade = 1970 }: { value: string; onChange: (v: string) => void; startDecade?: number }) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => { b.playTap(); setOpen(true); }}
        className="w-full h-12 px-4 rounded-xl border border-slate-200 hover:border-blue-400 bg-white flex items-center justify-between gap-3 cursor-pointer text-left transition-all"
      >
        <span className={value ? 'font-bold text-slate-900 text-sm' : 'text-sm text-slate-400 font-medium'}>{value ? formatDate(value, t.x.date.months) : t.x.date.pick}</span>
        <CalendarDays className="w-5 h-5 text-blue-600 shrink-0" />
      </button>
      {open && <DatePicker value={value} startDecade={startDecade} onPick={(v) => { onChange(v); setOpen(false); }} onClose={() => setOpen(false)} />}
    </>
  );
}

const FIRST_DECADE = 1920;

function DatePicker({ value, startDecade, onPick, onClose }: { value: string; startDecade: number; onPick: (v: string) => void; onClose: () => void }) {
  const { t } = useApp();
  const d = t.x.date;
  const today = new Date();
  const init = value ? value.split('-').map(Number) : null;
  const [view, setView] = useState<'year' | 'month' | 'day'>('year');
  const [year, setYear] = useState(init?.[0] ?? 0);
  const [month, setMonth] = useState(init ? init[1] - 1 : -1);
  const [decade, setDecade] = useState(Math.floor((init?.[0] ?? startDecade) / 10) * 10);

  const decades: number[] = [];
  for (let x = FIRST_DECADE; x <= today.getFullYear(); x += 10) decades.push(x);
  const years = Array.from({ length: 10 }, (_, i) => decade + i).filter((y) => y <= today.getFullYear());
  const future = (y: number, m: number, day = 1) => new Date(y, m, day) > today;
  const daysIn = month >= 0 ? new Date(year, month + 1, 0).getDate() : 0;
  const firstDow = month >= 0 ? new Date(year, month, 1).getDay() : 0;

  const big = (on: boolean, disabled = false) =>
    `h-14 rounded-xl text-base font-bold border transition-all select-none ${disabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : on ? 'bg-blue-600 text-white border-blue-600 shadow-xs cursor-pointer' : 'bg-white text-slate-800 border-slate-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer active:scale-95'}`;
  const crumb = (label: string, active: boolean, to: 'year' | 'month' | 'day', enabled: boolean) => (
    <button
      type="button"
      disabled={!enabled}
      onClick={() => { b.playTap(); setView(to); }}
      className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${active ? 'bg-blue-600 text-white border-blue-600' : enabled ? 'bg-blue-50 text-blue-700 border-blue-200 cursor-pointer' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
    >
      {label}
    </button>
  );

  return (
    <Modal onClose={onClose} wide>
      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        {crumb(year ? String(year) : d.year, view === 'year', 'year', true)}
        <ChevronRight className="w-4 h-4 text-slate-400" />
        {crumb(month >= 0 ? d.months[month] : d.month, view === 'month', 'month', !!year)}
        <ChevronRight className="w-4 h-4 text-slate-400" />
        {crumb(d.day, view === 'day', 'day', !!year && month >= 0)}
      </div>

      {view === 'year' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">{d.year}</h3>
          <div className="flex flex-wrap justify-center gap-1.5">
            {decades.map((x) => (
              <button
                key={x}
                type="button"
                onClick={() => { b.playTap(); setDecade(x); }}
                className={`px-3 py-2 rounded-lg text-sm font-bold border cursor-pointer ${decade === x ? 'bg-blue-100 text-blue-800 border-blue-400' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
              >
                {x}s
              </button>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {years.map((y) => (
              <button key={y} type="button" onClick={() => { b.playTap(); setYear(y); if (month >= 0 && future(y, month)) setMonth(-1); setView('month'); }} className={big(y === year)}>
                {y}
              </button>
            ))}
          </div>
        </div>
      )}

      {view === 'month' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">{d.month}</h3>
          <div className="grid grid-cols-3 gap-2">
            {d.months.map((m, i) => {
              const off = future(year, i);
              return (
                <button key={m} type="button" disabled={off} onClick={() => { b.playTap(); setMonth(i); setView('day'); }} className={big(i === month, off)}>
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {view === 'day' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">{d.day}</h3>
          <div className="grid grid-cols-7 gap-1.5">
            {d.weekdays.map((w) => (
              <div key={w} className="text-[11px] font-bold text-slate-400 uppercase py-1">{w}</div>
            ))}
            {Array.from({ length: firstDow }, (_, i) => <div key={`b${i}`} />)}
            {Array.from({ length: daysIn }, (_, i) => {
              const day = i + 1;
              const off = future(year, month, day);
              const on = !!init && init[0] === year && init[1] - 1 === month && init[2] === day;
              return (
                <button
                  key={day}
                  type="button"
                  disabled={off}
                  onClick={() => { b.playSuccess(); onPick(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`); }}
                  className={big(on, off).replace('h-14', 'h-12')}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------ hold to view */

/** NEW (problem 1): a value is shown only while the visitor presses the button. */
export function HoldToView({ shown, masked, label }: { shown: string; masked: string; label: string }) {
  const [on, setOn] = useState(false);
  const off = () => setOn(false);
  return (
    <span className="flex items-center justify-between gap-2 w-full">
      <span className={on ? 'text-blue-700' : ''}>{on ? shown : masked}</span>
      <button
        type="button"
        onPointerDown={(e) => { e.preventDefault(); setOn(true); }}
        onPointerUp={off}
        onPointerLeave={off}
        onPointerCancel={off}
        onContextMenu={(e) => e.preventDefault()}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold shrink-0 cursor-pointer select-none ${on ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-700 border-blue-200'}`}
      >
        {on ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        {label}
      </button>
    </span>
  );
}

/* ------------------------------------------------------- fingerprint pad */

/** Fingerprint sensor from the original E2 screen; also used to unlock the privacy shield. */
export function FingerprintSensor({ onMatched, idleText, scanningText, matchedText }: { onMatched: () => void; idleText: string; scanningText: string; matchedText: string }) {
  const [st, setSt] = useState<'idle' | 'scanning' | 'success'>('idle');
  const scan = () => {
    if (st !== 'idle') return;
    b.playTap();
    setSt('scanning');
    window.setTimeout(() => {
      b.playBeep();
      setSt('success');
      b.playSuccess();
      window.setTimeout(onMatched, 700);
    }, 1800);
  };
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={scan}
        className={`w-36 h-44 mx-auto rounded-3xl border-3 flex flex-col items-center justify-center cursor-pointer transition-all shadow-md relative overflow-hidden select-none active:scale-95 ${st === 'success' ? 'border-emerald-500 bg-emerald-50 text-emerald-600 shadow-emerald-200' : st === 'scanning' ? 'border-cyan-500 bg-slate-950 text-cyan-400 shadow-cyan-200' : 'border-blue-400 bg-gradient-to-b from-blue-50 to-slate-100 text-blue-600 hover:border-blue-600'}`}
      >
        {st === 'scanning' && <div className="absolute inset-x-0 h-1.5 bg-gradient-to-r from-cyan-400 via-white to-cyan-400 shadow-[0_0_15px_#38bdf8] animate-bounce top-1/3" />}
        {st === 'success' ? <Check className="w-16 h-16 stroke-[3] animate-scale-in" /> : <FingerprintPattern className={`w-20 h-20 ${st === 'scanning' ? 'animate-pulse' : ''}`} />}
        <span className="text-[11px] font-bold mt-2 uppercase tracking-wider">{st === 'success' ? 'MATCHED' : st === 'scanning' ? 'SCANNING...' : 'TOUCH SENSOR'}</span>
      </button>
      <div className="text-sm font-bold text-slate-800">{st === 'success' ? matchedText : st === 'scanning' ? scanningText : idleText}</div>
    </div>
  );
}

/* ----------------------------------------------------------- signature */

export function SignaturePad({
  initialSignature,
  onSave,
  clearLabel,
  sampleLabel,
  hintText,
}: {
  initialSignature: string | null;
  onSave: (d: string | null) => void;
  clearLabel: string;
  sampleLabel: string;
  hintText: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasInk, setHasInk] = useState(false);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = ref.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * c.width) / r.width, y: ((e.clientY - r.top) * c.height) / r.height };
  };
  const pen = () => {
    const g = ref.current!.getContext('2d')!;
    g.strokeStyle = '#1e3a8a';
    g.lineWidth = 3;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    return g;
  };
  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    ref.current!.setPointerCapture(e.pointerId);
    const p = pos(e);
    const g = pen();
    g.beginPath();
    g.moveTo(p.x, p.y);
    setDrawing(true);
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const p = pos(e);
    const g = pen();
    g.lineTo(p.x, p.y);
    g.stroke();
    setHasInk(true);
  };
  const up = useCallback(() => {
    if (!drawing) return;
    setDrawing(false);
    onSave(ref.current!.toDataURL());
  }, [drawing, onSave]);

  useEffect(() => {
    const c = ref.current;
    if (c && initialSignature) {
      const img = new Image();
      img.onload = () => {
        c.getContext('2d')?.drawImage(img, 0, 0);
        setHasInk(true);
      };
      img.src = initialSignature;
    }
    // Only when the pad first appears.
  }, []);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full max-w-2xl bg-white border-2 border-dashed border-blue-400 rounded-2xl p-2 shadow-inner overflow-hidden">
        <canvas
          ref={ref}
          width={600}
          height={220}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
          className="w-full h-48 sm:h-56 bg-slate-50/50 rounded-xl cursor-crosshair touch-none"
        />
        {!hasInk && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 gap-2">
            <PenTool className="w-8 h-8 text-blue-300 animate-bounce" />
            <span className="text-base font-medium text-slate-400">{hintText}</span>
          </div>
        )}
        {hasInk && (
          <div className="absolute top-4 right-4 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs">
            <CircleCheckBig className="w-3.5 h-3.5" />
            <span>Captured</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between w-full max-w-2xl mt-3 px-1">
        <button
          type="button"
          onClick={() => {
            b.playTap();
            const c = ref.current!;
            c.getContext('2d')!.clearRect(0, 0, c.width, c.height);
            setHasInk(false);
            onSave(null);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 hover:border-red-400 text-red-600 hover:bg-red-50 text-xs font-semibold transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{clearLabel}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            b.playTap();
            const c = ref.current!;
            const g = pen();
            g.clearRect(0, 0, c.width, c.height);
            g.lineWidth = 3.5;
            g.beginPath();
            g.moveTo(60, 140);
            g.quadraticCurveTo(80, 50, 110, 60);
            g.quadraticCurveTo(120, 140, 140, 130);
            g.bezierCurveTo(160, 110, 180, 80, 210, 115);
            g.quadraticCurveTo(240, 140, 270, 100);
            g.quadraticCurveTo(300, 70, 330, 130);
            g.bezierCurveTo(360, 160, 420, 40, 450, 120);
            g.moveTo(70, 155);
            g.quadraticCurveTo(250, 175, 480, 145);
            g.moveTo(495, 150);
            g.arc(495, 150, 2.5, 0, Math.PI * 2);
            g.moveTo(515, 150);
            g.arc(515, 150, 2.5, 0, Math.PI * 2);
            g.stroke();
            setHasInk(true);
            onSave(c.toDataURL());
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 hover:border-blue-400 text-blue-700 hover:bg-blue-50 text-xs font-semibold transition-all cursor-pointer"
        >
          <PenTool className="w-3.5 h-3.5 text-blue-600" />
          <span>{sampleLabel}</span>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ countdown */

export function useCountdown(seconds: number, onDone: () => void, speed = 1, running = true) {
  const [left, setLeft] = useState(seconds);
  const cb = useRef(onDone);
  cb.current = onDone;
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          window.clearInterval(id);
          window.setTimeout(() => cb.current(), 0);
          return 0;
        }
        return l - 1;
      });
    }, 1000 / speed);
    return () => window.clearInterval(id);
  }, [running, speed]);
  return left;
}
