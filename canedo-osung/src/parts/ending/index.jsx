import { Button, Window } from '../../shared';

// 마지막 화면: 전체 results 를 받아 마무리. 끝나면 onNext() → 랭킹.
export default function Ending({ player, onNext }) {
  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
      <Window title="CANE DO" style={{ width: 640 }}>
        <p>{player.name} 친구, 수고했어요!</p>
        <Button accent onClick={onNext}>랭킹 보기</Button>
      </Window>
    </div>
  );
}
