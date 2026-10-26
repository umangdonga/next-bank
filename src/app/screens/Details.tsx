import { ArrowRight, BookOpen, Check, CreditCard, Globe, Lock, PenLine, ShieldCheck, User, Users, Volume2, Wifi } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { b } from '../../lib/sound';
import { useApp } from '../ctx';
import { DateField, Footer, HoldToView, MinorBanner, Page, PrivacyBadge, Title, btnPrimary, btnPrimaryDisabled } from '../ui';
import { DEPOSIT, holderName, isMinor, maskAadhaar, maskPan, rupees } from '../state';

/* ================================================================ 06 */

export function ConfirmDetails() {
  const { t, user, go } = useApp();
  const a = t.s6;
  const x = t.x.common;
  const field = (label: string, value: ReactNode, wide = false, mono = false) => (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
      <div className={`flex items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl ${mono ? 'font-mono' : ''}`}>
        <span className="text-sm font-bold text-slate-900 leading-relaxed flex-1">{value}</span>
        <Lock className="w-4 h-4 text-slate-400 shrink-0" />
      </div>
    </div>
  );
  const minor = isMinor(user);
  return (
    <Page
      footer={
        <Footer onBack={() => go('04-scan-cards')}>
          <button onClick={() => { b.playSuccess(); go(minor ? '06m-child' : '07-more-details'); }} className={btnPrimary}>
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{a.yesCorrect}</span>
          </button>
        </Footer>
      }
    >
      <Title badge="2" title={minor ? t.x.minor.confirmTitle : a.title} sub={a.sub} right={<PrivacyBadge />} />
      <MinorBanner step="guardian" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Your details</h2>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{a.verifiedBadge}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field(a.fullName, user.fullName)}
            {field(a.dob, <HoldToView shown={user.dob} masked="•• •••••• 19••" label={x.hold} />)}
            {field(a.gender, a.genderVal)}
            {field(a.fatherName, user.fatherName)}
            {field(a.address, <HoldToView shown={user.address} masked={`•••••••••••, ${user.address.split(',').slice(-2).join(',').trim()}`} label={x.hold} />, true)}
            {field(a.pan, <HoldToView shown={user.panNumber} masked={maskPan(user.panNumber)} label={x.hold} />, false, true)}
            {field(a.aadhaar, maskAadhaar(user.aadhaarNumber), false, true)}
          </div>
        </div>
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col items-center text-center">
            <h3 className="text-sm font-bold text-slate-900 mb-4">{a.photoTitle}</h3>
            <div className="relative w-28 h-32 rounded-2xl bg-gradient-to-b from-blue-50 to-slate-100 border-2 border-blue-200 flex flex-col items-center justify-center shadow-inner overflow-hidden mb-3">
              <User className="w-16 h-16 text-blue-400" />
              <div className="absolute bottom-0 inset-x-0 bg-blue-600/90 text-white text-[10px] font-bold py-0.5 tracking-wider uppercase">UIDAI RECORD</div>
            </div>
            <div className="text-xs text-slate-500 font-medium">{a.photoSub}</div>
            {user.faceVerified && (
              <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <Check className="w-3.5 h-3.5 stroke-[3]" /> {t.x.face.success}
              </div>
            )}
            <div className="border-t border-slate-100 w-full mt-4 pt-3 text-xs text-slate-500">
              {a.alertsTo}
              <div className="font-bold text-slate-800 text-sm mt-0.5 font-mono">{user.mobile}</div>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-medium bg-blue-50/60 border border-blue-200 rounded-2xl p-3">{a.whyCantEdit}</p>
        </div>
      </div>
    </Page>
  );
}

/* ================================================================ 07 */

