import { useEffect, useState } from 'react';
import { Camera, CircleCheckBig, FileText, Lock, RotateCcw } from 'lucide-react';
import { y, type Lang } from '../i18n';
import { phonePut } from '../lib/api';

/**
 * NEW: the page a visitor's phone opens from the kiosk QR (#/up/<session>?doc=…&lang=…).
 * In this prototype the photo stays on the phone; only "it arrived" is sent, so the
 * kiosk never receives or shows the document image.
 */
export function PhoneUpload() {
  const [path, query = ''] = location.hash.slice(2).split('?');
  const params = new URLSearchParams(query);
  const sid = path.split('/')[1] ?? '';
  const lang = (['en', 'hi', 'gu'].includes(params.get('lang') ?? '') ? params.get('lang') : 'en') as Lang;
  const doc = params.get('doc') === 'pan' ? 'pan' : 'aadhaar';
  const t = y[lang];
  const p = t.x.phoneScan;
  const docName = doc === 'pan' ? t.s1.c2Title : t.s1.c1Title;
  const [photo, setPhoto] = useState<string | null>(null);
  const [st, setSt] = useState<'pick' | 'sending' | 'sent'>('pick');

  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo); }, [photo]);

  const send = async () => {
    setSt('sending');
    await phonePut(sid, { done: true, doc });
    setSt('sent');
  };

  return (
    <div className="min-h-dvh bg-slate-100 font-sans text-slate-800">
      <div className="mx-auto max-w-md min-h-dvh bg-white px-5 py-6 flex flex-col gap-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white font-black text-xs">NEXT</div>
          <div>
            <div className="text-lg font-extrabold text-slate-900 leading-tight">{p.pageTitle}</div>
            <div className="text-xs text-slate-500 font-medium">{p.pageFor}</div>
          </div>
        </div>

        {!sid ? (
          <p className="text-base font-semibold text-slate-700">{p.expired}</p>
        ) : st === 'sent' ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
            <CircleCheckBig className="w-20 h-20 text-emerald-600" />
            <p className="text-xl font-extrabold text-slate-900">{p.sent}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-base font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <FileText className="w-5 h-5" /> {docName}
            </div>
            <div className="aspect-[1.6] w-full rounded-2xl border-2 border-dashed border-blue-300 bg-slate-50 flex items-center justify-center overflow-hidden">
              {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : <Camera className="w-14 h-14 text-blue-300" />}
            </div>
            <p className="text-sm text-slate-500 font-medium">{p.tip}</p>
            <label className="h-14 w-full rounded-xl border-2 border-blue-600 text-blue-700 font-bold text-base flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]">
              {photo ? <RotateCcw className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
              {photo ? p.retake : p.take}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setPhoto(URL.createObjectURL(f));
                }}
              />
            </label>
            <button
              type="button"
              disabled={!photo || st === 'sending'}
              onClick={() => void send()}
              className="h-14 w-full rounded-xl bg-blue-600 text-white font-bold text-base disabled:opacity-40 active:scale-[0.98]"
            >
              {st === 'sending' ? p.sending : p.send}
            </button>
            <p className="flex items-start gap-2 text-xs text-slate-500"><Lock className="w-4 h-4 shrink-0" /> {p.privacy}</p>
          </>
        )}
      </div>
    </div>
  );
}
