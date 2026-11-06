import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Auth, { Logo } from './components/Auth.jsx';
import Emo from './components/Emo.jsx';
import { AppCtx } from './components/Pieces.jsx';
import {
  DupWarning, GiftBox, GiftForm, Modal, OccasionForm, PersonForm, Personalise, PlanPicker, StatusForm, YearlyForm,
} from './components/Modals.jsx';
import { Account, Browse, Budget, Dashboard, History, Ideas, More, Occasions, People, Person, Reminders } from './views/Views.jsx';
import { api, getToken, setToken } from './lib/api.js';
import {
  DEMO_EMAIL, boxItems, catalogItem, catsForLikes, dislikeHits, giftsFor, iso, isPersonal, isSimilar, migrate, money,
  occasion, occTagFor, person, planOcc, planPerson, plural, reminders, seed, today, uid,
} from './lib/logic.js';

const SECTIONS = [['dashboard', 'Home'], ['browse', 'Browse gifts'], ['people', 'People'], ['occasions', 'Occasions'], ['ideas', 'My gift ideas'], ['budget', 'Budget'], ['history', 'Gift history'], ['reminders', 'Reminders']];
const TABS = [['dashboard', 'Home', '🏠'], ['browse', 'Browse', '🛍️'], ['people', 'People', '👥'], ['reminders', 'Alerts', '🔔'], ['more', 'More', '☰']];
const MORE = ['more', 'occasions', 'ideas', 'budget', 'history', 'account'];
const UI0 = { bCat: 'all', bPrice: 'any', bSort: 'rel', bQuery: '', bOcc: 'any', oFilter: 'upcoming', oType: 'all', iStatus: 'open', iPerson: 'all', hYear: 'all', hPerson: 'all' };
const MODALS = { plan: PlanPicker, box: GiftBox, dup: DupWarning, personalise: Personalise, person: PersonForm, occasion: OccasionForm, gift: GiftForm, status: StatusForm, yearly: YearlyForm };

const useHash = () => {
  const [hash, setHash] = useState(() => location.hash.slice(1) || 'dashboard');
  useEffect(() => { const on = () => setHash(location.hash.slice(1) || 'dashboard'); addEventListener('hashchange', on); return () => removeEventListener('hashchange', on); }, []);
  return hash;
};