export function MoreDetails() {
  const { t, user, update, go } = useApp();
  const s = t.s7;
  const relations = [
    { key: 'Spouse', label: s.relations.spouse },
    { key: 'Son', label: s.relations.son },
    { key: 'Daughter', label: s.relations.daughter },
    { key: 'Father', label: s.relations.father },
    { key: 'Mother', label: s.relations.mother },
    { key: 'Other', label: s.relations.other },
  ];
  const occupations = [
    { key: 'Salaried', label: s.occupations.salaried },
    { key: 'Self-employed', label: s.occupations.selfEmployed },
    { key: 'Business', label: s.occupations.business },
    { key: 'Student', label: s.occupations.student },
    { key: 'Homemaker', label: s.occupations.homemaker },
    { key: 'Retired', label: s.occupations.retired },
  ];
  const incomes = [
    { key: 'Below ₹1 lakh', label: s.incomes[0] },
    { key: '₹1–5 lakh', label: s.incomes[1] },
    { key: '₹5–10 lakh', label: s.incomes[2] },
    { key: 'Above ₹10 lakh', label: s.incomes[3] },
  ];
  // A child has no occupation or income to declare; the guardian operates the account.
  const minor = isMinor(user);
  const ok = !!(user.nomineeRelation && user.nomineeName.trim().length > 1 && user.nomineeDob && (minor || (user.occupation && user.yearlyIncome)));
  const chip = (on: boolean, h = 'h-12') =>
    `${h} rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer ${on ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/40'}`;
  const input = 'w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-bold text-slate-900 text-sm outline-hidden select-text';

  return (
    <Page
      footer={
        <Footer onBack={() => go(minor ? '06m-child' : '06-confirm-details')}>
          <button disabled={!ok} onClick={() => { b.playSuccess(); go('08-review-agree'); }} className={ok ? btnPrimary : btnPrimaryDisabled}>
            <span>{s.nextBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </Footer>
      }
    >
      <Title badge="3" title={s.title} sub={s.sub} right={<PrivacyBadge />} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600"><Users className="w-5 h-5" /></div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{s.nomineeTitle}</h2>
              <p className="text-xs text-slate-500">{s.nomineeSub}</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2.5">{s.relationship}</label>
            <div className="grid grid-cols-3 gap-2">
              {relations.map((r) => {
                const on = user.nomineeRelation === r.key;
                return (
                  <button key={r.key} type="button" onClick={() => { b.playTap(); update({ nomineeRelation: r.key }); }} className={chip(on, 'h-11').replace('text-xs sm:text-sm', 'text-xs')}>
                    {on && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    <span>{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">{s.nomineeName}</label>
            <div className="relative">
              <input type="text" value={user.nomineeName} onChange={(e) => update({ nomineeName: e.target.value })} placeholder="Enter nominee's name" className={input} />
              <PenLine className="w-4 h-4 text-slate-400 absolute right-4 top-4 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">{s.nomineeDob}</label>
            <DateField value={user.nomineeDob} onChange={(v) => update({ nomineeDob: v })} />
          </div>
        </div>
        {minor ? (
          <div className="lg:col-span-6 bg-violet-50/70 border border-violet-200 rounded-2xl p-6 space-y-2">
            <h2 className="text-base font-bold text-violet-900">{t.x.minor.operateTitle}</h2>
            <p className="text-sm text-slate-700 font-medium leading-relaxed">{t.x.minor.operate(user.child.name, user.fullName)}</p>
          </div>
        ) : (
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
            <h2 className="text-base font-bold text-slate-900 mb-3.5">{s.occupationTitle}</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {occupations.map((o) => {
                const on = user.occupation === o.key;
                return (
                  <button key={o.key} type="button" onClick={() => { b.playTap(); update({ occupation: o.key }); }} className={chip(on)}>
                    {on && <Check className="w-4 h-4 stroke-[3]" />}
                    <span>{o.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
            <h2 className="text-base font-bold text-slate-900 mb-3.5">{s.incomeTitle}</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {incomes.map((o) => {
                const on = user.yearlyIncome === o.key;
                return (
                  <button key={o.key} type="button" onClick={() => { b.playTap(); update({ yearlyIncome: o.key }); }} className={chip(on)}>
                    {on && <Check className="w-4 h-4 stroke-[3]" />}
                    <span>{o.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        )}
      </div>
    </Page>
  );
}

/* ================================================================ 08 */

export function ReviewAgree() {
  const { t, user, go, lang } = useApp();
  const o = t.s8;
  // Consent must be an active choice: the original had this box ticked by default.
  const [agree, setAgree] = useState(false);
  const row = (k: string, v: ReactNode, mono = false) => (
    <div className="flex justify-between items-center py-1 gap-4">
      <span className="text-slate-500 font-medium">{k}</span>
      <span className={`font-bold text-slate-900 text-right ${mono ? 'font-mono' : ''}`}>{v}</span>
    </div>
  );
  return (
    <Page
      footer={
        <Footer onBack={() => go('07-more-details')}>
          <button disabled={!agree} onClick={() => { b.playSuccess(); go('08a-deposit'); }} className={agree ? btnPrimary : btnPrimaryDisabled}>
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{o.agreeBtn}</span>
          </button>
        </Footer>
      }
    >
      <Title badge="3" title={o.title} sub={o.sub} right={<PrivacyBadge />} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-5">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">{o.youAreOpening}</h2>
          <div className="space-y-4 text-sm">
            {row(o.accountLabel, t.x.home.cards[user.accountType].product)}
            {row(t.x.home.deposit, rupees(DEPOSIT[user.accountType]))}
            {isMinor(user) ? (
              <>
                {row(t.x.minor.holder, user.child.name)}
                {row(t.x.minor.guardian, `${user.fullName} (${t.x.minor.relations[user.child.relation as 'father' | 'mother' | 'guardian'] ?? ''})`)}
              </>
            ) : (
              row(o.nameLabel, user.fullName)
            )}
            {row(o.branchLabel, o.branchVal)}
            {row(o.nomineeLabel, `${user.nomineeName} (${user.nomineeRelation})`)}
            {row(o.alertsOn, user.mobile, true)}
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => { b.playTap(); b.speak(`${o.title}. ${o.t1} ${o.t2} ${o.t3}`, lang); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 hover:border-blue-400 text-blue-700 bg-blue-50/50 hover:bg-blue-100/50 text-xs font-semibold cursor-pointer transition-all shadow-2xs active:scale-95"
            >
              <Volume2 className="w-4 h-4 text-blue-600" />
              <span>{o.readAloud}</span>
            </button>
          </div>
        </div>
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
          <h2 className="text-base font-bold text-slate-900">{o.inSimpleWords}</h2>
          <ul className="space-y-4">
            {[o.t1, o.t2, o.t3].map((p) => (
              <li key={p} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5"><Check className="w-4 h-4 stroke-[3]" /></div>
                <span className="text-sm font-medium text-slate-700 leading-snug">{p}</span>
              </li>
            ))}
          </ul>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => { b.playTap(); setAgree(!agree); }}
              className={`w-full p-4 rounded-xl font-bold text-sm sm:text-base flex items-center gap-3 border transition-all cursor-pointer ${agree ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'}`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 ${agree ? 'border-white bg-blue-600 text-white' : 'border-slate-400 bg-white text-transparent'}`}>
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <span>{o.agreeCheckbox}</span>
            </button>
            <p className="text-xs text-slate-500 mt-3 text-center">{o.termsNote}</p>
          </div>
        </div>
      </div>
    </Page>
  );
}

/* ================================================================ 08b */

export function Services() {
  const { t, user, update, go } = useApp();
  const s = t.s8b;
  const minor = isMinor(user);
  // A minor gets only the junior card (with a guardian-set limit) and no cheque book.
  const variants = minor
    ? [{ key: 'RuPay Junior', label: `${t.x.minor.card} · ${t.x.minor.cardSub}` }]
    : [
        { key: 'RuPay Classic', label: s.cardVariant1 },
        { key: 'Visa Platinum', label: s.cardVariant2 },
        { key: 'MasterCard Global', label: s.cardVariant3 },
      ];
  useEffect(() => {
    if (minor && user.debitCardType !== 'RuPay Junior') update({ debitCardType: 'RuPay Junior', wantChequeBook: false });
  }, []);
  const toggle = (on: boolean, flip: () => void) => (
    <button
      type="button"
      onClick={() => { b.playTap(); flip(); }}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${on ? 'bg-blue-600' : 'bg-slate-300'}`}
    >
      <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${on ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
  const head = (Icon: typeof CreditCard, title: string, desc: string, on: boolean, flip: () => void) => (
    <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-3">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600"><Icon className="w-5 h-5" /></div>
        <div>
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500">{desc}</p>
        </div>
      </div>
      {toggle(on, flip)}
    </div>
  );
  return (
    <Page
      footer={
        <Footer onBack={() => go('08a-deposit')}>
          <button onClick={() => { b.playSuccess(); go('09-signature'); }} className={btnPrimary}>
            <span>{s.continueBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </Footer>
      }
    >
      <Title badge="3" title={s.title} sub={s.sub} right={<PrivacyBadge />} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-5">
          {head(CreditCard, s.debitTitle, s.debitDesc, user.wantDebitCard, () => update({ wantDebitCard: !user.wantDebitCard }))}
          {user.wantDebitCard ? (
            <div className="space-y-4 animate-fade-in">
              <div className="w-full h-44 rounded-2xl bg-gradient-to-tr from-slate-900 via-blue-950 to-blue-800 p-5 text-white flex flex-col justify-between shadow-lg relative overflow-hidden border border-slate-700">
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-8 rounded-md bg-gradient-to-r from-amber-300 to-yellow-500 border border-yellow-200/50 shadow-inner flex items-center justify-center">
                      <div className="w-6 h-5 border border-amber-700/40 rounded-xs" />
                    </div>
                    <Wifi className="w-5 h-5 text-slate-300 rotate-90" />
                  </div>
                  <span className="font-extrabold text-xs tracking-wider text-blue-200 uppercase">NEXT Bank</span>
                </div>
                <div className="font-mono text-base tracking-widest text-slate-200 relative z-10">•••• •••• •••• ••••</div>
                <div className="flex items-end justify-between relative z-10">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">CARD HOLDER</span>
                    <span className="font-bold text-sm tracking-wide text-white">{holderName(user)}</span>
                  </div>
                  <span className="font-extrabold text-xs tracking-wider text-amber-300 block">{user.debitCardType}</span>
                </div>
                <div className="absolute -bottom-10 -right-10 w-36 h-36 rounded-full bg-blue-500/10 blur-xl" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">{s.cardTypeLabel}</label>
                <div className="space-y-2">
                  {variants.map((v) => {
                    const on = user.debitCardType === v.key;
                    return (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => { b.playTap(); update({ debitCardType: v.key }); }}
                        className={`w-full p-3 rounded-xl text-xs font-bold text-left flex items-center justify-between border transition-all cursor-pointer ${on ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-2xs' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'}`}
                      >
                        <span>{v.label}</span>
                        {on && <Check className="w-4 h-4 text-blue-600 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              <p className="text-xs text-slate-500 font-medium">{s.deliveryInfo}</p>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500 font-medium">Debit card skipped. You can request a card anytime from your branch or the NEXT app.</div>
          )}
        </div>
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
            {head(Globe, s.netBankingTitle, s.netBankingDesc, user.wantNetBanking, () => update({ wantNetBanking: !user.wantNetBanking }))}
            {user.wantNetBanking ? (
              <div className="space-y-3 pt-1">
                {[s.netBankingFeature1, s.netBankingFeature2].map((f) => (
                  <div key={f} className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    <span>{f}</span>
                  </div>
                ))}
                <p className="text-[11px] text-slate-400">Provisional login credentials and setup link will be sent via SMS to {user.mobile}.</p>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-500 font-medium">Digital banking not enabled.</div>
            )}
          </div>
          {!minor && <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
            {head(BookOpen, s.chequeTitle, s.chequeDesc, user.wantChequeBook, () => update({ wantChequeBook: !user.wantChequeBook }))}
            {user.wantChequeBook && (
              <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Free 10-leaf cheque book selected. Sent via registered post.</span>
              </div>
            )}
          </div>}
        </div>
      </div>
    </Page>
  );
}
