import { useEffect, useRef, useState } from 'react';
import Emo from './Emo.jsx';
import { ChipGroup, Empty, PersNote, PersonTiles, RadioChip, useApp } from './Pieces.jsx';
import {
  CATS, boxItems, catOf, dislikeHits, fmt, giftsFor, iso, isSimilar, leftWords, money, norm, occasion, person,
  planOcc, planPerson, spentOn, splitList, thisYear, today, typeEmoji, uid, withNext,
} from '../lib/logic.js';

// ---------- shell ----------
export function Modal({ sheet, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal?.();
    const f = d?.querySelector('input:not([type=radio]):not([type=checkbox]), select, textarea, input[type=radio]:checked');
    f?.focus();
  }, []);
  return (
    <dialog ref={ref} className={sheet ? 'sheet' : ''} aria-labelledby="modal-title"
      onCancel={(e) => { e.preventDefault(); onClose(); }} onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      <div className="modal">{children}</div>
    </dialog>
  );
}
const Head = ({ title, onClose }) => <div className="between"><h2 id="modal-title">{title}</h2><button type="button" className="btn link" onClick={onClose}>Close</button></div>;

// Form field with label and inline error
function Field({ id, label, error, children }) {
  return <div className="field"><label htmlFor={id}>{label}</label>{children}<span className="err" id={`e-${id}`}>{error}</span></div>;
}
const useErrors = () => {
  const [errors, setErrors] = useState({});
  const fail = (id, msg) => { setErrors({ [id]: msg }); document.getElementById(id)?.focus(); return false; };
  const clear = (id) => errors[id] && setErrors({ ...errors, [id]: '' });
  return [errors, fail, clear];
};
const inv = (errors, id) => (errors[id] ? 'true' : undefined);

function OccRadio({ name, o, checked, onChange }) {
  return (
    <label className="rc"><input type="radio" name={name} value={o.id} checked={checked} onChange={onChange} />
      <span className="face"><span className="dot" /><span><b><Emo e={typeEmoji(o.type)} /> {o.title}</b><br /><span className="small muted">{fmt(o.next)}{o.budget ? `, budget ${money(o.budget)}` : ''}</span></span>
        <span className={`pill ${o.left >= 0 && o.left <= 7 ? 'red' : ''}`}>{o.left < 0 ? 'Passed' : leftWords(o.left)}</span></span></label>
  );
}

// ---------- planning for ----------
export function PlanPicker({ close }) {
  const { db, act } = useApp();
  const p = planPerson(db), cur = planOcc(db);
  const [pid, setPid] = useState(p?.id);
  const occs = db.occasions.filter((o) => o.recipientId === pid).map(withNext).sort((a, b) => (a.left < 0) - (b.left < 0) || a.next - b.next);
  const initialOcc = (id) => (id === p?.id ? (cur?.id || '') : (db.occasions.filter((o) => o.recipientId === id).map(withNext).sort((a, b) => (a.left < 0) - (b.left < 0) || a.next - b.next)[0]?.id || ''));
  const [oid, setOid] = useState(() => initialOcc(p?.id));
  const submit = (e) => {
    e.preventDefault();
    act.mutate((d) => { d.settings.planPerson = pid; d.settings.planOcc = oid || null; });
    close(); act.toast(`Shopping for ${person(db, pid).name}`);
  };
  return (
    <>
      <Head title="Planning gifts for" onClose={close} />
      <form onSubmit={submit} noValidate>
        <fieldset><legend>Person</legend><PersonTiles selectedId={pid} name="pp-person" onPick={(id) => { setPid(id); setOid(initialOcc(id)); }} /></fieldset>
        <fieldset><legend>Occasion</legend><div className="rlist" role="radiogroup">
          <label className="rc"><input type="radio" name="pp-occ" value="" checked={!oid} onChange={() => setOid('')} /><span className="face"><span className="dot" /><span><b>No specific occasion</b><br /><span className="small muted">Just saving ideas</span></span><span /></span></label>
          {occs.map((o) => <OccRadio key={o.id} name="pp-occ" o={o} checked={oid === o.id} onChange={() => setOid(o.id)} />)}
        </div></fieldset>
        <button className="btn block">Start shopping</button>
      </form>
    </>
  );
}

