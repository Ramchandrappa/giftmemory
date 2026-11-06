import { useEffect, useState } from 'react';
import Emo from '../components/Emo.jsx';
import {
  Bar, ChipGroup, DTile, Empty, Filter, GiftListCard, OccCard, OwnCard, PCard, PersonTiles, RemCard, useApp,
} from '../components/Pieces.jsx';
import {
  CATALOG, CATS, MONTHS, OCC_TAGS, TYPES, catOf, catsForLikes, dislikeHits, fmt, giftState, giftsFor, initials,
  isPersonal, isSimilar, leftWords, money, nextFor, norm, parse, person, planPerson, plannedOn, plural, reminders,
  spentOn, spentThisYear, thisYear, typeEmoji, upcoming, withNext,
} from '../lib/logic.js';

const HERO_ART = { Birthday: ['🎂', '🎈', '🎁', '✨'], Anniversary: ['💝', '🌹', '🕯️', '✨'], Festival: ['🪔', '🎆', '🍬', '✨'], Wedding: ['💍', '💐', '🥂', '✨'], Farewell: ['👋', '🧳', '💌', '✨'], Other: ['🎉', '🎁', '✨', '🎈'] };
function Art({ type }) {
  const [a, b, c, d] = HERO_ART[type] || HERO_ART.Other;
  return <div className="art" aria-hidden="true"><span><Emo e={a} live /></span><span><Emo e={b} live /></span><br /><span><Emo e={c} live /></span><span><Emo e={d} live /></span></div>;
}
const SecHead = ({ title, children }) => <div className="sechead"><h2>{title}</h2>{children}</div>;

