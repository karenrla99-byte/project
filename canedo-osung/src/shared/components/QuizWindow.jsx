import { useState } from 'react';
import Window from './Window.jsx';
import Button from './Button.jsx';
import { useT } from '../settings/SettingsContext.jsx';

/**
 * 공통 퀴즈 창 (게임 1·게임 3 등이 함께 사용)
 *
 * questions: [{
 *   id, question: 글|{basic,easy}, choices: [글|{basic,easy}, ...],
 *   answer: 정답 번호(0부터), explain: 글|{basic,easy}, hint?: 글|{basic,easy}
 * }]
 * onFinish({ correct, mistakes, hints, total })
 *
 * 문제 문구는 docs/기존자료/퀴즈_해설_검토본.md 를 그대로 사용하세요. 한 글자도 바꾸지 않기.
 */
export default function QuizWindow({ questions, onFinish, npcName }) {
  const t = useT();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [stat, setStat] = useState({ correct: 0, mistakes: 0, hints: 0 });

  const q = questions[i];
  const done = picked !== null;

  const choose = (n) => {
    if (done) return;
    setPicked(n);
    setStat((s) => (n === q.answer ? { ...s, correct: s.correct + 1 } : { ...s, mistakes: s.mistakes + 1 }));
  };
  const hint = () => {
    if (showHint || !q.hint) return;
    setShowHint(true);
    setStat((s) => ({ ...s, hints: s.hints + 1 }));
  };
  const next = () => {
    if (i + 1 < questions.length) { setI(i + 1); setPicked(null); setShowHint(false); }
    else onFinish({ ...stat, total: questions.length });
  };

  return (
    <Window title={`${npcName ? npcName + ' · ' : ''}${i + 1} / ${questions.length}`} style={{ width: 880 }}>
      <p>{t(q.question)}</p>
      <div style={{ display: 'grid', gap: 10 }}>
        {q.choices.map((c, n) => (
          <Button key={n} accent={done && n === q.answer} onClick={() => choose(n)}>
            {n + 1}. {t(c)}{done && n === q.answer ? ' ✔' : ''}
          </Button>
        ))}
      </div>
      {q.hint && !done && <p><Button onClick={hint}>힌트</Button> {showHint && t(q.hint)}</p>}
      {done && (
        <>
          <p><b>{picked === q.answer ? '정답!' : '아쉬워요.'}</b> {t(q.explain)}</p>
          <Button onClick={next}>{i + 1 < questions.length ? '다음' : '끝'}</Button>
        </>
      )}
    </Window>
  );
}