// ---------- gift box (side sheet) ----------
export function GiftBox({ close }) {
  const { db, act } = useApp();
  const p = planPerson(db);
  if (!p) return <><Head title="Gift box" onClose={close} /><Empty>Add someone first. <button className="btn sm" onClick={() => act.modal('person', {})}>Add person</button></Empty></>;
  const o = planOcc(db), items = boxItems(db);
  const total = items.reduce((s, g) => s + Number(g.price || 0), 0);
  const spent = o ? spentOn(db, o.id) : 0, ideas = items.filter((g) => g.status === 'idea').reduce((s, g) => s + Number(g.price || 0), 0);
  const left = o?.budget ? o.budget - spent - ideas : null;
  return (
    <>
      <Head title={`Gift box for ${p.name}`} onClose={close} />
      <button className="card" onClick={() => act.modal('plan', {})} style={{ textAlign: 'left', cursor: 'pointer' }}><p className="small muted">Occasion</p>
        <b>{o ? <><Emo e={typeEmoji(o.type)} /> {o.title}, {leftWords(o.left).toLowerCase()}</> : 'No specific occasion'}</b><span className="small" style={{ color: 'var(--green)', fontWeight: 700, marginLeft: 6 }}>Change</span></button>
      {items.length ? (
        <>
          <div className="stack">{items.map((g) => {
            const clash = dislikeHits(p, g.name, g.cat);
            return (
              <div className="card lcard" key={g.id}><span className="emo"><Emo e={g.e || '🎁'} /></span><div>
                <div className="between"><h3>{g.name}</h3><b>{money(g.price)}</b></div>
                <p className="small muted">{g.status === 'purchased' ? `Bought on ${fmt(g.purchasedDate)}` : 'Idea'}</p><PersNote g={g} />
                {clash.length > 0 && <p className="small" style={{ color: 'var(--danger)', fontWeight: 600 }}>{p.name} dislikes {clash.join(', ')}</p>}
                <div className="actions">{g.status === 'idea' && <button className="btn sm ghost" onClick={() => act.modal('status', { id: g.id, to: 'purchased' })}>Mark bought</button>}
                  <button className="btn sm" onClick={() => act.modal('status', { id: g.id, to: 'given' })}>Mark given</button>
                  <button className="btn sm danger" onClick={() => act.removeItem(g.id)}>Remove</button></div>
              </div></div>
            );
          })}</div>
          <div className="card"><h3 style={{ marginBottom: 6 }}>Bill details</h3>
            <div className="billrow"><span>Ideas in box</span><span>{money(ideas)}</span></div>
            <div className="billrow"><span>Already bought</span><span>{money(o ? spent : items.filter((g) => g.status === 'purchased').reduce((s, g) => s + Number(g.price || 0), 0))}</span></div>
            {o?.budget ? <><div className="billrow"><span>Budget</span><span>{money(o.budget)}</span></div>
              <div className="billrow total"><span>{left < 0 ? 'Over budget by' : 'Left in budget'}</span><span style={{ color: left < 0 ? 'var(--danger)' : 'var(--green)' }}>{money(Math.abs(left))}</span></div></>
              : <div className="billrow total"><span>Total</span><span>{money(total)}</span></div>}
          </div>
          {items.some((g) => g.status === 'idea') && <button className="btn block" onClick={act.buyAll}>Mark all ideas as bought</button>}
        </>
      ) : <Empty>Your gift box is empty. Browse gifts and tap ADD.</Empty>}
      <div className="row"><button className="btn ghost" onClick={() => { close(); act.go('browse'); }}>Browse gifts</button>
        <button className="btn ghost" onClick={() => act.modal('gift', { rid: p.id, oid: o?.id || '' })}>Add your own</button></div>
    </>
  );
}