export function Dashboard() {
  const { db, act } = useApp();
  const p = planPerson(db), up = upcoming(db, 60), rems = reminders(db);
  const liked = p ? catsForLikes(p) : [];
  const picked = p ? CATALOG.filter((x) => liked.includes(x.cat)).filter((x) => !giftState(db, x, p).clash.length) : [];
  const keepsakes = CATALOG.filter(isPersonal);
  const under = CATALOG.filter((x) => x.price <= 1000 && !isPersonal(x)).slice(0, 12);
  const memories = db.gifts.filter((g) => g.status === 'given' && g.dateGiven).sort((a, b) => b.dateGiven.localeCompare(a.dateGiven)).slice(0, 10);
  const urgent = rems.filter((r) => r.level !== 'info');
  return (
    <div className="stack">
      <section><div className="hscroll">
        {up.length ? up.slice(0, 5).map((x, i) => (
          <div className={`hero b${i % 4}`} key={x.id}><div>
            <p className="tagline">{x.type.toUpperCase()}, {x.left === 0 ? 'TODAY' : `IN ${x.left} DAYS`}</p><h3>{x.title}</h3>
            <p className="small">{fmt(x.next)}{x.budget ? `, budget ${money(x.budget)}` : ''}</p><button onClick={() => act.plan(x.id)}>Plan gift</button></div>
            <Art type={x.type} /></div>
        )) : (
          <div className="hero b0"><div><p className="tagline">GET STARTED</p><h3>Plan your next gift early</h3><p className="small">Add an occasion and we’ll remind you in time.</p>
            <button onClick={() => act.modal('occasion', {})}>Add occasion</button></div><Art type="Other" /></div>
        )}
      </div></section>
      <section><SecHead title="Gifts by occasion"><a href="#browse">See all gifts</a></SecHead>
        <div className="occtiles">{OCC_TAGS.map(([t, e]) => <button className="occtile" key={t} onClick={() => act.browse({ bOcc: t, bCat: 'all', bPrice: 'any' })}><i aria-hidden="true"><Emo e={e} /></i>{t}</button>)}</div></section>
      <section><SecHead title="Who are you shopping for?"><a href="#people">See all</a></SecHead>
        {db.recipients.length ? <PersonTiles selectedId={p?.id} name="plan-person" onPick={act.setPlanPerson} />
          : <Empty>Add the first person you buy gifts for. <button className="btn sm" onClick={() => act.modal('person', {})}>Add person</button></Empty>}</section>
      {urgent.length > 0 && <section><SecHead title="Needs attention"><a href="#reminders">All reminders</a></SecHead><div className="cgrid">{urgent.slice(0, 3).map((r, i) => <RemCard r={r} key={i} />)}</div></section>}
      <section><SecHead title="Personalised keepsakes"><span className="small muted">Add a name or message</span></SecHead><div className="hscroll">{keepsakes.map((x) => <PCard item={x} key={x.id} />)}</div></section>
      <section><SecHead title="Shop by interest"><a href="#browse">Browse all</a></SecHead>
        <div className="cats">{CATS.filter((c) => !c.personal).map((c) => <button className="cat" key={c.id} onClick={() => act.browse({ bCat: c.id, bOcc: 'any' })}><i aria-hidden="true"><Emo e={c.e} /></i><span>{c.name}</span></button>)}</div></section>
      {p && <section><SecHead title={`Picked for ${p.name}`}><span className="small muted">{liked.length ? `From likes: ${p.likes.join(', ')}` : 'Add likes to get picks'}</span></SecHead>
        <div className="hscroll">{(picked.length ? picked : CATALOG.slice(0, 8)).map((x) => <PCard item={x} key={x.id} />)}<OwnCard /></div></section>}
      <section><SecHead title="Under ₹1,000"><button onClick={() => act.browse({ bPrice: 'u1000', bCat: 'all' })}>See all</button></SecHead><div className="hscroll">{under.map((x) => <PCard item={x} key={x.id} />)}</div></section>
      {memories.length > 0 && <section><SecHead title="Gift memories"><a href="#history">Full history</a></SecHead><div className="hscroll">
        {memories.map((g, i) => <a className={`story s${i % 5}`} href="#history" key={g.id}><span className="se" aria-hidden="true"><Emo e={g.e || '🎁'} /></span><span><b>{g.name}</b><small>For {person(db, g.recipientId)?.name || 'someone'}, {MONTHS[parse(g.dateGiven).getMonth()]} {parse(g.dateGiven).getFullYear()}</small></span></a>)}
      </div></section>}
      <section><SecHead title="This year at a glance" /><div className="stats">
        <div className="stat"><b>{upcoming(db, 30).length}</b><span>occasions in 30 days</span></div>
        <div className="stat"><b>{db.gifts.filter((g) => g.status === 'idea').length}</b><span>gift ideas saved</span></div>
        <div className="stat"><b>{money(spentThisYear(db))}</b><span>spent in {thisYear()}{db.settings.yearlyBudget ? ` of ${money(db.settings.yearlyBudget)}` : ''}</span></div>
        <div className="stat"><b>{db.gifts.filter((g) => g.status === 'given').length}</b><span>gifts given</span></div></div></section>
    </div>
  );
}

