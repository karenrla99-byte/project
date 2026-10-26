import { createContext, useContext, useMemo, useState } from 'react';

// 설정은 shared 에서만 관리합니다. 파트는 useSettings() 로 읽기만 하세요.
const KEY = 'canedo-settings-v1';
const DEFAULTS = { level: 'basic', size: 1 }; // level: 'basic' | 'easy' , size: 1 | 1.15 | 1.3

const SettingsContext = createContext(null);

function load() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { return { ...DEFAULTS }; }
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(load);
  const value = useMemo(() => ({
    settings,
    update(patch) {
      setSettings((s) => {
        const next = { ...s, ...patch };
        try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* 저장 실패는 무시 */ }
        return next;
      });
    },
  }), [settings]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);

/** 글 두 가지 버전 고르기. t({ basic: '기본 글', easy: '쉬운 글' }) — 문자열이면 그대로 */
export function useT() {
  const { settings } = useSettings();
  return (v) => (typeof v === 'string' || v == null ? v : v[settings.level] ?? v.basic);
}