// ---------- duplicate / dislike warning before adding a catalog item ----------
export function DupWarning({ close, item }) {
  const { db, act } = useApp();
  const p = planPerson(db);
  const dups = giftsFor(db, p.id).filter((g) => isSimilar(g.name, item.name));
  const clash = dislikeHits(p, item.name, item.cat);
  const [choice, setChoice] = useState('other');
  const submit = (e) => {
    e.preventDefault(); close();
    if (choice === 'add') act.addItem(item, true); else act.browse({ bCat: item.cat, bPrice: 'any' });
  };
  return (
    <>
      <Head title="Wait, check this first" onClose={close} />
      <div className="warnbox">
        {dups.length > 0 && <><p><b>{p.name} may already have this.</b></p><ul>{dups.map((m) => <li key={m.id}>{m.name}: {m.status === 'given' ? `given on ${fmt(m.dateGiven)}` : m.status === 'purchased' ? 'already bought' : 'already saved as an idea'}</li>)}</ul></>}
        {clash.length > 0 && <p><b>{p.name} dislikes {clash.join(', ')}.</b></p>}
      </div>
      <form onSubmit={submit} noValidate><fieldset><legend>What would you like to do?</legend><div className="rlist" role="radiogroup">
        <label className="rc"><input type="radio" name="dup" value="other" checked={choice === 'other'} onChange={() => setChoice('other')} /><span className="face"><span className="dot" /><span><b>Pick something else</b><br /><span className="small muted">See other {catOf(item.cat)?.name.toLowerCase() || 'gifts'}</span></span><span /></span></label>
        <label className="rc"><input type="radio" name="dup" value="add" checked={choice === 'add'} onChange={() => setChoice('add')} /><span className="face"><span className="dot" /><span><b>Add it anyway</b><br /><span className="small muted">I know, it’s different this time</span></span><span /></span></label>
      </div></fieldset><button className="btn block">Continue</button></form>
    </>
  );
}

// ---------- personalise a keepsake ----------
export function Personalise({ close, item, existingId }) {
  const { db, act } = useApp();
  const existing = existingId ? db.gifts.find((g) => g.id === existingId) : null;
  const p = existing ? person(db, existing.recipientId) : planPerson(db);
  const cur = existing?.personal || {};
  const [text, setText] = useState(cur.text ?? p?.name ?? '');
  const [message, setMessage] = useState(cur.message || '');
  const [wrap, setWrap] = useState(cur.wrap || 'none');
  const [errors, fail, clear] = useErrors();
  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return fail('ps-text', 'Add a name or short text, or choose “Add without personalising”');
    const personal = { text: text.trim(), message: message.trim(), wrap };
    close();
    if (existing) { act.mutate((d) => { d.gifts.find((g) => g.id === existing.id).personal = personal; }); act.toast('Personalisation saved'); }
    else act.addItem(item, true, personal);
    return true;
  };
  return (
    <>
      <Head title="Personalise this gift" onClose={close} />
      <div className="card preview"><span className="emo" aria-hidden="true"><Emo e={item.e} /></span><div><h3>{item.name}</h3><p className="small muted">For {p?.name || ''}, {money(item.price)}</p></div></div>
      <form onSubmit={submit} noValidate>
        <Field id="ps-text" label="Name or text to print" error={errors['ps-text']}><input id="ps-text" maxLength={40} value={text} aria-invalid={inv(errors, 'ps-text')} onChange={(e) => { setText(e.target.value); clear('ps-text'); }} placeholder="e.g. Happy 55th, Amma" /></Field>
        <div className="field"><label htmlFor="ps-msg">Message for the note card (optional)</label><input id="ps-msg" maxLength={120} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="A few words from you" /><span className="small muted">{message.length}/120</span></div>
        <fieldset><legend>Gift wrap</legend><ChipGroup name="ps-wrap" value={wrap} onChange={setWrap} options={[['none', 'No wrap'], ['plain', 'Plain'], ['festive', 'Festive'], ['kraft paper', 'Kraft paper']]} /></fieldset>
        <div className="row"><button className="btn">{existing ? 'Save personalisation' : 'Add to gift box'}</button>
          {!existing && <button type="button" className="btn ghost" onClick={() => { close(); act.addItem(item, true, null); }}>Add without personalising</button>}</div>
      </form>
    </>
  );
}