export function Browse() {
  const { db, ui, setUi, act } = useApp();
  const { bCat, bPrice, bSort, bQuery, bOcc } = ui;
  const p = planPerson(db);
  const liked = p ? catsForLikes(p) : [];
  let items = CATALOG.slice();
  if (bCat === 'picked') items = items.filter((x) => liked.includes(x.cat));
  else if (bCat !== 'all') items = items.filter((x) => x.cat === bCat);
  if (bOcc !== 'any') { const tag = OCC_TAGS.find((t) => t[0] === bOcc); if (tag) items = items.filter((x) => tag[2].includes(x.cat)); }
  const q = norm(bQuery);
  if (q) {
    const under = q.match(/under (\d+)/);
    if (under) items = items.filter((x) => x.price <= Number(under[1]));
    const words = q.replace(/under \d+/, '').trim();
    if (words) items = items.filter((x) => norm(`${x.name} ${catOf(x.cat).name} ${catOf(x.cat).keys.join(' ')}`).includes(words));
  }
  if (bPrice === 'u500') items = items.filter((x) => x.price < 500);
  if (bPrice === 'u1000') items = items.filter((x) => x.price <= 1000);
  if (bPrice === '1to2') items = items.filter((x) => x.price > 1000 && x.price <= 2000);
  if (bPrice === 'o2000') items = items.filter((x) => x.price > 2000);
  if (bSort === 'low') items.sort((a, b) => a.price - b.price);
  if (bSort === 'high') items.sort((a, b) => b.price - a.price);
  if (bSort === 'rel' && liked.length) items.sort((a, b) => (liked.includes(b.cat) ? 1 : 0) - (liked.includes(a.cat) ? 1 : 0));
  const catList = [{ id: 'all', name: 'All gifts', e: '🛍️' }, ...(liked.length ? [{ id: 'picked', name: `Picked for ${p.name}`, e: '⭐' }] : []), ...CATS];
  const title = bCat === 'all' ? (bOcc !== 'any' ? `${bOcc} gifts` : 'All gifts') : catList.find((c) => c.id === bCat)?.name || 'Gifts';
  return (
    <div className="browse">
      <aside className="side" role="radiogroup" aria-label="Category">
        {catList.map((c) => <label className="rc" key={c.id}><input type="radio" name="b-cat" value={c.id} checked={bCat === c.id} onChange={() => setUi({ bCat: c.id })} /><span className="face"><i aria-hidden="true"><Emo e={c.e} /></i><span className="small bold">{c.name}</span></span></label>)}
      </aside>
      <div>
        <div className="pagehead"><div><h1>{title}</h1><p className="muted small">{plural(items.length, 'gift')}{bQuery ? ` matching “${bQuery}”` : ''}{p ? `, adding to ${p.name}’s gift box` : ''}</p></div>
          {bQuery && <button className="btn ghost sm" onClick={() => setUi({ bQuery: '' })}>Clear search</button>}</div>
        <div className="filters">
          <div className="catscroll"><ChipGroup name="b-cat2" scroll label="Category" value={bCat} onChange={(v) => setUi({ bCat: v })} options={catList.map((c) => [c.id, `${c.e} ${c.name}`])} /></div>
          <Filter legend="Occasion"><ChipGroup name="b-occ" scroll value={bOcc} onChange={(v) => setUi({ bOcc: v })} options={[['any', 'Any occasion'], ...OCC_TAGS.map(([t, e]) => [t, `${e} ${t}`])]} /></Filter>
          <Filter legend="Price"><ChipGroup name="b-price" value={bPrice} onChange={(v) => setUi({ bPrice: v })} options={[['any', 'Any price'], ['u500', 'Under ₹500'], ['u1000', 'Up to ₹1,000'], ['1to2', '₹1,000–2,000'], ['o2000', 'Above ₹2,000']]} /></Filter>
          <Filter legend="Sort by"><ChipGroup name="b-sort" value={bSort} onChange={(v) => setUi({ bSort: v })} options={[['rel', 'Relevance'], ['low', 'Price: low to high'], ['high', 'Price: high to low']]} /></Filter>
        </div>
        {items.length ? <div className="pgrid">{items.map((x) => <PCard item={x} key={x.id} />)}<OwnCard /></div>
          : <Empty>No gifts match. <button className="btn sm" onClick={() => act.modal('gift', {})}>Add your own idea</button></Empty>}
      </div>
    </div>
  );
}

export function People() {
  const { db, act } = useApp();
  return (
    <>
      <div className="pagehead"><div><h1>People</h1><p className="muted small">{plural(db.recipients.length, 'person')} you buy gifts for</p></div><button className="btn" onClick={() => act.modal('person', {})}>Add person</button></div>
      <div className="cgrid">{db.recipients.length ? db.recipients.slice().sort((a, b) => a.name.localeCompare(b.name)).map((r) => {
        const n = nextFor(db, r.id), gs = giftsFor(db, r.id);
        return (
          <article className="card" key={r.id}>
            <div className="row" style={{ flexWrap: 'nowrap' }}><span className="avatar">{initials(r.name)}</span><div style={{ flex: 1 }}><h3>{r.name}</h3><p className="small muted">{r.relationship || 'No relationship set'}</p></div>
              {n && <span className={`pill ${n.left <= 7 ? 'red' : ''}`}>{leftWords(n.left)}</span>}</div>
            <p className="small" style={{ marginTop: 10 }}>{n ? <><Emo e={typeEmoji(n.type)} /> {n.title}, {fmt(n.next)}</> : <span className="muted">No upcoming occasion</span>}</p>
            <p className="small muted">{plural(gs.filter((g) => g.status !== 'given').length, 'idea')}, {gs.filter((g) => g.status === 'given').length} given</p>
            <div className="chips" style={{ marginTop: 8 }}>{r.likes.slice(0, 4).map((l) => <span className="chip" key={l}>{l}</span>)}</div>
            <div className="actions"><button className="btn sm" onClick={() => act.shopFor(r.id)}>Shop for {r.name}</button><a className="btn sm ghost" href={`#person-${r.id}`}>Profile</a></div>
          </article>
        );
      }) : <Empty>No one here yet.</Empty>}</div>
    </>
  );
}

