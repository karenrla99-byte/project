import { Button, Window } from '../../shared';

// 점자 암호 해독 — 담당자가 이 폴더 안에서만 작업합니다.
// 약속: props 로 { stage, player } 를 받고, 끝나면 onFinish({ score, mistakes, hints, timeMs }) 를 한 번 호출.
export default function Game({ stage, onFinish }) {
  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
      <Window title={stage.title} style={{ width: 640 }}>
        <p>(샘플 화면) 여기에 게임을 만드세요.</p>
        <Button accent onClick={() => onFinish({ score: 100, mistakes: 0, hints: 0, timeMs: 1000 })}>끝내기(샘플)</Button>
      </Window>
    </div>
  );
}
