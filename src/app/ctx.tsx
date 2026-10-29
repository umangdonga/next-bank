import { createContext, useContext } from 'react';
import type { Dict, Lang } from '../i18n';
import type { Customer, Screen, UserData } from './state';

export interface AppCtx {
  lang: Lang;
  t: Dict;
  screen: Screen;
  user: UserData;
  update(p: Partial<UserData>): void;
  go(s: Screen): void;
  /** Open "Help is coming" and come back to the current screen afterwards. */
  help(): void;
  /** Home / exit: asks before discarding anything, and really clears. */
  home(): void;
  /** Wipe everything and show "Your details have been cleared". */
  clearAll(): void;
  /** From the home screen: go back to where the kept application was left. */
  continueApp(): void;
  /** Load a saved application (from a QR return slip) and continue at its screen. */
  restore(u: UserData, s: Screen): void;
  /** Existing customer matched by fingerprint: open their banking screen. */
  signIn(c: Customer): void;
  /** Wipe the signed-in customer and show "You are signed out". */
  signOut(): void;
  /** Change the signed-in customer's account here and on the bank server. */
  updateCustomer(c: Customer): void;
  moreTime: boolean;
  setMoreTime(v: boolean): void;
  speed: number;
}

export const Ctx = createContext<AppCtx | null>(null);

export function useApp(): AppCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp outside provider');
  return c;
}