export function Person({ id }) {
  const { db, act } = useApp();
  const r = person(db, id);
  useEffect(() => { if (!r) act.go('people'); }, [r, act]);
  if (!r) return null;
  const occs = db.occasions.filter((o) => o.recipientId === id).map(withNext).sort((a, b) => a.next - b.next);
  const mine = giftsFor(db, id);
  const open = mine.filter((g) => g.status !== 'given');
  const given = mine.filter((g) => g.status === 'given').sort((a, b) => (b.dateGiven || '').localeCompare(a.dateGiven || ''));
  const liked = catsForLikes(r);
  const picks = CATALOG.filter((x) => liked.includes(x.cat) && !mine.some((g) => isSimilar(g.name, x.name)) && !dislikeHits(r, x.name, x.cat).length);
  return (
    <div className="stack">
      <section className="card"><div className="between"><div className="row" style={{ flexWrap: 'nowrap' }}><span className="avatar" style={{ width: 60, height: 60, fontSize: '1.2rem' }}>{initials(r.name)}</span><div><h1>{r.name}</h1><p className="muted">{r.relationship || ''}</p></div></div>
        <div className="row"><button className="btn" onClick={() => act.shopFor(r.id)}>Shop for {r.name}</button><button className="btn ghost" onClick={() => act.modal('person', { id: r.id })}>Edit</button><button className="btn danger" onClick={() => act.deletePerson(r.id)}>Delete</button></div></div>
        <div className="two" style={{ marginTop: 14 }}>
          <div><p className="small bold">Likes</p><div className="chips" style={{ marginTop: 6 }}>{r.likes.length ? r.likes.map((l) => <span className="chip" key={l}>{l}</span>) : <span className="small muted">None added</span>}</div></div>
          <div><p className="small bold" style={{ marginTop: 8 }}>Dislikes</p><div className="chips" style={{ marginTop: 6 }}>{r.dislikes.length ? r.dislikes.map((l) => <span className="chip no" key={l}>{l}</span>) : <span className="small muted">None added</span>}</div></div>
        </div>
        {r.notes && <p className="small" style={{ marginTop: 12 }}><b>Notes:</b> {r.notes}</p>}
      </section>
      {picks.length > 0 && <section><SecHead title={`Picked for ${r.name}`}><span className="small muted">Skips past gifts and dislikes</span></SecHead><div className="hscroll">{picks.map((x) => <PCard item={x} key={x.id} />)}</div></section>}
      <div className="two">
        <section><SecHead title="Gift ideas"><button onClick={() => act.modal('gift', { rid: r.id })}>+ Add idea</button></SecHead><div className="stack">{open.length ? open.map((g) => <GiftListCard g={g} key={g.id} />) : <Empty>No ideas yet.</Empty>}</div></section>
        <section><SecHead title="Occasions"><button onClick={() => act.modal('occasion', { rid: r.id })}>+ Add occasion</button></SecHead><div className="stack">{occs.length ? occs.map((o) => <OccCard o={o} key={o.id} />) : <Empty>No occasions yet.</Empty>}</div></section>
      </div>
      <section><SecHead title="Given before" /><div className="cgrid">{given.length ? given.map((g) => <GiftListCard g={g} key={g.id} />) : <Empty>Nothing given yet.</Empty>}</div></section>
    </div>
  );
}

