import { useEffect, useState } from 'react';
import { ArrowRight, Check, CircleAlert, Clock, CreditCard, Droplets, Eye, FingerprintPattern, Hand, House, Lock, Printer, RotateCw, Scan, ScanLine, ShieldCheck, Smartphone, Timer, Users, X } from 'lucide-react';
import { b } from '../../lib/sound';
import { useApp } from '../ctx';
import { Footer, FingerprintSensor, Keypad, MinorBanner, Modal, Page, PrivacyBadge, Title, btnPrimary, btnPrimaryDisabled, useDigits, useDocInfo } from '../ui';
import { ekycFor, fingerprintInsteadOfOtp, fixOf, isMinor, maskPan, type Fix } from '../state';
import { PhoneScanModal } from './Start';

/* ================================================================ 02 */

export function Aadhaar() {
  const { t, user, update, go } = useApp();
  const d = t.s2;
  const [peek, setPeek] = useState(false);
  const [finger, setFinger] = useState(false);
  const v = user.aadhaarNumber;
  const keys = useDigits(v, (n) => update({ aadhaarNumber: n }), 12);
  const ok = v.length === 12;
  const useFinger = fingerprintInsteadOfOtp(user);

  const digits = () => {
    const padded = v.padEnd(12, ' ');
    return [0, 1, 2].map((g) => (
      <span key={g} className="tracking-widest mx-1.5 font-mono">
        {padded.slice(g * 4, g * 4 + 4).split('').map((c, i) => {
          const idx = g * 4 + i;
          if (idx >= v.length) return <span key={i} className="text-slate-300">·</span>;
          return <span key={i}>{peek || idx >= 8 ? c : '•'}</span>;
        })}
      </span>
    ));
  };

  return (
    <Page
      footer={
        <Footer onBack={() => go('01-before-start')}>
          <button
            disabled={!ok}
            onClick={() => {
              b.playSuccess();
              if (useFinger) setFinger(true);
              else go('03-otp');
            }}
            className={ok ? btnPrimary.replace('px-8', 'px-7') : btnPrimaryDisabled}
          >
            {useFinger && <FingerprintPattern className="w-4 h-4" />}
            <span>{useFinger ? t.x.missing.fixes.mobile.fingerprint.btn : d.sendOtpBtn}</span>
            {!useFinger && <ArrowRight className="w-4 h-4" />}
          </button>
        </Footer>
      }
    >
      <Title badge="2" title={d.title} sub={useFinger ? t.x.missing.fingerBody : d.sub} right={<PrivacyBadge />} />
      <MinorBanner step="guardian" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl p-5 md:p-6 border-2 border-blue-500 shadow-sm relative">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{d.label}</label>
            <div className="flex items-center justify-between">
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center select-none py-1">{digits()}</div>
              {/* Privacy: press and hold to see the digits; they hide again on release. */}
              <button
                type="button"
                onPointerDown={(e) => { e.preventDefault(); setPeek(true); }}
                onPointerUp={() => setPeek(false)}
                onPointerLeave={() => setPeek(false)}
                onPointerCancel={() => setPeek(false)}
                onContextMenu={(e) => e.preventDefault()}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer shadow-2xs select-none ${peek ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <Eye className={`w-4 h-4 ${peek ? 'text-white' : 'text-blue-600'}`} />
                <span>{t.x.common.hold}</span>
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-3 font-medium">{d.privacyNote}</p>
            <p className="text-[11px] text-slate-400 mt-1">{t.x.common.demoDigits(12)}</p>
          </div>
          {!useFinger && (
            <div>
              <div className="text-sm font-bold text-slate-700 mb-3">{d.orAnotherWay}</div>
              <button type="button" onClick={() => { b.playTap(); go('04-scan-cards'); }} className="w-full bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-blue-400 p-4 rounded-xl text-left transition-all flex items-start gap-3 cursor-pointer group shadow-2xs">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"><Scan className="w-5 h-5" /></div>
                <div>
                  <div className="text-sm font-bold text-slate-900 group-hover:text-blue-700">{d.scanCardTitle}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{d.scanCardSub}</div>
                </div>
              </button>
            </div>
          )}
          <div className="bg-slate-100/90 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-slate-600 border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{d.clearNote}</span>
          </div>
        </div>
        <div className="lg:col-span-5 flex justify-center">
          <Keypad {...keys} clearLabel={t.s9.clearBtn || 'Clear'} />
        </div>
      </div>
      {finger && (
        <Modal onClose={() => setFinger(false)}>
          <h3 className="text-lg font-bold text-slate-900 flex items-center justify-center gap-2"><FingerprintPattern className="w-5 h-5 text-blue-600" /> {t.e2.scannerModalTitle}</h3>
          <FingerprintSensor
            onMatched={() => { update({ verifiedVia: 'fingerprint' }); go('04-scan-cards'); }}
            idleText={t.e2.scannerModalSub}
            scanningText={t.e2.scannerScanning}
            matchedText={t.e2.scannerSuccess}
          />
        </Modal>
      )}
    </Page>
  );
}

/* ================================================================ 03 */

export function Otp() {
  const { t, user, update, go, speed } = useApp();
  const l = t.s3;
  // The OTP is kept only on this screen; it is never stored with the visitor's data.
  const [otp, setOtp] = useState('');
  const [left, setLeft] = useState(24);
  const keys = useDigits(otp, setOtp, 6);
  useEffect(() => {
    if (left <= 0) return;
    const id = window.setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000 / speed);
    return () => window.clearInterval(id);
  }, [left, speed]);
  const ok = otp.length === 6;

  return (
    <Page
      footer={
        <Footer onBack={() => go('02-aadhaar')}>
          <button disabled={!ok} onClick={() => { b.playSuccess(); update({ verifiedVia: 'otp' }); go('04-scan-cards'); }} className={ok ? btnPrimary.replace('px-8', 'px-7') : btnPrimaryDisabled}>
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{l.verifyOtpBtn}</span>
          </button>
        </Footer>
      }
    >
      <Title
        badge="2"
        title={l.title}
        right={<PrivacyBadge />}
        sub={
          <>
            {l.sub.split(':')[0]}: <span className="font-semibold text-slate-800">{ekycFor(user).mobile}</span>
          </>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">{l.label}</label>
            <div className="flex items-center gap-2.5 sm:gap-3.5 mb-5">
              {[0, 1, 2, 3, 4, 5].map((n) => {
                const c = otp[n] || '';
                const cur = otp.length === n;
                return (
                  <div key={n} className={`w-12 h-16 sm:w-14 sm:h-20 rounded-xl flex items-center justify-center text-3xl font-extrabold border-2 transition-all ${cur ? 'border-blue-600 bg-blue-50/40 shadow-xs' : c ? 'border-blue-300 bg-white text-slate-900' : 'border-slate-200 bg-slate-50/50 text-slate-300'}`}>
                    {c}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <Clock className="w-4 h-4 text-slate-400" />
              {left > 0 ? (
                <span>{l.resendIn} 00:{left < 10 ? `0${left}` : left}</span>
              ) : (
                <button type="button" onClick={() => { b.playTap(); setLeft(30); setOtp(''); }} className="text-blue-600 font-bold hover:underline cursor-pointer">
                  {l.resendNow}
                </button>
              )}
              <span className="ml-auto text-[11px] text-slate-400">{t.x.common.demoDigits(6)}</span>
            </div>
          </div>
          <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700 mt-0.5"><Smartphone className="w-5 h-5" /></div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{l.noPhoneTitle}</h3>
                <p className="text-xs text-slate-600 mt-0.5">{l.noPhoneSub}</p>
              </div>
            </div>
            <button type="button" onClick={() => { b.playTap(); go('E2-otp-problem'); }} className="px-4 py-2 bg-white hover:bg-slate-50 border border-blue-400 text-blue-700 text-xs font-bold rounded-xl shadow-2xs whitespace-nowrap cursor-pointer transition-all active:scale-95">
              {l.seeOptions}
            </button>
          </div>
        </div>
        <div className="lg:col-span-5 flex justify-center">
          <Keypad {...keys} clearLabel={t.s9.clearBtn || 'Clear'} />
        </div>
      </div>
    </Page>
  );
}

/* ================================================================ 04 */

export function ScanCards() {
  const { t, user, go, speed } = useApp();
  const o = t.s4;
  const info = useDocInfo();
  const aadhaarFix = fixOf(user, 'aadhaar');
  const panFix = fixOf(user, 'pan');
  const later = aadhaarFix === 'later' || panFix === 'later';
  const minor = isMinor(user);
  const [panDone, setPanDone] = useState(!!panFix);
  useEffect(() => {
    if (panDone) return;
    const id = window.setTimeout(() => {
      b.playBeep();
      setPanDone(true);
    }, 2800 / speed);
    return () => window.clearTimeout(id);
  }, [panDone, speed]);

  const okRow = (title: string, sub: string) => (
    <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex items-center gap-4 shadow-2xs">
      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs"><Check className="w-5 h-5 stroke-[3]" /></div>
      <div className="flex-1">
        <div className="text-sm font-bold text-slate-900">{title}</div>
        <div className="text-xs text-slate-600 mt-0.5">{sub}</div>
      </div>
      <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full">OK</span>
    </div>
  );
  // A card the visitor will upload later is not scanned today.
  const laterRow = (title: string) => (
    <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-center gap-4 shadow-2xs">
      <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs"><Clock className="w-5 h-5" /></div>
      <div className="flex-1">
        <div className="text-sm font-bold text-slate-900">{title}</div>
        <div className="text-xs text-slate-600 mt-0.5">{t.x.scan.later}</div>
      </div>
    </div>
  );
  const fixRow = (title: string, fix: Fix) => (fix === 'later' ? laterRow(title) : okRow(`${title} — ${t.x.missing.resolvedBy[fix]}`, t.x.scan.uploaded));
  const last4 = user.aadhaarNumber.slice(-4) || '7714';

  return (
    <Page
      footer={
        <Footer onBack={() => go(user.verifiedVia === 'fingerprint' ? '02-aadhaar' : '03-otp')}>
          <button type="button" onClick={() => { b.playTap(); go('E3-scanner-error'); }} className="px-4 py-3 rounded-xl border border-blue-300 hover:border-blue-400 text-blue-700 bg-white hover:bg-blue-50/50 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs">
            {o.scannerTroubleBtn}
          </button>
          {later ? (
            // A card is not here today: save the application and print the QR return slip.
            <button disabled={!panDone} onClick={() => { b.playTap(); go('E7-return-pass'); }} className={panDone ? btnPrimary.replace('px-8', 'px-7') : btnPrimaryDisabled}>
              <Printer className="w-4 h-4" />
              <span>{t.x.scan.printSlip}</span>
            </button>
          ) : (
            <button disabled={!panDone} onClick={() => { b.playSuccess(); go('05-checking'); }} className={panDone ? btnPrimary.replace('px-8', 'px-7') : btnPrimaryDisabled}>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{o.continueBtn}</span>
            </button>
          )}
        </Footer>
      }
    >
      <Title badge="2" title={o.title} sub={o.sub} right={<PrivacyBadge />} />
      <MinorBanner step="guardian" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-4">
          <div className="relative bg-slate-900 rounded-2xl p-6 text-white overflow-hidden shadow-md border border-slate-800">
            {!panDone && <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-sky-200 to-blue-400 shadow-[0_0_15px_#38bdf8] animate-pulse top-1/2 -translate-y-1/2" />}
            <div className="flex items-center justify-center gap-3 py-6 relative z-10">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700"><ScanLine className="w-8 h-8 text-cyan-400 animate-pulse" /></div>
              <div className="text-center sm:text-left">
                <div className="text-sm font-semibold text-slate-300">{o.scannerGlass}</div>
                <div className="text-xs text-slate-500 mt-0.5">Hardware Scanner Slot · Active sensor</div>
              </div>
            </div>
          </div>
          {aadhaarFix
            ? fixRow(info.aadhaar.title, aadhaarFix)
            : user.verifiedVia === 'fingerprint'
              ? okRow(`${info.aadhaar.title} — ${t.x.missing.resolvedBy.fingerprint}`, t.x.scan.skipped)
              : okRow(minor ? `${info.aadhaar.title} ✓` : o.aadhaarScanned, `${ekycFor(user).fullName} · ends ${last4}`)}
          {panFix
            ? fixRow(info.pan.title, panFix)
            : panDone
              ? okRow(minor ? `${info.pan.title} ✓` : o.panScanned, `${maskPan(ekycFor(user).panNumber)} · ${o.panSubDone}`)
              : (
                <div className="bg-blue-50/70 border border-blue-300 rounded-2xl p-4 flex items-center gap-4 shadow-2xs animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs"><CreditCard className="w-5 h-5" /></div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-blue-900">{o.panPrompt}</div>
                    <div className="text-xs text-blue-700 mt-0.5">{o.panSub}</div>
                  </div>
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
        </div>
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-5">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">{o.howToPlace}</h2>
          <ul className="space-y-4">
            {[o.instruction1, o.instruction2, o.instruction3].map((s, n) => (
              <li key={n} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">{n + 1}</span>
                <span className="text-sm font-medium text-slate-700 leading-snug">{s}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-start gap-2.5 text-xs text-slate-500 font-medium">
              <CircleAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>{o.notReadingTip}</span>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}

/* ================================================================ 05 */

export function Checking() {
  const { t, user, update, go, clearAll, help, speed } = useApp();
  const i = t.s5;
  const [a, setA] = useState(false);
  const [s, setS] = useState(false);
  const [l, setL] = useState(false);
  const finish = () => {
    update({ ...ekycFor(user), aadhaarNumber: user.aadhaarNumber || '432187657714' });
    go('05b-fingerprint');
  };
  useEffect(() => {
    const t1 = window.setTimeout(() => { setA(true); b.playTap(); }, 1200 / speed);
    const t2 = window.setTimeout(() => { setS(true); b.playTap(); }, 2500 / speed);
    const t3 = window.setTimeout(() => { setL(true); b.playSuccess(); }, 4000 / speed);
    const t4 = window.setTimeout(finish, 4800 / speed);
    return () => [t1, t2, t3, t4].forEach(window.clearTimeout);
  }, []);
  const row = (done: boolean, label: string, spin = false) => (
    <div className="flex items-center gap-3">
      {done ? (
        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><Check className="w-4 h-4 stroke-[3]" /></div>
      ) : spin ? (
        <div className="w-6 h-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin shrink-0" />
      ) : (
        <div className="w-6 h-6 rounded-full border-2 border-slate-200 shrink-0" />
      )}
      <span className={`text-sm sm:text-base font-semibold ${done ? 'text-slate-800' : spin ? 'text-blue-600' : 'text-slate-400'}`}>{label}</span>
    </div>
  );
  return (
    <div className="flex-1 flex flex-col justify-between bg-slate-50 overflow-y-auto">
      <div className="max-w-6xl w-full mx-auto p-6 md:p-8 space-y-6">
        <Title badge="2" title={i.title} sub={i.sub} />
        <div className="max-w-xl mx-auto w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-sm flex flex-col items-center text-center space-y-6 my-4">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-blue-600"><RotateCw className="w-7 h-7 animate-spin" /></div>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">{i.doNotRemove}</h2>
          <div className="w-full space-y-3.5 text-left max-w-sm pt-2">
            {row(a, i.check1)}
            {row(s, i.check2)}
            {row(l, i.check3, true)}
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-4">
            <div className="bg-blue-600 h-full transition-all duration-700 ease-out rounded-full" style={{ width: l ? '100%' : s ? '65%' : a ? '35%' : '15%' }} />
          </div>
          <button type="button" onClick={() => { b.playSuccess(); finish(); }} className="text-xs text-slate-400 hover:text-blue-600 font-medium cursor-pointer">
            Skip waiting →
          </button>
        </div>
      </div>
      <footer className="w-full bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between">
        <button onClick={() => { b.playTap(); help(); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100/50 text-sm font-semibold transition-all cursor-pointer shadow-2xs">
          {t.needHelp}
        </button>
        <button onClick={() => { b.playTap(); clearAll(); }} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold transition-all cursor-pointer">
          <X className="w-4 h-4" />
          <span>{t.cancelAndClear}</span>
        </button>
      </footer>
    </div>
  );
}

/* ================================================================ 05b */

type FingerPhase = 'intro' | 'scan' | 'matching' | 'done';

/**
 * NEW: fingerprint match against the Aadhaar biometrics from eKYC (replaces the
 * camera face check). The scan goes to UIDAI for matching; nothing is kept on the
 * kiosk. The same finger opens the account from the home screen next visit.
 */
export function FingerprintCheck() {
  const { t, update, go, speed } = useApp();
  const f = t.x.finger;
  const [phase, setPhase] = useState<FingerPhase>('intro');
  const [captured, setCaptured] = useState(0);
  const live = phase === 'scan' || phase === 'matching';
  const prompt = captured < 35 ? 0 : captured < 75 ? 1 : 2;

  useEffect(() => {
    if (phase !== 'scan') return;
    const id = window.setInterval(() => {
      setCaptured((c) => {
        const n = Math.min(100, c + 4);
        if (n >= 100) {
          window.clearInterval(id);
          window.setTimeout(() => { b.playBeep(); setPhase('matching'); }, 0);
        }
        return n;
      });
    }, 180 / speed);
    return () => window.clearInterval(id);
  }, [phase, speed]);

  useEffect(() => {
    if (phase !== 'matching') return;
    const id = window.setTimeout(() => {
      b.playSuccess();
      update({ fingerprintVerified: true });
      setPhase('done');
    }, 2000 / speed);
    return () => window.clearTimeout(id);
  }, [phase, speed, update]);

  const start = () => {
    if (phase !== 'intro') return;
    b.playTap();
    setCaptured(0);
    setPhase('scan');
  };

  const frame = phase === 'done' ? 'border-emerald-500 bg-emerald-600' : phase === 'matching' ? 'border-blue-500 animate-pulse bg-slate-950' : phase === 'scan' ? 'border-cyan-400 bg-slate-950' : 'border-slate-500 border-dashed bg-slate-800 hover:border-blue-400';
  const tipIcons = [Droplets, Hand, Timer];

  return (
    <Page
      footer={
        <Footer>
          {phase === 'done' ? (
            <button onClick={() => { b.playSuccess(); go('06-confirm-details'); }} className={btnPrimary}>
              <Check className="w-4 h-4 stroke-[3]" /> <span>{t.x.common.continue}</span>
            </button>
          ) : (
            <button disabled={phase !== 'intro'} onClick={start} className={phase === 'intro' ? btnPrimary : btnPrimaryDisabled}>
              <FingerprintPattern className="w-4 h-4" /> <span>{f.start}</span>
            </button>
          )}
        </Footer>
      }
    >
      <Title badge="2" title={f.title} sub={f.sub} right={<PrivacyBadge />} />
      <MinorBanner step="guardian" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 relative bg-slate-900 rounded-3xl p-6 flex flex-col items-center justify-center gap-5 min-h-[22rem] overflow-hidden shadow-md">
          {live && (
            <span className="absolute top-4 left-4 flex items-center gap-1.5 text-[11px] font-bold text-white bg-cyan-600/90 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> {f.readerOn}
            </span>
          )}
          <button
            type="button"
            onClick={start}
            aria-label={f.start}
            className={`relative w-52 h-60 sm:w-56 sm:h-64 rounded-[2.5rem] border-4 overflow-hidden flex items-center justify-center transition-colors select-none ${frame} ${phase === 'intro' ? 'cursor-pointer active:scale-95' : 'cursor-default'}`}
          >
            {phase === 'done' ? (
              <Check className="w-28 h-28 text-white stroke-[3] animate-scale-in" />
            ) : (
              <>
                <FingerprintPattern className="w-36 h-36 text-slate-600" />
                <FingerprintPattern className="absolute w-36 h-36 text-cyan-300 transition-[clip-path] duration-200" style={{ clipPath: `inset(${100 - captured}% 0 0 0)` }} />
              </>
            )}
            {phase === 'scan' && <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-white to-cyan-400 shadow-[0_0_15px_#38bdf8] animate-bounce top-1/3" />}
          </button>
          {phase === 'scan' && (
            <div className="w-full max-w-xs bg-slate-700 h-2 rounded-full overflow-hidden">
              <div className="bg-cyan-400 h-full rounded-full transition-all duration-200" style={{ width: `${captured}%` }} />
            </div>
          )}
          <div className="text-center min-h-14">
            {phase === 'intro' && <p className="text-base font-semibold text-slate-300">{f.prompts[0]}</p>}
            {phase === 'scan' && <p className="text-xl sm:text-2xl font-extrabold text-white">{f.prompts[prompt]}</p>}
            {phase === 'matching' && (
              <p className="flex items-center justify-center gap-2 text-lg font-bold text-blue-200">
                <span className="w-5 h-5 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" /> {f.matching}
              </p>
            )}
            {phase === 'done' && (
              <>
                <p className="text-2xl font-extrabold text-emerald-400">{f.success}</p>
                <p className="text-sm font-medium text-slate-300 mt-1">{f.successSub}</p>
              </>
            )}
          </div>
        </div>
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <ul className="space-y-4">
              {f.tips.map((tip, n) => {
                const Icon = tipIcons[n];
                return (
                  <li key={tip} className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Icon className="w-5 h-5" /></span>
                    <span className="text-sm font-semibold text-slate-700 leading-snug">{tip}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
            <Lock className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-emerald-800 font-medium leading-relaxed">{f.privacy}</p>
          </div>
          <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
            <House className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-blue-800 font-medium leading-relaxed">{f.nextTime}</p>
          </div>
        </div>
      </div>
    </Page>
  );
}

/* ================================================================ E2 */

export function OtpProblem() {
  const { t, user, update, go, help } = useApp();
  const o = t.e2;
  const staff = t.x.missing.fixes.mobile.staff;
  const [finger, setFinger] = useState(false);
  return (
    <Page footer={<Footer onBack={() => go('03-otp')} />}>
      <Title badge="!" tone="amber" title={o.title} sub={o.sub} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch pt-2">
        <div className="bg-white rounded-3xl p-7 border-2 border-blue-500 shadow-md flex flex-col justify-between space-y-6 relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs"><FingerprintPattern className="w-8 h-8" /></div>
              <span className="text-xs font-bold text-blue-700 bg-blue-100/70 px-3 py-1 rounded-full">{o.c1Badge}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{o.c1Title}</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">{o.c1Sub}</p>
            </div>
          </div>
          <button type="button" onClick={() => { b.playTap(); setFinger(true); }} className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95">
            <FingerprintPattern className="w-5 h-5" />
            <span>{o.c1Btn}</span>
          </button>
        </div>
        <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6 hover:border-slate-300 transition-all">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shadow-2xs"><Users className="w-8 h-8 text-blue-600" /></div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{staff.title}</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">{staff.sub}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { b.playTap(); update({ docs: { ...user.docs, mobile: { have: false, fix: 'staff' } } }); help(); }}
            className="w-full py-4 px-6 rounded-2xl border-2 border-slate-300 hover:border-blue-500 text-slate-800 hover:text-blue-700 bg-white hover:bg-blue-50/50 text-sm font-bold shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
          >
            <Users className="w-5 h-5 text-slate-600" />
            <span>{staff.btn}</span>
          </button>
        </div>
      </div>
      {finger && (
        <Modal onClose={() => setFinger(false)}>
          <h3 className="text-lg font-bold text-slate-900 flex items-center justify-center gap-2"><FingerprintPattern className="w-5 h-5 text-blue-600" /> {o.scannerModalTitle}</h3>
          <FingerprintSensor
            onMatched={() => { update({ verifiedVia: 'fingerprint' }); go('04-scan-cards'); }}
            idleText={o.scannerModalSub}
            scanningText={o.scannerScanning}
            matchedText={o.scannerSuccess}
          />
        </Modal>
      )}
    </Page>
  );
}

/* ================================================================ E3 */

export function ScannerError() {
  const { t, user, update, go, help } = useApp();
  const o = t.e3;
  const phone = t.x.missing.fixes.pan.phone;
  const [scan, setScan] = useState(false);
  const card = 'bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col justify-between space-y-5 hover:border-blue-400 transition-all';
  return (
    <Page footer={<Footer onBack={() => go('04-scan-cards')} />}>
      <Title badge="!" tone="amber" title={o.title} sub={o.sub} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={card}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><RotateCw className="w-5 h-5" /></div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">{o.c1Badge}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">{o.c1Title}</h2>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">{o.c1Sub}</p>
          </div>
          <button type="button" onClick={() => { b.playTap(); go('04-scan-cards'); }} className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 flex items-center justify-center gap-1.5">
            <RotateCw className="w-3.5 h-3.5" /> <span>{o.c1Btn}</span>
          </button>
        </div>
        <div className={card}>
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Users className="w-5 h-5" /></div>
            <h2 className="text-lg font-bold text-slate-900">{o.c2Title}</h2>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">{o.c2Sub}</p>
          </div>
          <button type="button" onClick={() => { b.playTap(); help(); }} className="w-full py-3 px-4 rounded-xl border border-blue-300 hover:border-blue-400 text-blue-700 bg-white hover:bg-blue-50 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95">
            {o.c2Btn}
          </button>
        </div>
        <div className={card}>
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Smartphone className="w-5 h-5" /></div>
            <h2 className="text-lg font-bold text-slate-900">{phone.title}</h2>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">{phone.sub}</p>
          </div>
          <button type="button" onClick={() => { b.playTap(); setScan(true); }} className="w-full py-3 px-4 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 flex items-center justify-center gap-1.5">
            <ScanLine className="w-4 h-4 text-blue-600" /> <span>{phone.btn}</span>
          </button>
        </div>
      </div>
      {scan && (
        <PhoneScanModal
          doc="pan"
          onClose={() => setScan(false)}
          onDone={() => {
            update({ docs: { ...user.docs, pan: { have: false, fix: 'phone' } } });
            go('04-scan-cards');
          }}
        />
      )}
    </Page>
  );
}
