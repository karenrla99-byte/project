import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import './shared/theme/tokens.css';
import { SettingsProvider, Stage, useSettings } from './shared';
import { findPart } from './flow/registry.js';

/**
 * 파트 단독 실행 화면.  npm run part -- game-1
 * 다른 파트가 없어도 가짜 단계/결과 값을 넣어 줍니다. 공통 파트 약속과 같은 props 를 받습니다.
 */
const folder = new URLSearchParams(location.search).get('part');
const part = findPart(folder);

const fakeStage = { index: 0, total: 4, title: part?.title ?? '', folder };
const fakeResult = { stageIndex: 0, score: 80, mistakes: 1, hints: 0, timeMs: 95000 };
const fakeResults = [0, 1, 2, 3].map((i) => ({ ...fakeResult, stageIndex: i, score: 70 + i * 5 }));
const player = { name: '테스트', group: '테스트반' };

function Sandbox() {
  const { settings, update } = useSettings();
  const [log, setLog] = useState(null);
  const [run, setRun] = useState(0);
  if (!part) return <p style={{ color: '#fff' }}>없는 파트예요: {String(folder)}</p>;
  const C = part.Component;
  const props = {
    stage: fakeStage, player, result: fakeResult, results: fakeResults,
    onStart: (p) => setLog({ onStart: p }), onDone: () => setLog({ onDone: true }),
    onFinish: (r) => setLog({ onFinish: r }), onNext: () => setLog({ onNext: true }),
    onRestart: () => setLog({ onRestart: true }),
  };
  return (
    <>
      <Stage><C key={run} {...props} /></Stage>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#000c', color: '#fff', font: '13px monospace', padding: 6, zIndex: 100, display: 'flex', gap: 12 }}>
        <b>[단독 실행] {part.folder}</b>
        <label>글 종류 <select value={settings.level} onChange={(e) => update({ level: e.target.value })}><option value="basic">기본 글</option><option value="easy">쉬운 글</option></select></label>
        <label>글자 <select value={settings.size} onChange={(e) => update({ size: Number(e.target.value) })}><option value={1}>보통</option><option value={1.15}>크게</option><option value={1.3}>아주 크게</option></select></label>
        <button onClick={() => { setLog(null); setRun((n) => n + 1); }}>다시 시작</button>
        <span>마지막 호출: {log ? JSON.stringify(log) : '-'}</span>
      </div>
    </>
  );
}

createRoot(document.getElementById('root')).render(<SettingsProvider><Sandbox /></SettingsProvider>);