export function Occasions() {
  const { db, ui, setUi, act } = useApp();
  const { oFilter, oType } = ui;
  let list = db.occasions.map(withNext);
  if (oFilter === 'upcoming') list = list.filter((o) => o.left >= 0);
  if (oFilter === 'month') list = list.filter((o) => o.left >= 0 && o.left <= 30);
  if (oFilter === 'past') list = list.filter((o) => o.left < 0);
  if (oType !== 'all') list = list.filter((o) => o.type === oType);
  list.sort((a, b) => (oFilter === 'past' ? b.next - a.next : a.next - b.next));
  return (
    <>
      <div className="pagehead"><div><h1>Occasions</h1><p className="muted small">{plural(list.length, 'occasion')}</p></div><button className="btn" onClick={() => act.modal('occasion', {})}>Add occasion</button></div>
      <div className="filters">
        <Filter legend="When"><ChipGroup name="o-filter" value={oFilter} onChange={(v) => setUi({ oFilter: v })} options={[['upcoming', 'Upcoming'], ['month', 'Next 30 days'], ['all', 'All'], ['past', 'Past']]} /></Filter>
        <Filter legend="Type"><ChipGroup name="o-type" scroll value={oType} onChange={(v) => setUi({ oType: v })} options={[['all', 'All types'], ...TYPES.map(([t, e]) => [t, `${e} ${t}`])]} /></Filter>
      </div>
      <div className="cgrid">{list.length ? list.map((o) => <OccCard o={o} key={o.id} />) : <Empty>No occasions here.</Empty>}</div>
    </>
  );
}

export function Ideas() {
  const { db, ui, setUi, act } = useApp();
  const { iStatus, iPerson } = ui;
  let list = db.gifts.filter((g) => (iStatus === 'open' ? g.status !== 'given' : g.status === iStatus));
  if (iPerson !== 'all') list = list.filter((g) => g.recipientId === iPerson);
  const total = list.reduce((s, g) => s + Number(g.price || 0), 0);
  return (
    <>
      <div className="pagehead"><div><h1>My gift ideas</h1><p className="muted small">{plural(list.length, 'gift')}, {money(total)}</p></div>
        <div className="row"><a className="btn ghost" href="#browse">Browse gifts</a><button className="btn" onClick={() => act.modal('gift', {})}>Add your own</button></div></div>
      <div className="filters">
        <Filter legend="Status"><ChipGroup name="i-status" value={iStatus} onChange={(v) => setUi({ iStatus: v })} options={[['open', 'All open'], ['idea', 'Ideas'], ['purchased', 'Bought, not given']]} /></Filter>
        <Filter legend="Person"><ChipGroup name="i-person" scroll value={iPerson} onChange={(v) => setUi({ iPerson: v })} options={[['all', 'Everyone'], ...db.recipients.map((r) => [r.id, r.name])]} /></Filter>
      </div>
      <div className="cgrid">{list.length ? list.map((g) => <GiftListCard g={g} who key={g.id} />) : <Empty>No gift ideas here. Browse gifts and tap ADD.</Empty>}</div>
    </>
  );
}

