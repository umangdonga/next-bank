import { useEffect, useState } from 'react';
import { ArrowRight, Check, Clock, FileText, PenLine, Printer, ScanLine } from 'lucide-react';
import { b } from '../../lib/sound';
import { useApp } from '../ctx';
import { DateField, Footer, MinorBanner, Page, PrivacyBadge, Title, btnPrimary, btnPrimaryDisabled } from '../ui';
import { ageOf, fixOf, type ChildData } from '../state';

/* ================================================================ 06m */

/**
 * NEW, minor accounts only: after the guardian is verified, the child's details and
 * proof of age (birth certificate or the child's Aadhaar).
 */
export function ChildDetails() {
  const { t, user, update, go, speed } = useApp();
  const m = t.x.minor;
  const c = user.child;
  const fix = fixOf(user, 'child');
  const [scan, setScan] = useState<'idle' | 'scanning'>('idle');
  const set = (p: Partial<ChildData>) => update({ child: { ...c, ...p } });
  const age = c.dob ? ageOf(c.dob) : null;
  const tooOld = age != null && age >= 18;
  const docOk = c.docScanned || fix === 'phone';
  const ok = c.name.trim().length > 1 && !!c.dob && !tooOld && !!c.gender && !!c.relation && docOk;

  useEffect(() => {
    if (scan !== 'scanning') return;
    const id = window.setTimeout(() => {
      b.playBeep();
      setScan('idle');
      update({ child: { ...c, docScanned: true } });
    }, 2500 / speed);
    return () => window.clearTimeout(id);
  }, [scan]);

  const chip = (on: boolean) =>
    `h-11 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer ${on ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/40'}`;
  const label = 'block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2';

  return (
    <Page
      footer={
        <Footer onBack={() => go('06-confirm-details')}>
          {fix === 'later' ? (
            <button onClick={() => { b.playTap(); go('E7-return-pass'); }} className={btnPrimary}>
              <Printer className="w-4 h-4" /> <span>{t.x.scan.printSlip}</span>
            </button>
          ) : (
            <button disabled={!ok} onClick={() => { b.playSuccess(); go('07-more-details'); }} className={ok ? btnPrimary : btnPrimaryDisabled}>
              <span>{t.s7.nextBtn}</span> <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </Footer>
      }
    >
      <Title badge="3" title={m.childTitle} sub={m.childSub} right={<PrivacyBadge />} />
      <MinorBanner step="child" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-5">
          <div>
            <label className={label}>{m.childName}</label>
            <div className="relative">
              <input
                type="text"
                value={c.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder={m.childNamePh}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-bold text-slate-900 text-sm outline-hidden select-text"
              />
              <PenLine className="w-4 h-4 text-slate-400 absolute right-4 top-4 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className={label}>{m.childDob}</label>
            <DateField value={c.dob} onChange={(v) => set({ dob: v })} startDecade={2010} />
            {age != null && <p className={`text-xs font-semibold mt-1.5 ${tooOld ? 'text-red-600' : 'text-slate-500'}`}>{tooOld ? m.under18 : m.ageYears(age)}</p>}
          </div>
          <div>
            <label className={label}>{m.gender}</label>
            <div className="grid grid-cols-3 gap-2">
              {(['boy', 'girl', 'other'] as const).map((g) => (
                <button key={g} type="button" onClick={() => { b.playTap(); set({ gender: g }); }} className={chip(c.gender === g)}>
                  {c.gender === g && <Check className="w-3.5 h-3.5 stroke-[3]" />} {m.genders[g]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={label}>{m.relation}</label>
            <div className="grid grid-cols-3 gap-2">
              {(['father', 'mother', 'guardian'] as const).map((r) => (
                <button key={r} type="button" onClick={() => { b.playTap(); set({ relation: r }); }} className={chip(c.relation === r)}>
                  {c.relation === r && <Check className="w-3.5 h-3.5 stroke-[3]" />} {m.relations[r]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" /> {m.docTitle}</h2>
          {fix === 'phone' ? (
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 text-sm font-bold text-emerald-800 flex items-center gap-2">
              <Check className="w-5 h-5 stroke-[3]" /> {t.x.scan.uploaded}
            </div>
          ) : fix === 'later' ? (
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 text-sm font-semibold text-amber-900 flex items-start gap-2">
              <Clock className="w-5 h-5 text-amber-600 shrink-0" /> {t.x.scan.later}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {(['birth', 'aadhaar'] as const).map((d) => (
                  <button key={d} type="button" disabled={c.docScanned} onClick={() => { b.playTap(); set({ docType: d }); }} className={chip(c.docType === d)}>
                    {m.docTypes[d]}
                  </button>
                ))}
              </div>
              {c.docScanned ? (
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 text-sm font-bold text-emerald-800 flex items-center gap-2">
                  <Check className="w-5 h-5 stroke-[3]" /> {m.docTypes[c.docType]} — {m.scanned}
                </div>
              ) : (
                <div className="relative bg-slate-900 rounded-xl p-5 text-white overflow-hidden space-y-3 text-center">
                  {scan === 'scanning' && <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-sky-200 to-blue-400 shadow-[0_0_15px_#38bdf8] animate-pulse top-1/2" />}
                  <ScanLine className={`w-8 h-8 mx-auto text-cyan-400 ${scan === 'scanning' ? 'animate-pulse' : ''}`} />
                  <p className="text-sm font-semibold text-slate-300">{scan === 'scanning' ? m.scanning : m.placeDoc}</p>
                  <button type="button" disabled={scan === 'scanning'} onClick={() => { b.playTap(); setScan('scanning'); }} className={`${scan === 'scanning' ? btnPrimaryDisabled : btnPrimary} w-full justify-center relative`}>
                    <ScanLine className="w-4 h-4" /> {m.scanDoc}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Page>
  );
}
