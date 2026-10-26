import { useState } from 'react';
import { ArrowRight, Banknote, Check, CircleCheckBig, QrCode, ScanLine, Smartphone } from 'lucide-react';
import { b } from '../../lib/sound';
import { useApp } from '../ctx';
import { Footer, Modal, Page, btnPrimary } from '../ui';
import { ACCOUNT_TYPES, DEPOSIT, emptyUser, hasPersonal, rupees, type AccountType } from '../state';
import savingsImg from '../../assets/acc-savings.png';
import currentImg from '../../assets/acc-current.png';
import minorImg from '../../assets/acc-minor.png';

const THEME: Record<AccountType, { img: string; card: string; on: string; chip: string; box: string; amount: string; tick: string; btn: string }> = {
  savings: {
    img: savingsImg,
    card: 'hover:border-blue-500 hover:ring-blue-100',
    on: 'border-blue-600 ring-4 ring-blue-100',
    chip: 'bg-blue-50 text-blue-700 border-blue-200',
    box: 'bg-blue-50/70 border-blue-200',
    amount: 'text-blue-700',
    tick: 'bg-blue-100 text-blue-600',
    btn: 'bg-blue-600 group-hover:bg-blue-700',
  },
  current: {
    img: currentImg,
    card: 'hover:border-teal-500 hover:ring-teal-100',
    on: 'border-teal-600 ring-4 ring-teal-100',
    chip: 'bg-teal-50 text-teal-700 border-teal-200',
    box: 'bg-teal-50/70 border-teal-200',
    amount: 'text-teal-700',
    tick: 'bg-teal-100 text-teal-600',
    btn: 'bg-teal-600 group-hover:bg-teal-700',
  },
  minor: {
    img: minorImg,
    card: 'hover:border-violet-500 hover:ring-violet-100',
    on: 'border-violet-600 ring-4 ring-violet-100',
    chip: 'bg-violet-50 text-violet-700 border-violet-200',
    box: 'bg-violet-50/70 border-violet-200',
    amount: 'text-violet-700',
    tick: 'bg-violet-100 text-violet-600',
    btn: 'bg-violet-600 group-hover:bg-violet-700',
  },
};

/* ================================================================ 00 */

/**
 * NEW: the kiosk's home screen — pick the account, with its opening deposit shown up front.
 * A visitor who comes back here keeps their choice and progress; only picking a
 * different account (after confirming) starts a new application.
 */
export function AccountHome() {
  const { t, user, update, go, continueApp, restore } = useApp();
  const h = t.x.home;
  const [switchTo, setSwitchTo] = useState<AccountType | null>(null);
  const selected = user.typeChosen ? user.accountType : null;

  const start = (k: AccountType) => {
    b.playSuccess();
    restore({ ...emptyUser(), accountType: k, typeChosen: true }, '01-before-start');
  };

  const choose = (k: AccountType) => {
    if (k === selected) {
      b.playSuccess();
      continueApp();
    } else if (selected && hasPersonal(user)) {
      b.playTap();
      setSwitchTo(k);
    } else if (selected) {
      start(k);
    } else {
      b.playSuccess();
      update({ accountType: k, typeChosen: true });
      go('01-before-start');
    }
  };

  return (
    <Page
      footer={
        <Footer showHome={false}>
          <button onClick={() => { b.playTap(); go('E9-resume'); }} className="flex items-center gap-2 px-5 py-3 rounded-xl border border-blue-300 hover:border-blue-400 text-blue-700 bg-white hover:bg-blue-50/50 text-sm font-semibold transition-all cursor-pointer shadow-2xs">
            <ScanLine className="w-4 h-4" /> {h.savedApp}
          </button>
        </Footer>
      }
    >
      <div className="text-center space-y-1">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">{h.title}</h1>
        <p className="text-slate-500 font-medium text-sm md:text-base">{h.sub}</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        {ACCOUNT_TYPES.map((k) => {
          const c = h.cards[k];
          const th = THEME[k];
          const on = selected === k;
          return (
            <button
              key={k}
              type="button"
              aria-pressed={on}
              onClick={() => choose(k)}
              className={`group bg-white rounded-3xl p-6 border-2 shadow-xs hover:shadow-md hover:ring-4 ${on ? th.on : 'border-slate-200'} ${th.card} text-left flex flex-col gap-4 transition-all cursor-pointer active:scale-[0.99]`}
            >
              <div className="flex items-start justify-between gap-3">
                <img src={th.img} alt="" className="w-16 h-16 rounded-2xl object-cover" />
                {on ? (
                  <span className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white ${th.btn}`}>
                    <CircleCheckBig className="w-3.5 h-3.5" /> {h.selected}
                  </span>
                ) : (
                  <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${th.chip}`}>{c.tag}</span>
                )}
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{c.name}</h2>
                <p className="text-sm text-slate-500 font-medium mt-0.5">{c.who}</p>
              </div>
              <div className={`rounded-2xl border p-4 ${th.box}`}>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{h.deposit}</div>
                <div className={`text-4xl font-black tracking-tight mt-0.5 ${th.amount}`}>{rupees(DEPOSIT[k])}</div>
              </div>
              <ul className="space-y-2.5 flex-1">
                {c.benefits.map((x) => (
                  <li key={x} className="flex items-start gap-2.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${th.tick}`}><Check className="w-3.5 h-3.5 stroke-[3]" /></span>
                    <span className="text-sm font-medium text-slate-700 leading-snug">{x}</span>
                  </li>
                ))}
              </ul>
              <span className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white text-sm font-bold shadow-md transition-all ${th.btn}`}>
                {on ? h.continueApp : h.choose} <ArrowRight className="w-4 h-4" />
              </span>
            </button>
          );
        })}
      </div>
      {switchTo && (
        <Modal onClose={() => setSwitchTo(null)}>
          <h3 className="text-xl font-extrabold text-slate-900">{h.switchTitle(h.cards[switchTo].name)}</h3>
          <p className="text-sm text-slate-600 font-medium">{h.switchSub}</p>
          <div className="grid grid-cols-1 gap-3">
            <button type="button" onClick={() => { b.playTap(); setSwitchTo(null); continueApp(); }} className={`${btnPrimary} w-full justify-center`}>
              {h.switchNo}
            </button>
            <button type="button" onClick={() => { setSwitchTo(null); start(switchTo); }} className="w-full py-3 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 text-sm font-bold cursor-pointer">
              {h.switchYes}
            </button>
          </div>
        </Modal>
      )}
      <div className="flex items-center justify-center gap-2.5 text-sm font-semibold text-slate-500">
        <Smartphone className="w-4 h-4 text-blue-600" />
        <QrCode className="w-4 h-4 text-blue-600" />
        <Banknote className="w-4 h-4 text-blue-600" />
        <span>{h.payHint}</span>
      </div>
    </Page>
  );
}
