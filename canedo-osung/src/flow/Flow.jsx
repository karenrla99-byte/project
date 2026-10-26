import { useMemo, useState } from 'react';
import { Stage } from '../shared';
import { byKind } from './registry.js';

/**
 * 화면 순서 (정은만 수정):
 * 오프닝 → [ 단계 로딩 → 게임 N → 브리지 ] × 게임 수 → 마지막 화면 → 랭킹
 *
 * 파트 사이 약속(props)은 docs/00_전체_지침.md 의 "파트 약속" 참고.
 */
export default function Flow() {
  const games = useMemo(() => byKind('game'), []);
  const [Opening] = byKind('opening');
  const [Loading] = byKind('stage-loading');
  const [Bridge] = byKind('bridge');
  const [Ending] = byKind('ending');
  const [Ranking] = byKind('ranking');

  const [step, setStep] = useState({ type: 'opening' });
  const [player, setPlayer] = useState({ name: '', group: '' });
  const [results, setResults] = useState([]); // 게임별 { stageIndex, score, mistakes, hints, timeMs }

  const stageOf = (i) => ({ index: i, total: games.length, title: games[i]?.title, folder: games[i]?.folder });
  const go = (type, extra = {}) => setStep({ type, ...extra });

  const view = (() => {
    switch (step.type) {
      case 'opening':
        return <Opening.Component onStart={(p) => { setPlayer(p ?? player); setResults([]); go('loading', { i: 0 }); }} />;
      case 'loading':
        return <Loading.Component stage={stageOf(step.i)} onDone={() => go('game', { i: step.i })} />;
      case 'game': {
        const G = games[step.i];
        return (
          <G.Component
            key={G.folder}
            stage={stageOf(step.i)}
            player={player}
            onFinish={(r) => {
              const result = { stageIndex: step.i, ...r };
              setResults((prev) => [...prev.filter((x) => x.stageIndex !== step.i), result]);
              go('bridge', { i: step.i, result });
            }}
          />
        );
      }
      case 'bridge':
        return (
          <Bridge.Component
            stage={stageOf(step.i)}
            result={step.result}
            results={results}
            onNext={() => (step.i + 1 < games.length ? go('loading', { i: step.i + 1 }) : go('ending'))}
          />
        );
      case 'ending':
        return <Ending.Component player={player} results={results} onNext={() => go('ranking')} />;
      case 'ranking':
        return <Ranking.Component player={player} results={results} onRestart={() => go('opening')} />;
      default:
        return null;
    }
  })();

  return <Stage footerLink={step.type === 'opening'}>{view}</Stage>;
}
