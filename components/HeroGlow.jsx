'use client';
import { useEffect, useRef } from 'react';

export default function HeroGlow() {
  const glowRef = useRef(null);

  useEffect(() => {
    const heroSection = document.getElementById('hero-section');
    const heroGlow = glowRef.current;
    if (!heroSection || !heroGlow) return;

    const handler = (e) => {
      const rect = heroSection.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      heroGlow.style.setProperty('--gx', `${x}%`);
      heroGlow.style.setProperty('--gy', `${y}%`);
    };

    heroSection.addEventListener('mousemove', handler);
    return () => heroSection.removeEventListener('mousemove', handler);
  }, []);

  return <div className="hero-glow" ref={glowRef} />;
}