// ---------- add / edit person ----------
export function PersonForm({ close, id }) {
  const { db, act } = useApp();
  const r = id ? person(db, id) : null;
  const [name, setName] = useState(r?.name || '');
  const [rel, setRel] = useState(r?.relationship || '');
  const [ints, setInts] = useState(() => CATS.filter((c) => r?.likes.some((l) => norm(l) === norm(c.name) || c.keys.some((k) => norm(l).includes(k)))).map((c) => c.name.toLowerCase()));
  const [likes, setLikes] = useState((r?.likes || []).filter((l) => !CATS.some((c) => norm(l) === norm(c.name))).join(', '));
  const [dislikes, setDislikes] = useState(r?.dislikes.join(', ') || '');
  const [notes, setNotes] = useState(r?.notes || '');
  const [bday, setBday] = useState('');
  const [budget, setBudget] = useState('');
  const [errors, fail, clear] = useErrors();
  const toggle = (v) => setInts(ints.includes(v) ? ints.filter((x) => x !== v) : [...ints, v]);
  const submit = (e) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return fail('p-name', 'Enter a name');
    if (db.recipients.some((x) => x.id !== r?.id && norm(x.name) === norm(n))) return fail('p-name', `${n} is already in your list`);
    if (!r && budget !== '' && Number(budget) < 0) return fail('p-budget', 'Budget can’t be negative');
    const data = { name: n, relationship: rel.trim(), likes: [...new Set([...ints, ...splitList(likes)])], dislikes: splitList(dislikes), notes: notes.trim() };
    if (r) { act.mutate((d) => Object.assign(person(d, r.id), data)); close(); act.toast('Changes saved'); return true; }
    act.mutate((d) => {
      const nr = { id: uid(), ...data }; d.recipients.push(nr);
      let occId = null;
      if (bday) { occId = uid(); d.occasions.push({ id: occId, recipientId: nr.id, title: `${n}’s birthday`, type: 'Birthday', date: bday, recurring: true, budget: Number(budget) || 0, remindDays: 14 }); }
      d.settings.planPerson = nr.id; d.settings.planOcc = occId;
    });
    close(); act.toast(`Added ${n}`);
    return true;
  };
  return (
    <>
      <Head title={r ? `Edit ${r.name}` : 'Add a person'} onClose={close} />
      <form onSubmit={submit} noValidate>
        <div className="grid2">
          <Field id="p-name" label="Name" error={errors['p-name']}><input id="p-name" maxLength={60} value={name} aria-invalid={inv(errors, 'p-name')} onChange={(e) => { setName(e.target.value); clear('p-name'); }} /></Field>
          <div className="field"><label htmlFor="p-rel">Relationship</label><input id="p-rel" maxLength={40} placeholder="Sister, colleague…" value={rel} onChange={(e) => setRel(e.target.value)} /></div>
        </div>
        <fieldset><legend>Interests (tap all that apply)</legend><div className="chiprow">
          {CATS.map((c) => { const v = c.name.toLowerCase(); return <RadioChip key={c.id} type="checkbox" name="p-int" value={v} label={`${c.e} ${c.name}`} checked={ints.includes(v)} onChange={() => toggle(v)} />; })}
        </div></fieldset>
        <div className="field"><label htmlFor="p-likes">Other likes</label><input id="p-likes" placeholder="Separate with commas" value={likes} onChange={(e) => setLikes(e.target.value)} /></div>
        <div className="field"><label htmlFor="p-dislikes">Dislikes</label><input id="p-dislikes" placeholder="e.g. perfume, chocolate" value={dislikes} onChange={(e) => setDislikes(e.target.value)} /></div>
        <div className="field"><label htmlFor="p-notes">Notes</label><input id="p-notes" maxLength={500} placeholder="Sizes, allergies, favourite brands" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        {!r && <div className="grid2">
          <div className="field"><label htmlFor="p-bday">Birthday (optional)</label><input id="p-bday" type="date" value={bday} onChange={(e) => setBday(e.target.value)} /></div>
          <Field id="p-budget" label="Birthday budget (₹)" error={errors['p-budget']}><input id="p-budget" type="number" min="0" inputMode="numeric" value={budget} aria-invalid={inv(errors, 'p-budget')} onChange={(e) => { setBudget(e.target.value); clear('p-budget'); }} /></Field>
        </div>}
        <button className="btn block">{r ? 'Save changes' : 'Add person'}</button>
      </form>
    </>
  );
}

