import { createContext, useContext } from 'react';
import Emo from './Emo.jsx';
import {
  MONTHS, catOf, dislikeHits, fmt, giftState, initials, isPersonal, leftWords, money, nextFor, occasion, parse,
  person, planOcc, planPerson, plannedOn, spentOn, typeEmoji,
} from '../lib/logic.js';

// { db, user, act } — act holds every action (navigation, modals, data changes)
export const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

export function RadioChip({ name, value, label, checked, onChange, type = 'radio', id }) {
  return (
    <label className="rchip">
      <input type={type} name={name} value={value} checked={checked} onChange={onChange} id={id} />
      <span>{label}</span>
    </label>
  );
}

// A row of radio chips: options = [[value, label], ...]
export function ChipGroup({ name, options, value, onChange, scroll, label }) {
  return (
    <div className={`chiprow${scroll ? ' scroll' : ''}`} role="radiogroup" aria-label={label}>
      {options.map(([v, l]) => <RadioChip key={v} name={name} value={v} label={l} checked={value === v} onChange={() => onChange(v)} />)}
    </div>
  );
}

export function Filter({ legend, children }) {
  return <fieldset><legend>{legend}</legend>{children}</fieldset>;
}

export function PCard({ item }) {
  const { db, act } = useApp();
  const p = planPerson(db), o = planOcc(db), s = giftState(db, item, p);
  let badge = o
    ? <span className="pbadge">⏱ {o.left === 0 ? 'TODAY' : `${o.left} DAYS`}</span>
    : <span className="pbadge">{catOf(item.cat)?.name.toUpperCase() || ''}</span>;
  if (s.prev) badge = <span className="pbadge warn">{s.prev.status === 'given' ? `GIVEN ${s.prev.dateGiven ? parse(s.prev.dateGiven).getFullYear() : ''}` : s.prev.status === 'purchased' ? 'ALREADY BOUGHT' : 'ALREADY SAVED'}</span>;
  if (s.clash.length) badge = <span className="pbadge no">DISLIKES {s.clash[0].toUpperCase()}</span>;
  return (
    <article className="pcard">
      <div className="pimg" aria-hidden="true"><Emo e={item.e} /></div>{badge}
      <h4>{item.name}</h4>
      <p className="psub">{catOf(item.cat)?.name || ''}{isPersonal(item) && <> <span className="ptag">✎ Personalise</span></>}</p>
      <div className="pfoot"><b>{money(item.price)}</b>
        {p && (s.inBox
          ? <button className="add on" onClick={() => act.removeItem(s.inBox.id)} aria-label={`Remove ${item.name} from gift box`}>✓ ADDED</button>
          : <button className="add" onClick={() => act.addItem(item)} aria-label={`Add ${item.name} to gift box`}>ADD</button>)}
      </div>
    </article>
  );
}

export function OwnCard() {
  const { act } = useApp();
  return <button className="pcard owncard" onClick={() => act.modal('gift', {})}><i>＋</i>Add your own gift idea</button>;
}

export const DTile = ({ d }) => <div className="dtile"><b>{d.getDate()}</b><span>{MONTHS[d.getMonth()]}</span></div>;

export function Bar({ budget, spent, planned = 0 }) {
  if (!budget) return <p className="small muted">No budget set</p>;
  const over = spent > budget, ps = Math.min(100, (spent / budget) * 100), pp = Math.min(100 - ps, (planned / budget) * 100);
  return (
    <>
      <div className="bar" role="img" aria-label={`${Math.round(ps)}% of budget spent`}><i className={over ? 'over' : ''} style={{ width: `${ps}%` }} /><i className="plan" style={{ width: `${pp}%` }} /></div>
      <p className={`small ${over ? '' : 'muted'}`} style={over ? { color: 'var(--danger)', fontWeight: 700 } : undefined}>
        {money(spent)} spent{planned ? ` + ${money(planned)} planned` : ''} of {money(budget)}{over ? ', over budget' : ''}
      </p>
    </>
  );
}

export const PersNote = ({ g }) => g.personal ? (
  <p className="persnote">✎ {g.personal.text ? `“${g.personal.text}”` : 'Personalised'}{g.personal.message ? `, message: ${g.personal.message}` : ''}{g.personal.wrap && g.personal.wrap !== 'none' ? `, ${g.personal.wrap} wrap` : ''}</p>
) : null;

export const StatusPill = ({ s }) => s === 'given' ? <span className="pill green">Given</span> : s === 'purchased' ? <span className="pill warn">Bought</span> : <span className="pill">Idea</span>;

