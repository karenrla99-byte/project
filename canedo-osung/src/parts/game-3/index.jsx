import { QuizWindow, braille } from '../../shared';

// 점자 퀴즈 + 자모음자 점자 입력 — 공통 QuizWindow 와 braille 표를 사용합니다.
// 아래 문제는 [샘플] 입니다. 점자표는 shared/braille 에서 가져오고, 직접 복사해 두지 마세요.
const [jamo, ch] = braille.CHO[0];
const questions = [
  {
    id: 'sample-1',
    question: `[샘플] 점자 ${ch} 는 어떤 자음일까요?`,
    choices: ['ㄱ', 'ㄴ', 'ㄷ'],
    answer: ['ㄱ', 'ㄴ', 'ㄷ'].indexOf(jamo),
    explain: '[샘플 해설]',
  },
];

export default function Game({ onFinish }) {
  const started = Date.now();
  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
      <QuizWindow
        questions={questions}
        onFinish={({ correct, mistakes, hints, total }) =>
          onFinish({ score: Math.round((correct / total) * 100), mistakes, hints, timeMs: Date.now() - started })}
      />
    </div>
  );
}
