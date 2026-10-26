import { useEffect } from 'react';
import { Window } from '../../shared';

// 단계 로딩: stage = { index, total, title }. 준비되면 onDone() 호출.
export default function StageLoading({ stage, onDone }) {
  useEffect(() => { const id = setTimeout(onDone, 1500); return () => clearTimeout(id); }, [onDone]);
  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
      <Window title={`${stage.index + 1} / ${stage.total} 단계`} style={{ width: 640 }}>{stage.title}</Window>
    </div>
  );
}
