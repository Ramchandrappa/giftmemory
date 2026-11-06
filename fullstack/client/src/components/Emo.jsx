import { useEffect, useRef, useState } from 'react';

// Google Noto Emoji artwork (Apache 2.0; animated versions CC BY 4.0).
// Shows the static PNG first, then swaps to the animated WebP once it has fully
// downloaded. Falls back to the plain text emoji if the image can't load.
const ANIM = new Set(['1f30a', '1f331', '1f338', '1f339', '1f373', '1f375', '1f37f', '1f381', '1f382', '1f386', '1f388', '1f389', '1f39f', '1f3b2', '1f3cf', '1f3e0', '1f44b', '1f48c', '1f48d', '1f48e', '1f490', '1f49d', '1f49e', '1f4a1', '1f4b8', '1f4bf', '1f4ca', '1f4da', '1f4f8', '1f4fa', '1f50b', '1f50c', '1f514', '1f5e3', '1f634', '1f64f', '1f6d2', '1f942', '1f9c2', '1fa82', '1fa94', '1fad6', '1fad7', '1faf6', '2615', '265f', '270f', '2728', '2764', '2b50']);
const STATIC = (c) => `https://cdn.jsdelivr.net/gh/googlefonts/noto-emoji@v2.047/png/128/emoji_u${c}.png`;
const ANIMATED = (c) => `https://fonts.gstatic.com/s/e/notoemoji/latest/${c}/512.webp`;
const CARDS = '.pcard, .cat, .occtile, .story, .lcard, .rcard, .logo, .hero';
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const loaded = new Set(); // animated files already downloaded

export const codeOf = (e) => [...e].map((c) => c.codePointAt(0)).filter((n) => n !== 0xfe0f).map((n) => n.toString(16)).join('_');

export default function Emo({ e, live = false }) {
  const code = codeOf(e || '🎁');
  const [src, setSrc] = useState(STATIC(code));
  const [failed, setFailed] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    setSrc(STATIC(code)); setFailed(false);
    if (!ANIM.has(code) || reduced()) return undefined;
    let alive = true;
    const play = () => {
      const url = ANIMATED(code);
      if (loaded.has(url)) { setSrc(url); return; }
      const img = new Image();
      img.onload = () => { loaded.add(url); if (alive) setSrc(url); };
      img.src = url;
    };
    if (live) { play(); return () => { alive = false; }; }
    const card = ref.current?.closest(CARDS);
    if (!card) return () => { alive = false; };
    card.addEventListener('pointerenter', play, { once: true });
    card.addEventListener('focusin', play, { once: true });
    return () => { alive = false; card.removeEventListener('pointerenter', play); card.removeEventListener('focusin', play); };
  }, [code, live]);

  if (failed) return <>{e}</>;
  return <img ref={ref} className="gm-emo" src={src} alt="" draggable="false" loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}