// ---------- add / edit occasion ----------
export function OccasionForm({ close, id, rid }) {
  const { db, act } = useApp();
  const o = id ? occasion(db, id) : null;
  const [pid, setPid] = useState(o?.recipientId || rid || planPerson(db)?.id);
  const [type, setType] = useState(o?.type || 'Birthday');
  const [title, setTitle] = useState(o?.title || '');
  const [auto, setAuto] = useState(!o);
  const [date, setDate] = useState(o?.date || '');
  const [budget, setBudget] = useState(o?.budget || '');
  const [remind, setRemind] = useState(String(o?.remindDays || 14));
  const [rec, setRec] = useState(o ? (o.recurring ? 'yes' : 'no') : 'yes');
  const [errors, fail, clear] = useErrors();
  useEffect(() => { if (auto) { const p = person(db, pid); if (p) setTitle(`${p.name}’s ${type.toLowerCase()}`); } }, [pid, type, auto, db]);
  const submit = (e) => {
    e.preventDefault();
    if (!pid) { act.toast('Choose who it’s for'); return false; }
    if (!title.trim()) return fail('o-title', 'Name the occasion');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail('o-date', 'Pick a date');
    if (budget !== '' && Number(budget) < 0) return fail('o-budget', 'Budget can’t be negative');
    const data = { recipientId: pid, type, title: title.trim(), date, budget: Number(budget) || 0, remindDays: Number(remind), recurring: rec === 'yes' };
    act.mutate((d) => { if (o) Object.assign(occasion(d, o.id), data); else d.occasions.push({ id: uid(), ...data }); });
    close(); act.toast(o ? 'Changes saved' : 'Occasion added');
    return true;
  };
  return (
    <>
      <Head title={o ? 'Edit occasion' : 'Add an occasion'} onClose={close} />
      <form onSubmit={submit} noValidate>
        <fieldset><legend>For</legend><PersonTiles selectedId={pid} name="o-person" onPick={setPid} /></fieldset>
        <fieldset><legend>Type</legend><div className="rgrid" role="radiogroup">
          {[['Birthday', '🎂'], ['Anniversary', '💞'], ['Festival', '🪔'], ['Wedding', '💍'], ['Farewell', '👋'], ['Other', '🎉']].map(([t, e]) => <label className="rc" key={t}><input type="radio" name="o-type" value={t} checked={type === t} onChange={() => setType(t)} /><span className="face"><i>{e}</i>{t}</span></label>)}
        </div></fieldset>
        <Field id="o-title" label="Name" error={errors['o-title']}><input id="o-title" maxLength={80} value={title} aria-invalid={inv(errors, 'o-title')} onChange={(e) => { setTitle(e.target.value); setAuto(false); clear('o-title'); }} /></Field>
        <div className="grid2">
          <Field id="o-date" label="Date" error={errors['o-date']}><input id="o-date" type="date" value={date} aria-invalid={inv(errors, 'o-date')} onChange={(e) => { setDate(e.target.value); clear('o-date'); }} /></Field>
          <Field id="o-budget" label="Budget (₹)" error={errors['o-budget']}><input id="o-budget" type="number" min="0" inputMode="numeric" value={budget} aria-invalid={inv(errors, 'o-budget')} onChange={(e) => { setBudget(e.target.value); clear('o-budget'); }} /></Field>
        </div>
        <fieldset><legend>Remind me</legend><ChipGroup name="o-remind" value={remind} onChange={setRemind} options={[3, 7, 14, 30].map((d) => [String(d), `${d} days before`])} /></fieldset>
        <fieldset><legend>Repeats</legend><ChipGroup name="o-rec" value={rec} onChange={setRec} options={[['yes', 'Every year'], ['no', 'Just once']]} /></fieldset>
        <button className="btn block">{o ? 'Save changes' : 'Add occasion'}</button>
      </form>
    </>
  );
}

