import { useState } from 'react';
import { Button, Window } from '../../shared';

// 오프닝: START 와 이름·소속 입력. 끝나면 onStart({ name, group }) 호출.
export default function Opening({ onStart }) {
  const [name, setName] = useState('');
  const [group, setGroup] = useState('');
  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
      <Window title="CANE DO · 흰지팡이와 배우는 배려 방법 알기" style={{ width: 640 }}>
        <p>10월 15일 흰지팡이의 날</p>
        <p><input placeholder="별명" value={name} onChange={(e) => setName(e.target.value)} /> <input placeholder="소속" value={group} onChange={(e) => setGroup(e.target.value)} /></p>
        <Button accent onClick={() => onStart({ name: name || '친구', group })}>START</Button>
      </Window>
    </div>
  );
}
