import { useEffect, useRef, useState } from 'react';
import Emo from './Emo.jsx';
import { api, setToken } from '../lib/api.js';

const CONF = ['#ffd27a', '#ff7aa8', '#c6b2ff', '#9fe0c4', '#ffffff', '#f5a524'];
const confetti = Array.from({ length: 28 }, (_, i) => ({
  left: `${(i * 37) % 100}%`, background: CONF[i % CONF.length],
  animationDuration: `${6 + (i % 5) * 1.3}s`, animationDelay: `-${(i * 0.9) % 9}s`,
  ...(i % 3 === 0 ? { borderRadius: '50%', width: 10, height: 10 } : {}),
}));

function GiftArt() {
  return (
    <svg className="giftart" viewBox="0 0 150 130" aria-hidden="true">
      <path className="heart h1" d="M60 40 c-4-6-13-3-10 4 l10 9 l10-9 c3-7-6-10-10-4z" fill="#ff7aa8" />
      <path className="heart h2" d="M82 34 c-3-5-10-2-8 3 l8 7 l8-7 c2-5-5-8-8-3z" fill="#f5a524" />
      <path className="heart h3" d="M72 46 c-3-4-8-2-6 3 l6 5 l6-5 c2-5-3-7-6-3z" fill="#c6b2ff" />
      <g className="box"><rect x="35" y="66" width="80" height="56" rx="8" fill="#b4235a" /><rect x="69" y="66" width="12" height="56" fill="#ffd27a" /><rect x="35" y="66" width="80" height="10" fill="#000" opacity=".12" /></g>
      <g className="lid"><rect x="29" y="52" width="92" height="18" rx="6" fill="#d63a76" /><rect x="69" y="52" width="12" height="18" fill="#ffd27a" />
        <path d="M75 52 C60 30 44 40 58 50 Z M75 52 C90 30 106 40 92 50 Z" fill="#ffd27a" stroke="#f5a524" strokeWidth="2" /></g>
      <path className="spark sp1" d="M22 40 l3 8 l8 3 l-8 3 l-3 8 l-3-8 l-8-3 l8-3z" fill="#ffd27a" />
      <path className="spark sp2" d="M128 30 l2 6 l6 2 l-6 2 l-2 6 l-2-6 l-6-2 l6-2z" fill="#ff7aa8" />
      <path className="spark sp3" d="M124 84 l2 5 l5 2 l-5 2 l-2 5 l-2-5 l-5-2 l5-2z" fill="#c6b2ff" />
    </svg>
  );
}

export function Logo() {
  return <span className="logo"><span className="mark"><Emo e="🎁" live /></span><span>gift<span style={{ color: 'var(--green)' }}>memory</span></span></span>;
}

export default function Auth({ onAuthed }) {
  const [mode, setMode] = useState('login');
  const login = mode === 'login';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('demo@giftmemory.app');
  const [pass, setPass] = useState('demo123');
  const [errors, setErrors] = useState({});
  const [formErr, setFormErr] = useState('');
  const [busy, setBusy] = useState(false);
  const first = useRef(null);
  useEffect(() => { first.current?.focus(); }, [mode]);

  const switchMode = () => {
    setMode(login ? 'register' : 'login'); setErrors({}); setFormErr('');
    if (login) { setEmail(''); setPass(''); } else { setEmail('demo@giftmemory.app'); setPass('demo123'); }
  };
  const fail = (id, msg) => { setErrors({ [id]: msg }); document.getElementById(id)?.focus(); };
  const submit = async (e) => {
    e.preventDefault(); setFormErr('');
    const em = email.trim().toLowerCase();
    if (!login && !name.trim()) return fail('a-name', 'Enter your name');
    if (!/^\S+@\S+\.\S+$/.test(em)) return fail('a-email', 'Enter a valid email');
    if (login ? !pass : pass.length < 6) return fail('a-pass', login ? 'Enter your password' : 'Use at least 6 characters');
    setBusy(true);
    try {
      const res = login ? await api.login(em, pass) : await api.register(name.trim(), em, pass);
      setToken(res.token);
      onAuthed(res.user, !login);
    } catch (err) {
      const map = { name: 'a-name', email: 'a-email', password: 'a-pass' };
      if (err.field && map[err.field]) fail(map[err.field], err.message); else setFormErr(err.message);
    } finally { setBusy(false); }
  };
  const clear = (id) => errors[id] && setErrors({});
  return (
    <div className="auth">
      <div className="confetti" aria-hidden="true">{confetti.map((s, i) => <i key={i} style={s} />)}</div>
      <div className="card">
        <GiftArt />
        <div className="row" style={{ justifyContent: 'center', marginBottom: 6 }}><Logo /></div>
        <p className="muted" style={{ textAlign: 'center', marginBottom: 16 }}>{login ? 'Log in to your private gift planner' : 'Create your private gift planner'}</p>
        <form onSubmit={submit} noValidate>
          {formErr && <div className="formerr" role="alert">{formErr}</div>}
          {!login && <div className="field"><label htmlFor="a-name">Name</label><input id="a-name" ref={first} maxLength={60} autoComplete="name" value={name} aria-invalid={errors['a-name'] ? 'true' : undefined} onChange={(e) => { setName(e.target.value); clear('a-name'); }} /><span className="err">{errors['a-name']}</span></div>}
          <div className="field"><label htmlFor="a-email">Email</label><input id="a-email" ref={login ? first : undefined} type="email" autoComplete="email" value={email} aria-invalid={errors['a-email'] ? 'true' : undefined} onChange={(e) => { setEmail(e.target.value); clear('a-email'); }} /><span className="err">{errors['a-email']}</span></div>
          <div className="field"><label htmlFor="a-pass">Password</label><input id="a-pass" type="password" autoComplete={login ? 'current-password' : 'new-password'} value={pass} aria-invalid={errors['a-pass'] ? 'true' : undefined} onChange={(e) => { setPass(e.target.value); clear('a-pass'); }} /><span className="err">{errors['a-pass']}</span></div>
          <button className="btn block" disabled={busy}>{busy ? 'Please wait…' : login ? 'Log in' : 'Create account'}</button>
          {login && <p className="hint">The demo account is filled in: demo@giftmemory.app / demo123</p>}
        </form>
        <p className="small" style={{ textAlign: 'center', marginTop: 12 }}>
          {login ? 'New here? ' : 'Already have an account? '}<button type="button" className="btn link" onClick={switchMode}>{login ? 'Create an account' : 'Log in'}</button>
        </p>
      </div>
    </div>
  );
}