// ---------- add / edit own gift idea ----------
export function GiftForm({ close, id, rid, oid }) {
  const { db, act } = useApp();
  const g = id ? db.gifts.find((x) => x.id === id) : null;
  const [pid, setPid] = useState(g?.recipientId || rid || planPerson(db)?.id);
  const occsFor = (p) => db.occasions.filter((x) => x.recipientId === p).map(withNext).filter((x) => x.left >= 0 || x.id === g?.occasionId).sort((a, b) => a.next - b.next);
  const defaultOcc = (p) => {
    if (g) return g.occasionId || '';
    if (oid !== undefined && oid !== null && p === (rid || planPerson(db)?.id)) return oid;
    return p === planPerson(db)?.id ? (planOcc(db)?.id || '') : (occsFor(p)[0]?.id || '');
  };
  const [occ, setOcc] = useState(() => defaultOcc(pid));
  const [name, setName] = useState(g?.name || '');
  const [cat, setCat] = useState(g?.cat || '');
  const [price, setPrice] = useState(g?.price || '');
  const [link, setLink] = useState(g?.link || '');
  const [force, setForce] = useState('no');
  const [errors, fail, clear] = useErrors();
  const p = person(db, pid), n = name.trim();
  const dups = n ? db.gifts.filter((x) => x.recipientId === pid && x.id !== g?.id && isSimilar(x.name, n)) : [];
  const clash = n && p ? dislikeHits(p, n, cat) : [];
  const warn = dups.length || clash.length;
  const submit = (e) => {
    e.preventDefault();
    if (!pid) { act.toast('Choose who it’s for'); return false; }
    if (!n) return fail('g-name', 'Enter a gift');
    if (price !== '' && Number(price) < 0) return fail('g-price', 'Price can’t be negative');
    if (link && !/^https?:\/\/\S+$/i.test(link.trim())) return fail('g-link', 'Links start with http:// or https://');
    if (warn && force !== 'yes') { act.toast('Choose “Save it anyway” to keep this gift'); return false; }
    const data = { recipientId: pid, occasionId: occ || null, name: n, price: Number(price) || 0, link: link.trim(), cat: cat || null, e: catOf(cat)?.e || '🎁' };
    act.mutate((d) => { if (g) Object.assign(d.gifts.find((x) => x.id === g.id), data); else d.gifts.push({ id: uid(), ...data, status: 'idea', dateGiven: null, purchasedDate: null, personal: null }); });
    close(); act.toast(g ? 'Changes saved' : 'Idea saved');
    return true;
  };
  const occs = occsFor(pid);
  return (
    <>
      <Head title={g ? 'Edit gift' : 'Add your own gift idea'} onClose={close} />
      <form onSubmit={submit} noValidate>
        <fieldset><legend>For</legend><PersonTiles selectedId={pid} name="g-person" onPick={(x) => { setPid(x); setOcc(defaultOcc(x)); }} /></fieldset>
        <fieldset><legend>Occasion</legend><div className="rlist" role="radiogroup">
          <label className="rc"><input type="radio" name="g-occ" value="" checked={!occ} onChange={() => setOcc('')} /><span className="face"><span className="dot" /><b>No occasion</b><span /></span></label>
          {occs.map((x) => <OccRadio key={x.id} name="g-occ" o={x} checked={occ === x.id} onChange={() => setOcc(x.id)} />)}
        </div></fieldset>
        <Field id="g-name" label="Gift" error={errors['g-name']}><input id="g-name" maxLength={100} autoComplete="off" value={name} aria-invalid={inv(errors, 'g-name')} onChange={(e) => { setName(e.target.value); clear('g-name'); }} /></Field>
        <div aria-live="polite">{warn ? (
          <div className="warnbox" role="alert">
            {dups.length > 0 && <><b>{p.name} may already have this.</b><ul>{dups.map((m) => <li key={m.id}>{m.name}: {m.status === 'given' ? `given on ${fmt(m.dateGiven)}` : m.status === 'purchased' ? 'already bought' : 'already saved'}</li>)}</ul></>}
            {clash.length > 0 && <p><b>{p.name} dislikes {clash.join(', ')}.</b></p>}
            <div style={{ marginTop: 8 }}><ChipGroup name="g-dupchoice" label="Duplicate choice" value={force} onChange={setForce} options={[['no', 'Pick something else'], ['yes', 'Save it anyway']]} /></div>
          </div>
        ) : null}</div>
        <fieldset><legend>Category</legend><ChipGroup name="g-cat" scroll value={cat} onChange={setCat} options={[['', '🎁 Other'], ...CATS.map((c) => [c.id, `${c.e} ${c.name}`])]} /></fieldset>
        <div className="grid2">
          <Field id="g-price" label="Price (₹)" error={errors['g-price']}><input id="g-price" type="number" min="0" inputMode="numeric" value={price} aria-invalid={inv(errors, 'g-price')} onChange={(e) => { setPrice(e.target.value); clear('g-price'); }} /></Field>
          <Field id="g-link" label="Link (optional)" error={errors['g-link']}><input id="g-link" type="url" placeholder="https://" value={link} aria-invalid={inv(errors, 'g-link')} onChange={(e) => { setLink(e.target.value); clear('g-link'); }} /></Field>
        </div>
        <button className="btn block">{g ? 'Save changes' : 'Save idea'}</button>
      </form>
    </>
  );
}