export function Budget() {
  const { db, act } = useApp();
  const yb = db.settings.yearlyBudget, ys = spentThisYear(db), planned = db.gifts.filter((g) => g.status === 'idea').reduce((s, g) => s + Number(g.price || 0), 0);
  const up = upcoming(db, 365);
  const inYear = (g) => { const d = g.purchasedDate || g.dateGiven; return d && parse(d).getFullYear() === thisYear(); };
  const byPerson = db.recipients.map((r) => ({ r, s: db.gifts.filter((g) => g.recipientId === r.id && g.status !== 'idea' && inYear(g)).reduce((a, g) => a + Number(g.price || 0), 0) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
  const maxP = Math.max(1, ...byPerson.map((x) => x.s));
  return (
    <>
      <div className="pagehead"><div><h1>Budget</h1><p className="muted small">{thisYear()} spending and each occasion’s budget</p></div><button className="btn ghost" onClick={() => act.modal('yearly', {})}>{yb ? 'Change yearly budget' : 'Set yearly budget'}</button></div>
      <div className="stack">
        <div className="stats"><div className="stat"><b>{money(ys)}</b><span>spent in {thisYear()}</span></div><div className="stat"><b>{money(planned)}</b><span>planned in ideas</span></div>
          <div className="stat"><b>{yb ? money(Math.max(0, yb - ys)) : '—'}</b><span>left this year</span></div><div className="stat"><b>{yb ? money(yb) : '—'}</b><span>yearly budget</span></div></div>
        <section className="card">{yb ? <Bar budget={yb} spent={ys} planned={planned} /> : <p className="small muted">Set a yearly budget to track total spending.</p>}<p className="small muted">Green is spent (bought or given), yellow is planned (ideas).</p></section>
        <div className="two">
          <section><SecHead title="Next 12 months" /><div className="stack">{up.length ? up.map((o) => {
            const s = spentOn(db, o.id), pl = plannedOn(db, o.id);
            return (
              <article className="card lcard" key={o.id}><DTile d={o.next} /><div><div className="between"><h3>{o.title}</h3>
                {o.budget && s > o.budget ? <span className="pill red">Over budget</span> : o.budget && s + pl > o.budget ? <span className="pill warn">Plans over budget</span> : o.budget ? <span className="pill green">On track</span> : null}</div>
                <Bar budget={o.budget} spent={s} planned={pl} />
                <div className="actions"><button className="btn sm ghost" onClick={() => act.modal('occasion', { id: o.id })}>Change budget</button><button className="btn sm" onClick={() => act.planBox(o.id)}>Gift box</button></div></div></article>
            );
          }) : <Empty>No occasions in the next 12 months.</Empty>}</div></section>
          <section><SecHead title="Spent per person" /><div className="card stack">{byPerson.length ? byPerson.map((x) => (
            <div key={x.r.id}><div className="between small"><b>{x.r.name}</b><span>{money(x.s)}</span></div><div className="bar" style={{ margin: '4px 0 0' }}><i style={{ width: `${(x.s / maxP) * 100}%` }} /></div></div>
          )) : <p className="small muted">Nothing spent yet this year.</p>}</div></section>
        </div>
      </div>
    </>
  );
}

export function History() {
  const { db, ui, setUi } = useApp();
  const { hYear, hPerson } = ui;
  const all = db.gifts.filter((g) => g.status === 'given' && g.dateGiven);
  const years = [...new Set(all.map((g) => parse(g.dateGiven).getFullYear()))].sort((a, b) => b - a);
  let rows = all.slice();
  if (hYear !== 'all') rows = rows.filter((g) => String(parse(g.dateGiven).getFullYear()) === hYear);
  if (hPerson !== 'all') rows = rows.filter((g) => g.recipientId === hPerson);
  rows.sort((a, b) => b.dateGiven.localeCompare(a.dateGiven));
  return (
    <>
      <div className="pagehead"><div><h1>Gift history</h1><p className="muted small">{plural(rows.length, 'gift')}, {money(rows.reduce((s, g) => s + Number(g.price || 0), 0))}</p></div></div>
      <div className="filters">
        <Filter legend="Year"><ChipGroup name="h-year" value={hYear} onChange={(v) => setUi({ hYear: v })} options={[['all', 'All years'], ...years.map((y) => [String(y), String(y)])]} /></Filter>
        <Filter legend="Person"><ChipGroup name="h-person" scroll value={hPerson} onChange={(v) => setUi({ hPerson: v })} options={[['all', 'Everyone'], ...db.recipients.map((r) => [r.id, r.name])]} /></Filter>
      </div>
      <div className="cgrid">{rows.length ? rows.map((g) => <GiftListCard g={g} who key={g.id} />) : <Empty>No gifts match.</Empty>}</div>
    </>
  );
}

export function Reminders() {
  const { db } = useApp();
  const rems = reminders(db);
  const grp = (lvl, t) => { const l = rems.filter((r) => r.level === lvl); return l.length ? <section><SecHead title={t} /><div className="cgrid">{l.map((r, i) => <RemCard r={r} key={i} />)}</div></section> : null; };
  return (
    <>
      <div className="pagehead"><div><h1>Smart reminders</h1><p className="muted small">{plural(rems.length, 'reminder')} from your occasions, ideas and budgets</p></div></div>
      <div className="stack">
        {rems.length ? <>{grp('urgent', 'Act now')}{grp('warn', 'Check soon')}{grp('info', 'Good to know')}</> : <Empty>You’re all caught up.</Empty>}
        <section className="card"><h3>How reminders work</h3><ul className="small muted" style={{ margin: '8px 0 0', paddingLeft: 18, display: 'grid', gap: 4 }}>
          <li>Each occasion starts reminding you a set number of days before. Change it when you edit the occasion.</li>
          <li>Within 7 days with no gift planned, or ideas saved but nothing bought, the reminder turns urgent.</li>
          <li>You’re warned about over-budget occasions, ideas that match a dislike, and using 90% of your yearly budget.</li></ul></section>
      </div>
    </>
  );
}

export function More() {
  const { db, user } = useApp();
  const items = [['occasions', '📅', 'Occasions', `${db.occasions.length} saved`], ['ideas', '💡', 'My gift ideas', `${db.gifts.filter((g) => g.status !== 'given').length} open`], ['budget', '💰', 'Budget', `${money(spentThisYear(db))} this year`], ['history', '🕘', 'Gift history', `${db.gifts.filter((g) => g.status === 'given').length} given`], ['account', '👤', 'Account', user.email]];
  return (
    <><div className="pagehead"><h1>More</h1></div><div className="cgrid">
      {items.map(([k, e, t, s]) => <a className="card lcard" href={`#${k}`} key={k} style={{ textDecoration: 'none', color: 'inherit' }}><span className="emo"><Emo e={e} /></span><div><h3>{t}</h3><p className="small muted">{s}</p></div></a>)}
    </div></>
  );
}

export function Account() {
  const { db, user, act } = useApp();
  const th = db.settings.theme || 'system';
  const [backup, setBackup] = useState(() => JSON.stringify(db, null, 2));
  const [err, setErr] = useState('');
  const restore = (e) => {
    e.preventDefault();
    try {
      const d = JSON.parse(backup);
      if (!Array.isArray(d.recipients) || !Array.isArray(d.occasions) || !Array.isArray(d.gifts)) throw new Error();
      if (!confirm('Replace all your data with this backup?')) return;
      act.replaceData(d, 'Backup restored');
    } catch { setErr('This isn’t a valid GiftMemory backup.'); }
  };
  const copy = () => navigator.clipboard?.writeText(backup).then(() => act.toast('Backup copied'), () => act.toast('Select the text and copy it'));
  return (
    <>
      <div className="pagehead"><div><h1>Account</h1><p className="muted small">{user.name}, {user.email}</p></div><button className="btn ghost" onClick={act.logout}>Log out</button></div>
      <div className="two">
        <div className="stack">
          <section className="card"><fieldset><legend>Theme</legend><div className="rgrid" role="radiogroup">
            {[['system', '🖥️', 'Device'], ['light', '☀️', 'Light'], ['dark', '🌙', 'Dark']].map(([v, e, l]) => <label className="rc" key={v}><input type="radio" name="theme" value={v} checked={th === v} onChange={() => act.setTheme(v)} /><span className="face"><i>{e}</i>{l}</span></label>)}
          </div></fieldset></section>
          <section className="card"><h3>Yearly budget</h3><p className="small muted" style={{ margin: '4px 0 10px' }}>{db.settings.yearlyBudget ? money(db.settings.yearlyBudget) : 'Not set'}</p><button className="btn sm ghost" onClick={() => act.modal('yearly', {})}>Change</button></section>
          <section className="card"><h3>Data</h3><p className="small muted" style={{ margin: '4px 0 0' }}>Saved securely in the cloud (MongoDB), so it is the same on every device you log in from.</p>
            <div className="actions">{user.email === 'demo@giftmemory.app' ? <button className="btn sm danger" onClick={act.resetDemo}>Reset demo data</button> : <button className="btn sm danger" onClick={act.clearAll}>Delete all my data</button>}</div></section>
        </div>
        <section className="card"><h3>Backup</h3><p className="small muted" style={{ margin: '4px 0 10px' }}>Copy this text to keep a backup, or paste one to restore.</p>
          <form onSubmit={restore} noValidate><div className="field"><label htmlFor="backup">Your data</label>
            <textarea id="backup" spellCheck="false" value={backup} aria-invalid={err ? 'true' : undefined} onChange={(e) => { setBackup(e.target.value); setErr(''); }} /><span className="err">{err}</span></div>
            <div className="row"><button type="button" className="btn sm ghost" onClick={copy}>Copy</button><button className="btn sm">Restore</button></div></form></section>
      </div>
    </>
  );
}
