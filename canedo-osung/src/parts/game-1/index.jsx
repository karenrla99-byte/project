import { QuizWindow } from '../../shared';

// OX 퀴즈 — 공통 QuizWindow 에 문제 데이터만 넘깁니다. 담당자는 이 폴더 안에서만 작업.
// 아래 문제는 [샘플] 입니다. 실제 문구는 docs/기존자료/퀴즈_해설_검토본.md 에서 그대로 옮기세요.
const questions = [
  {
    id: 'sample-1',
    question: { basic: '[샘플] 점자블록 위에 물건을 놓아도 괜찮다.', easy: '[샘플] 점자블록 위에 물건을 놓아도 돼요.' },
    choices: ['O', 'X'],
    answer: 1,
    explain: { basic: '[샘플 해설]', easy: '[샘플 해설]' },
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
