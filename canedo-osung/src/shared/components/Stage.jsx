import { useEffect, useRef } from 'react';
import { useSettings } from '../settings/SettingsContext.jsx';

/** 1280×720 화면을 창 크기에 맞춰 확대/축소하고, 하단 저작권 표시를 넣습니다. */
export default function Stage({ children, footerLink = false }) {
  const ref = useRef(null);
  const { settings } = useSettings();

  useEffect(() => {
    const fit = () => {
      const s = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
      if (ref.current) ref.current.style.transform = `scale(${s})`;
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  return (
    <div className="stage-outer">
      <div className="stage" ref={ref} style={{ '--font-scale': settings.size }}>
        {children}
        <div className="stage-footer">
          © 2026 특수교사 은티 ·{' '}
          {footerLink
            ? <a href="https://www.instagram.com/special_eun_t" target="_blank" rel="noreferrer" style={{ pointerEvents: 'auto' }}>@special_eun_t</a>
            : '@special_eun_t'}
        </div>
      </div>
      <div className="rotate-hint">가로로 돌려 주세요</div>
    </div>
  );
}