function applyTheme(t) {
  if (!t || t === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
}

export default function App() {
  const [user, setUser] = useState(null);
  const [db, setDb] = useState(null);
  const [booting, setBooting] = useState(!!getToken());
  const [ui, setUiState] = useState(UI0);
  const [modal, setModal] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [search, setSearch] = useState('');
  const [saveState, setSaveState] = useState('saved');
  const hash = useHash();
  const toastTimer = useRef(null);
  const saveTimer = useRef(null);
  const pending = useRef(null);

  const toast = useCallback((msg) => {
    setToastMsg(msg); clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400);
  }, []);

  const logout = useCallback(() => {
    clearTimeout(saveTimer.current); pending.current = null;
    setToken(null); setUser(null); setDb(null); setModal(null); setUiState(UI0); applyTheme('system');
  }, []);

  // ---------- saving to the API (debounced) ----------
  const flush = useCallback(async () => {
    const data = pending.current; if (!data) return;
    pending.current = null; setSaveState('saving');
    try { await api.saveData(data); setSaveState(pending.current ? 'saving' : 'saved'); }
    catch (e) {
      if (e.status === 401) { toast('Your session has expired. Please log in again.'); logout(); return; }
      if (!pending.current) pending.current = data;
      setSaveState('error'); toast(`Couldn’t save: ${e.message}`);
    }
  }, [toast, logout]);
  const queueSave = useCallback((data) => {
    pending.current = data; setSaveState('saving');
    clearTimeout(saveTimer.current); saveTimer.current = setTimeout(flush, 500);
  }, [flush]);
  useEffect(() => {
    const warn = (e) => { if (pending.current) { flush(); e.preventDefault(); e.returnValue = ''; } };
    addEventListener('beforeunload', warn); return () => removeEventListener('beforeunload', warn);
  }, [flush]);

  // mutate(fn): copy the data, let fn change the copy, show it and save it
  const mutate = useCallback((fn) => {
    setDb((cur) => { const next = structuredClone(cur); fn(next); queueSave(next); return next; });
  }, [queueSave]);

  // ---------- load after login ----------
  const startApp = useCallback(async (u, isNew) => {
    setUser(u);
    try {
      const { data } = await api.getData();
      let d = data ? migrate(data) : null;
      if (!d) { d = u.email === DEMO_EMAIL ? seed() : migrate({}); await api.saveData(d); }
      setDb(d); applyTheme(d.settings.theme);
      if (!location.hash) location.hash = 'dashboard';
      if (isNew) toast(`Welcome, ${u.name}`);
    } catch (e) {
      if (e.status === 401) logout(); else { toast(e.message); setUser(null); setToken(null); }
    }
  }, [toast, logout]);

  const booted = useRef(false);
  useEffect(() => {
    if (!getToken() || booted.current) return;
    booted.current = true; // run once, even under React StrictMode
    api.me().then(({ user: u }) => startApp(u)).catch(() => setToken(null)).finally(() => setBooting(false));
  }, [startApp]);

  // ---------- actions ----------
  const go = useCallback((name) => { if (location.hash.slice(1) === name) scrollTo(0, 0); else location.hash = name; }, []);
  const act = useMemo(() => {
    const a = {
      go, toast, mutate, logout,
      modal: (type, props = {}) => setModal({ type, props }),
      close: () => setModal(null),
      setUi: (patch) => setUiState((u) => ({ ...u, ...patch })),
      browse: (patch) => { setUiState((u) => ({ ...u, ...patch })); setModal(null); go('browse'); },
      setPlanPerson: (rid) => { mutate((d) => { d.settings.planPerson = rid; d.settings.planOcc = null; }); toast(`Shopping for ${person(db, rid)?.name || ''}`); },
      shopFor: (rid) => { mutate((d) => { d.settings.planPerson = rid; d.settings.planOcc = null; }); a.browse({ bOcc: 'any', bCat: catsForLikes(person(db, rid)).length ? 'picked' : 'all' }); },
      plan: (oid) => {
        const o = occasion(db, oid); if (!o) return;
        mutate((d) => { d.settings.planPerson = o.recipientId; d.settings.planOcc = o.id; });
        a.browse({ bOcc: occTagFor(o.type), bCat: catsForLikes(person(db, o.recipientId)).length ? 'picked' : 'all' });
        toast(`Shopping for ${o.title}`);
      },
      planBox: (oid) => { const o = occasion(db, oid); if (!o) return; mutate((d) => { d.settings.planPerson = o.recipientId; d.settings.planOcc = o.id; }); setModal({ type: 'box', props: {} }); },
      remAction: (kind, v) => {
        if (kind === 'plan') a.plan(v); else if (kind === 'plan-box') a.planBox(v);
        else if (kind === 'go') { setModal(null); go(v); } else if (kind === 'add-occ') a.modal('occasion', { rid: v });
      },
      addItem: (item, force, personal) => {
        const p = planPerson(db); if (!p) { a.modal('person'); return; }
        const dups = giftsFor(db, p.id).filter((g) => isSimilar(g.name, item.name));
        if ((dups.length || dislikeHits(p, item.name, item.cat).length) && !force) { a.modal('dup', { item }); return; }
        if (isPersonal(item) && personal === undefined) { a.modal('personalise', { item }); return; }
        const o = planOcc(db);
        mutate((d) => d.gifts.push({ id: uid(), recipientId: p.id, occasionId: o?.id || null, name: item.name, price: item.price, status: 'idea', link: '', dateGiven: null, purchasedDate: null, e: item.e, cat: item.cat, catalogId: item.id, personal: personal || null }));
        toast(`Added ${item.name} for ${p.name}`);
      },
      removeItem: (id) => { mutate((d) => { d.gifts = d.gifts.filter((x) => x.id !== id); }); toast('Removed from gift box'); },
      buyAll: () => { const ids = new Set(boxItems(db).filter((x) => x.status === 'idea').map((x) => x.id)); mutate((d) => d.gifts.forEach((x) => { if (ids.has(x.id)) { x.status = 'purchased'; x.purchasedDate = iso(today()); } })); toast('All ideas marked as bought'); },
      personaliseExisting: (id) => { const g = db.gifts.find((x) => x.id === id); a.modal('personalise', { item: catalogItem(g.catalogId) || { name: g.name, e: g.e, cat: g.cat, price: g.price }, existingId: id }); },
      deletePerson: (id) => {
        const r = person(db, id); if (!confirm(`Delete ${r.name} and all their occasions and gifts?`)) return;
        mutate((d) => { d.recipients = d.recipients.filter((x) => x.id !== id); d.occasions = d.occasions.filter((o) => o.recipientId !== id); d.gifts = d.gifts.filter((x) => x.recipientId !== id); });
        toast(`Deleted ${r.name}`); go('people');
      },
      deleteOccasion: (id) => {
        const o = occasion(db, id); if (!confirm(`Delete ${o.title}? Its gifts are kept.`)) return;
        mutate((d) => { d.occasions = d.occasions.filter((x) => x.id !== id); d.gifts.forEach((x) => { if (x.occasionId === id) x.occasionId = null; }); });
        toast('Occasion deleted');
      },
      deleteGift: (id) => { const g = db.gifts.find((x) => x.id === id); if (!confirm(`Delete “${g.name}”?`)) return; mutate((d) => { d.gifts = d.gifts.filter((x) => x.id !== id); }); toast('Gift deleted'); },
      setTheme: (t) => { mutate((d) => { d.settings.theme = t; }); applyTheme(t); toast('Theme updated'); },
      replaceData: (data, msg) => { const d = migrate(data); setDb(d); queueSave(d); applyTheme(d.settings.theme); toast(msg); go('dashboard'); },
      resetDemo: () => { if (confirm('Reset to the demo data?')) a.replaceData(seed(), 'Demo data restored'); },
      clearAll: () => { if (confirm('Delete all your data? This can’t be undone.')) a.replaceData({}, 'All data deleted'); },
    };
    return a;
  }, [db, go, toast, mutate, logout, queueSave]);

  // search box -> browse
  useEffect(() => {
    if (!db) return undefined;
    const t = setTimeout(() => {
      const q = search.trim();
      if (q === ui.bQuery) return;
      setUiState((u) => ({ ...u, bQuery: q, ...(q ? { bCat: 'all' } : {}) }));
      if (q && location.hash !== '#browse') location.hash = 'browse';
    }, 200);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!ui.bQuery) setSearch(''); }, [ui.bQuery]);
  useEffect(() => { scrollTo(0, 0); }, [hash]);

  // gift box button bounce when an item is added
  const items = db ? boxItems(db) : [];
  const lastCount = useRef(null);
  const [bump, setBump] = useState(0);
  useEffect(() => { if (lastCount.current !== null && items.length > lastCount.current) setBump((b) => b + 1); lastCount.current = items.length; }, [items.length]);

  if (booting) return <div className="auth"><div className="card"><p className="muted" style={{ textAlign: 'center' }}>Loading…</p></div></div>;
  if (!user) return <><Auth onAuthed={(u, isNew) => { location.hash = 'dashboard'; startApp(u, isNew); }} />{toastMsg && <div className="toast on" role="status">{toastMsg}</div>}</>;
  if (!db) return <div className="auth"><div className="card"><p className="muted" style={{ textAlign: 'center' }}>Loading your planner…</p></div></div>;

  const p = planPerson(db), o = planOcc(db);
  const rems = reminders(db), nAlert = rems.filter((r) => r.level !== 'info').length, urgent = rems.find((r) => r.level === 'urgent');
  const total = items.reduce((s, g) => s + Number(g.price || 0), 0);
  const sec = hash.startsWith('person-') ? 'people' : hash;
  const VIEWS = { dashboard: Dashboard, browse: Browse, people: People, occasions: Occasions, ideas: Ideas, budget: Budget, history: History, reminders: Reminders, account: Account, more: More };
  const View = VIEWS[hash] || Dashboard;
  const ModalBody = modal && MODALS[modal.type];

  return (
    <AppCtx.Provider value={{ db, user, ui, setUi: act.setUi, act }}>
      <div id="app">
        <header className="header">
          <div className="annc">
            {urgent ? <>⏰ {urgent.title}. <button onClick={() => act.remAction(urgent.btn[1], urgent.btn[2])}>{urgent.btn[0]}</button></>
              : <>✨ Tip: keepsakes marked ✎ can carry a name or message. <button onClick={() => act.browse({ bCat: 'frames', bOcc: 'any' })}>See keepsakes</button></>}
          </div>
          <div className="hbar">
            <a className="logo" href="#dashboard" aria-label="GiftMemory home"><span className="mark"><Emo e="🎁" live /></span><span className="word">gift<span style={{ color: 'var(--green)' }}>memory</span></span></a>
            <button className="planfor" onClick={() => act.modal(db.recipients.length ? 'plan' : 'person')} aria-label="Change who you are planning for">
              {p ? <><b>{o ? `${o.title} ${o.left <= 30 ? `in ${o.left} day${o.left === 1 ? '' : 's'}` : ''}` : `Gifts for ${p.name}`} ▾</b><span>Planning for {p.name}{o?.budget ? `, budget ${money(o.budget)}` : ''}</span></>
                : <><b>Add someone to start ▾</b><span>No one added yet</span></>}
            </button>
            <div className="hright">
              <button className="acct" onClick={() => go('account')} title={saveState === 'error' ? 'Not saved' : saveState === 'saving' ? 'Saving…' : 'All changes saved'}>{user.name.split(' ')[0]}{saveState === 'saving' ? ' ·' : saveState === 'error' ? ' ⚠' : ''}</button>
              <button key={bump} className={`boxbtn${bump ? ' bump' : ''}`} onClick={() => act.modal('box')}>
                <span aria-hidden="true"><Emo e="🎁" /></span><span>{items.length ? <><small>{plural(items.length, 'item')}</small>{money(total)}</> : 'Gift box'}</span>
              </button>
            </div>
            <label className="searchwrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
              <input type="search" placeholder="Search “coffee”, “books”, “under 1000”…" aria-label="Search gifts" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
          </div>
          <nav className="secnav" aria-label="Sections">
            {SECTIONS.map(([k, l]) => <a key={k} href={`#${k}`} aria-current={k === sec ? 'page' : undefined}>{l}{k === 'reminders' && nAlert ? ` (${nAlert})` : ''}</a>)}
          </nav>
        </header>
        <main className="main" key={hash}>
          {hash.startsWith('person-') ? <Person id={hash.slice(7)} /> : <View />}
        </main>
        <footer className="footer"><div className="in">
          <div className="about"><Logo />
            <p className="small muted" style={{ marginTop: 8, maxWidth: 340 }}>Remember every date, every preference and every gift, so the next one is never a repeat.</p>
            <p className="small muted" style={{ marginTop: 8, maxWidth: 340 }}>Emoji art: <a href="https://github.com/googlefonts/noto-emoji" style={{ display: 'inline' }}>Google Noto Emoji</a> (Apache 2.0; animated versions CC BY 4.0).</p></div>
          <div><h4>Plan</h4><a href="#browse">Browse gifts</a><a href="#people">People</a><a href="#occasions">Occasions</a><a href="#ideas">My gift ideas</a></div>
          <div><h4>Track</h4><a href="#budget">Budget</a><a href="#history">Gift history</a><a href="#reminders">Reminders</a></div>
          <div><h4>Account</h4><a href="#account">Settings and backup</a><a href="#account">Theme</a></div>
        </div></footer>
        {items.length > 0 && <button className="cartbar" onClick={() => act.modal('box')}><span><small>{plural(items.length, 'item')} for {p?.name || ''}</small>{money(total)}{o?.budget ? ` of ${money(o.budget)}` : ''}</span><span>View gift box ›</span></button>}
        <nav className="tabs" aria-label="Main">
          {TABS.map(([k, l, e]) => <a key={k} href={`#${k}`} aria-current={k === sec || (k === 'more' && MORE.includes(sec)) ? 'page' : undefined}><span aria-hidden="true"><Emo e={e} /></span>{l}{k === 'reminders' && nAlert ? ` ${nAlert}` : ''}</a>)}
        </nav>
      </div>
      {ModalBody && <Modal key={modal.type + JSON.stringify(modal.props.id || '')} sheet={modal.type === 'box'} onClose={act.close}><ModalBody close={act.close} {...modal.props} /></Modal>}
      <div className={`toast${toastMsg ? ' on' : ''}`} role="status" aria-live="polite">{toastMsg}</div>
    </AppCtx.Provider>
  );
}