// Horizontal person picker (radio tiles) with an "Add person" tile
export function PersonTiles({ selectedId, name, onPick }) {
  const { db, act } = useApp();
  return (
    <div className="hscroll" role="radiogroup" aria-label="Planning for">
      {db.recipients.map((r) => {
        const n = nextFor(db, r.id);
        return (
          <label className="rc ptile" key={r.id}>
            <input type="radio" name={name} value={r.id} checked={r.id === selectedId} onChange={() => onPick(r.id)} />
            <span className="face"><span className="avatar">{initials(r.name)}</span><b>{r.name}</b><small>{n ? leftWords(n.left) : r.relationship || ''}</small></span>
          </label>
        );
      })}
      <button type="button" className="addtile" onClick={() => act.modal('person', {})}><i>＋</i>Add person</button>
    </div>
  );
}

export function RemCard({ r }) {
  const { act } = useApp();
  const [label, a, v] = r.btn;
  return (
    <div className={`card rcard ${r.level}`}>
      <span className="ic" aria-hidden="true"><Emo e={r.ic} /></span>
      <div><h3>{r.title}</h3><p className="small muted">{r.text}</p>
        <button className={`btn sm ${r.level === 'info' ? 'ghost' : ''}`} style={{ marginTop: 8 }} onClick={() => act.remAction(a, v)}>{label}</button>
      </div>
    </div>
  );
}

export function GiftListCard({ g, who }) {
  const { db, act } = useApp();
  const p = person(db, g.recipientId), o = g.occasionId && occasion(db, g.occasionId), clash = p ? dislikeHits(p, g.name, g.cat) : [];
  return (
    <article className="card lcard"><span className="emo" aria-hidden="true"><Emo e={g.e || '🎁'} /></span><div>
      <div className="between"><h3>{g.name}</h3><StatusPill s={g.status} /></div>
      <p className="small muted">{who ? `For ${p?.name || ''}, ` : ''}{o ? o.title : 'No occasion'}{g.price ? `, ${money(g.price)}` : ''}
        {g.link && /^https?:\/\//i.test(g.link) && <>, <a href={g.link} target="_blank" rel="noopener noreferrer">link</a></>}
        {g.status === 'given' ? `, given ${fmt(g.dateGiven)}` : ''}</p>
      <PersNote g={g} />
      {clash.length > 0 && <p className="small" style={{ color: 'var(--danger)', fontWeight: 600 }}>{p.name} dislikes {clash.join(', ')}</p>}
      {g.status !== 'given' && (
        <div className="actions">
          {g.status === 'idea' && <button className="btn sm ghost" onClick={() => act.modal('status', { id: g.id, to: 'purchased' })}>Mark bought</button>}
          <button className="btn sm" onClick={() => act.modal('status', { id: g.id, to: 'given' })}>Mark given</button>
          {catOf(g.cat)?.personal && <button className="btn sm ghost" onClick={() => act.personaliseExisting(g.id)}>✎ Personalise</button>}
          <button className="btn sm ghost" onClick={() => act.modal('gift', { id: g.id })}>Edit</button>
          <button className="btn sm danger" onClick={() => act.deleteGift(g.id)}>Delete</button>
        </div>
      )}
    </div></article>
  );
}

export function OccCard({ o }) {
  const { db, act } = useApp();
  const p = person(db, o.recipientId), past = o.left < 0;
  return (
    <article className="card lcard"><DTile d={o.next} /><div>
      <div className="between"><h3><Emo e={typeEmoji(o.type)} /> {o.title}</h3><span className={`pill ${!past && o.left <= 7 ? 'red' : ''}`}>{past ? 'Passed' : leftWords(o.left)}</span></div>
      <p className="small muted">{p?.name || ''}, {o.recurring ? 'every year' : 'one time'}, remind {o.remindDays} days before</p>
      <Bar budget={o.budget} spent={spentOn(db, o.id)} planned={plannedOn(db, o.id)} />
      <div className="actions">
        <button className="btn sm" onClick={() => act.plan(o.id)}>Plan gift</button>
        <button className="btn sm ghost" onClick={() => act.modal('occasion', { id: o.id })}>Edit</button>
        <button className="btn sm danger" onClick={() => act.deleteOccasion(o.id)}>Delete</button>
      </div>
    </div></article>
  );
}

export const Empty = ({ children }) => <div className="empty">{children}</div>;
