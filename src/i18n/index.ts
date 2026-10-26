import base from './base';
import enExtra from './extra';
import { hi as hiExtra, gu as guExtra } from './extra-hi-gu';

export type Lang = 'en' | 'hi' | 'gu';

const DICT = {
  en: { ...base.en, x: enExtra },
  hi: { ...base.hi, x: hiExtra },
  gu: { ...base.gu, x: guExtra },
};

export type Dict = (typeof DICT)['en'];

/** Same lookup the original kiosk used: `y[language]`. */
export const y = DICT as unknown as Record<Lang, Dict>;
export const SPEECH_LANG: Record<Lang, string> = { en: 'en-IN', hi: 'hi-IN', gu: 'gu-IN' };
