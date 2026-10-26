import { Button, Window } from '../../shared';

// 랭킹: 전체 / 소속별 / 소속 안 랭킹. 지금은 자리표시. (저장 방식은 서버 연결 때 정함)
export default function Ranking({ player, results, onRestart }) {
  const total = results.reduce((s, r) => s + r.score, 0);
  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
      <Window title="랭킹 (준비 중)" style={{ width: 640 }}>
        <p>{player.group} · {player.name} · 총점 {total}</p>
        <Button onClick={onRestart}>처음으로</Button>
      </Window>
    </div>
  );
}
