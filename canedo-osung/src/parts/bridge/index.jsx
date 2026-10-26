import { Button, Window } from '../../shared';

// 브리지(피드백): 방금 끝낸 게임의 result 를 받아 보여 주고 onNext() 로 다음으로.
export default function Bridge({ stage, result, onNext }) {
  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
      <Window title={`${stage.title} 결과`} style={{ width: 640 }}>
        <p>점수 {result.score} · 틀린 횟수 {result.mistakes} · 힌트 {result.hints}</p>
        <Button accent onClick={onNext}>다음</Button>
      </Window>
    </div>
  );
}