// ---------- mark bought / given ----------
export function StatusForm({ close, id, to }) {
  const { db, act } = useApp();
  const g = db.gifts.find((x) => x.id === id);
  const given = to === 'given';
  const [price, setPrice] = useState(g?.price || '');
  const [date, setDate] = useState(iso(today()));
  const [errors, fail, clear] = useErrors();
  if (!g) return null;
  const submit = (e) => {
    e.preventDefault();
    if (price !== '' && Number(price) < 0) return fail('s-price', 'Price can’t be negative');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail('s-date', 'Pick a date');
    act.mutate((d) => {
      const x = d.gifts.find((y) => y.id === id);
      x.price = Number(price) || 0;
      if (given) { x.status = 'given'; x.dateGiven = date; if (!x.purchasedDate) x.purchasedDate = date; } else { x.status = 'purchased'; x.purchasedDate = date; }
    });
    close(); act.toast(given ? `${g.name} marked as given` : `${g.name} marked as bought`);
    return true;
  };
  return (
    <>
      <Head title={given ? 'Mark as given' : 'Mark as bought'} onClose={close} />
      <div className="card lcard"><span className="emo"><Emo e={g.e || '🎁'} /></span><div><h3>{g.name}</h3><p className="small muted">For {person(db, g.recipientId)?.name || ''}</p></div></div>
      <form onSubmit={submit} noValidate>
        <div className="grid2">
          <Field id="s-price" label="Price paid (₹)" error={errors['s-price']}><input id="s-price" type="number" min="0" inputMode="numeric" value={price} aria-invalid={inv(errors, 's-price')} onChange={(e) => { setPrice(e.target.value); clear('s-price'); }} /></Field>
          <Field id="s-date" label={given ? 'Date given' : 'Date bought'} error={errors['s-date']}><input id="s-date" type="date" value={date} aria-invalid={inv(errors, 's-date')} onChange={(e) => { setDate(e.target.value); clear('s-date'); }} /></Field>
        </div>
        <button className="btn block">{given ? 'Mark as given' : 'Mark as bought'}</button>
      </form>
    </>
  );
}

// ---------- yearly budget ----------
export function YearlyForm({ close }) {
  const { db, act } = useApp();
  const [v, setV] = useState(db.settings.yearlyBudget || '');
  const [errors, fail, clear] = useErrors();
  const submit = (e) => {
    e.preventDefault();
    if (v !== '' && Number(v) < 0) return fail('y-budget', 'Budget can’t be negative');
    act.mutate((d) => { d.settings.yearlyBudget = Number(v) || 0; });
    close(); act.toast('Budget saved');
    return true;
  };
  return (
    <>
      <Head title={`${thisYear()} gift budget`} onClose={close} />
      <form onSubmit={submit} noValidate>
        <fieldset><legend>Quick pick</legend><ChipGroup name="y-quick" value={String(v)} onChange={(x) => { setV(x); clear('y-budget'); }} options={[10000, 25000, 50000].map((x) => [String(x), money(x)])} /></fieldset>
        <Field id="y-budget" label="Or enter an amount (₹)" error={errors['y-budget']}><input id="y-budget" type="number" min="0" inputMode="numeric" value={v} aria-invalid={inv(errors, 'y-budget')} onChange={(e) => { setV(e.target.value); clear('y-budget'); }} /></Field>
        <button className="btn block">Save budget</button>
      </form>
    </>
  );
}
