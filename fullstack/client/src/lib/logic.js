// Pure helpers, gift catalog and planner rules (ported from the single-file app).

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const TYPES = [['Birthday', '🎂'], ['Anniversary', '💞'], ['Festival', '🪔'], ['Wedding', '💍'], ['Farewell', '👋'], ['Other', '🎉']];
export const typeEmoji = (t) => (TYPES.find((x) => x[0] === t) || TYPES[5])[1];
export const uid = () => Math.random().toString(36).slice(2, 10);
export const today = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
export const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const parse = (s) => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
export const addDays = (n) => { const d = today(); d.setDate(d.getDate() + n); return iso(d); };
export const fmt = (s) => { if (!s) return ''; const d = typeof s === 'string' ? parse(s) : s; return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
export const money = (n) => '₹' + Math.round(Number(n || 0)).toLocaleString('en-IN');
export const splitList = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);
export const initials = (n) => n.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
export const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
export const leftWords = (n) => (n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : `In ${n} days`);
export const thisYear = () => today().getFullYear();
export function nextOccurrence(dateStr, recurring) {
  const d = parse(dateStr), t = today();
  if (!recurring) return d;
  let n = new Date(t.getFullYear(), d.getMonth(), d.getDate());
  if (n < t) n = new Date(t.getFullYear() + 1, d.getMonth(), d.getDate());
  return n;
}
export const daysUntil = (d) => Math.round((d - today()) / 86400000);
export const norm = (s = '') => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
export function isSimilar(a, b) {
  const x = norm(a), y = norm(b);
  if (!x || !y) return false;
  if (x === y || x.includes(y) || y.includes(x)) return true;
  const wa = new Set(x.split(' ')), wb = new Set(y.split(' '));
  const common = [...wa].filter((w) => wb.has(w)).length;
  return common / Math.max(wa.size, wb.size) >= 0.6;
}
const stem = (w) => w.replace(/(es|s)$/, '');
export function dislikeHits(r, name, cat) {
  const words = norm(`${name} ${CATS.find((c) => c.id === cat)?.name || ''}`).split(' ').map(stem);
  return (r?.dislikes || []).filter((d) => norm(d).split(' ').map(stem).some((w) => w.length > 2 && words.includes(w)));
}

// ================= gift catalog =================
export const CATS = [
  { id: 'books', name: 'Books & reading', e: '📚', keys: ['book', 'read', 'novel'] },
  { id: 'coffee', name: 'Coffee & tea', e: '☕', keys: ['coffee', 'tea'] },
  { id: 'garden', name: 'Plants & garden', e: '🪴', keys: ['garden', 'plant'] },
  { id: 'music', name: 'Music', e: '🎧', keys: ['music', 'song', 'concert'] },
  { id: 'gadgets', name: 'Gadgets', e: '🔌', keys: ['gadget', 'tech', 'phone'] },
  { id: 'sports', name: 'Sports', e: '🏏', keys: ['cricket', 'football', 'sport', 'fitness', 'gym', 'yoga'] },
  { id: 'travel', name: 'Travel', e: '🧳', keys: ['travel', 'trip'] },
  { id: 'art', name: 'Art & craft', e: '🎨', keys: ['art', 'sketch', 'paint', 'draw', 'craft'] },
  { id: 'kitchen', name: 'Kitchen', e: '🍳', keys: ['cook', 'bake', 'kitchen', 'food'] },
  { id: 'fashion', name: 'Fashion & clothes', e: '👜', keys: ['fashion', 'clothes', 'style', 'saree', 'dress'] },
  { id: 'jewellery', name: 'Jewellery', e: '💍', keys: ['jewel', 'earring', 'ring'] },
  { id: 'sweets', name: 'Sweets & treats', e: '🍫', keys: ['sweet', 'chocolate', 'dessert'] },
  { id: 'beauty', name: 'Self-care', e: '🧴', keys: ['beauty', 'perfume', 'skincare', 'spa', 'self care'] },
  { id: 'home', name: 'Home decor', e: '🕯️', keys: ['home', 'decor', 'candle'] },
  { id: 'experience', name: 'Experiences', e: '🎟️', keys: ['movie', 'experience', 'adventure'] },
  { id: 'games', name: 'Games', e: '🎲', keys: ['game', 'puzzle'] },
  { id: 'frames', name: 'Photo frames', e: '🖼️', keys: ['photo', 'frame', 'memory'], personal: true },
  { id: 'mugs', name: 'Custom mugs', e: '🫖', keys: ['mug'], personal: true },
  { id: 'resin', name: 'Resin keepsakes', e: '💠', keys: ['resin', 'keepsake'], personal: true },
  { id: 'albums', name: 'Photo books', e: '📸', keys: ['album', 'scrapbook', 'photobook'], personal: true },
  { id: 'stationery', name: 'Diaries & planners', e: '📓', keys: ['diary', 'planner', 'stationery', 'journal', 'calendar'], personal: true },
  { id: 'cards', name: 'Custom cards', e: '💌', keys: ['card', 'letter'], personal: true },
];
const C = (cat, e, name, price) => ({ id: `${cat}-${norm(name).replace(/ /g, '-')}`, cat, e, name, price });
export const CATALOG = [
  C('books', '📖', 'Bestseller novel set', 899), C('books', '📱', 'E-reader', 9999), C('books', '🔖', 'Personalised bookmark', 299), C('books', '💡', 'Clip-on reading lamp', 649),
  C('coffee', '☕', 'Filter coffee hamper', 1499), C('coffee', '🫖', 'Tea sampler box', 799), C('coffee', '🫗', 'French press', 1199), C('coffee', '🍵', 'Ceramic mug set', 699),
  C('garden', '🪴', 'Planter set', 1199), C('garden', '🧤', 'Gardening tool kit', 999), C('garden', '🌱', 'Herb seed kit', 449), C('garden', '🌳', 'Bonsai plant', 1599),
  C('music', '🎧', 'Wireless earbuds', 2499), C('music', '🔊', 'Bluetooth speaker', 1899), C('music', '🎫', 'Concert tickets', 3000), C('music', '💿', 'Vinyl record', 1800),
  C('gadgets', '🔋', 'Power bank', 1299), C('gadgets', '⌚', 'Smartwatch', 3999), C('gadgets', '🗣️', 'Smart speaker', 3499), C('gadgets', '⌨️', 'Mechanical keyboard', 2999),
  C('sports', '👕', 'Team jersey', 1499), C('sports', '🧤', 'Batting gloves', 1199), C('sports', '🧘', 'Yoga mat', 899), C('sports', '🍶', 'Smart water bottle', 1299),
  C('travel', '🧳', 'Travel organiser', 999), C('travel', '😴', 'Neck pillow set', 699), C('travel', '🗺️', 'Weekend getaway voucher', 5000), C('travel', '📔', 'Travel journal', 650),
  C('art', '✏️', 'Sketchbook set', 599), C('art', '🎨', 'Watercolour kit', 1099), C('art', '🖌️', 'Art class voucher', 1500),
  C('kitchen', '🍲', 'Recipe book', 599), C('kitchen', '🧂', 'Spice box', 899), C('kitchen', '👩‍🍳', 'Cooking workshop pass', 1800),
  C('fashion', '👜', 'Handbag', 2199), C('fashion', '🧣', 'Silk saree', 2500), C('fashion', '🕶️', 'Sunglasses', 1499),
  C('jewellery', '💎', 'Silver earrings', 1799), C('jewellery', '📿', 'Jewellery box', 899),
  C('sweets', '🍫', 'Chocolate hamper', 999), C('sweets', '🍬', 'Mithai box', 799),
  C('beauty', '🌸', 'Perfume', 1999), C('beauty', '🛁', 'Spa gift set', 1299),
  C('home', '🕯️', 'Scented candle set', 699), C('home', '🛋️', 'Cushion covers', 799),
  C('frames', '🖼️', 'Photo collage frame', 899), C('frames', '🪵', 'Engraved wooden frame', 1199), C('frames', '🌙', 'LED photo lamp', 1499),
  C('mugs', '🫶', 'Couple name mug', 449), C('mugs', '✨', 'Colour-change photo mug', 549), C('mugs', '🍵', 'Initial letter mug', 349),
  C('resin', '🌸', 'Preserved flower resin frame', 1899), C('resin', '🔑', 'Resin initial keychain', 299), C('resin', '🌊', 'Resin name plate', 1499),
  C('albums', '📸', 'Photo book, 20 pages', 1299), C('albums', '📒', 'Handmade scrapbook', 999), C('albums', '🧲', 'Photo fridge magnets, set of 6', 349),
  C('stationery', '📓', 'Name-printed diary', 599), C('stationery', '🗓️', 'Custom photo calendar', 699),
  C('cards', '💌', 'Handmade pop-up card', 249), C('cards', '✉️', 'Photo greeting card', 199),
  C('experience', '🍿', 'Movie night hamper', 899), C('experience', '📺', 'Streaming subscription', 1499), C('experience', '🪂', 'Adventure day out', 3500),
  C('games', '♟️', 'Board game', 1299), C('games', '🧩', '1000-piece puzzle', 699),
];
export const catOf = (id) => CATS.find((c) => c.id === id);
export const isPersonal = (item) => !!catOf(item.cat)?.personal;
export const OCC_TAGS = [
  ['Birthday', '🎂', ['books', 'coffee', 'garden', 'music', 'gadgets', 'sports', 'art', 'fashion', 'sweets', 'frames', 'mugs', 'cards', 'games', 'experience', 'kitchen', 'albums']],
  ['Anniversary', '💝', ['frames', 'albums', 'resin', 'jewellery', 'experience', 'home', 'mugs', 'cards', 'travel']],
  ['Love & romance', '❤️', ['jewellery', 'resin', 'frames', 'mugs', 'sweets', 'experience', 'cards', 'beauty', 'albums']],
  ['Wedding', '💍', ['home', 'kitchen', 'albums', 'frames', 'resin', 'jewellery', 'travel']],
  ['Congratulations', '🎉', ['gadgets', 'books', 'stationery', 'cards', 'sweets', 'coffee', 'experience']],
  ['Thank you', '🙏', ['sweets', 'coffee', 'garden', 'cards', 'mugs', 'home', 'beauty']],
  ['Festival', '🪔', ['sweets', 'home', 'fashion', 'jewellery', 'coffee', 'garden', 'cards']],
  ['Farewell', '👋', ['stationery', 'travel', 'frames', 'albums', 'mugs', 'cards', 'books']],
];
export const occTagFor = (type) => OCC_TAGS.find((t) => t[0] === type)?.[0] || 'any';
export const catalogItem = (id) => CATALOG.find((x) => x.id === id);
export function catsForLikes(r) {
  const out = new Set();
  (r?.likes || []).forEach((l) => { const n = norm(l); CATS.forEach((c) => { if (c.keys.some((k) => n.includes(k))) out.add(c.id); }); });
  return [...out];
}

// ================= data =================
export const DEMO_EMAIL = 'demo@giftmemory.app';
export function seed() {
  const mom = uid(), arjun = uid(), priya = uid();
  const momB = uid(), arjunB = uid(), farewell = uid(), anniv = uid();
  const past = (n, years) => { const d = parse(addDays(n)); d.setFullYear(d.getFullYear() - years); return iso(d); };
  const y = thisYear();
  const G = (recipientId, occasionId, name, price, status, dateGiven, e, cat) => ({ id: uid(), recipientId, occasionId, name, price, status, link: '', dateGiven, purchasedDate: dateGiven || null, e, cat });
  return migrate({
    settings: { yearlyBudget: 25000, theme: 'system', planPerson: mom, planOcc: momB },
    recipients: [
      { id: mom, name: 'Mom', relationship: 'Mother', likes: ['gardening', 'books', 'filter coffee'], dislikes: ['perfume'], notes: 'Prefers cotton over synthetic. Size M.' },
      { id: arjun, name: 'Arjun', relationship: 'Brother', likes: ['cricket', 'music', 'gadgets'], dislikes: ['clothes'], notes: '' },
      { id: priya, name: 'Priya', relationship: 'Best friend', likes: ['travel', 'sketching'], dislikes: ['chocolate'], notes: 'Allergic to nuts.' },
    ],
    occasions: [
      { id: momB, recipientId: mom, title: "Mom's birthday", type: 'Birthday', date: past(5, 55), recurring: true, budget: 3000, remindDays: 14 },
      { id: arjunB, recipientId: arjun, title: "Arjun's birthday", type: 'Birthday', date: past(23, 24), recurring: true, budget: 2000, remindDays: 30 },
      { id: farewell, recipientId: priya, title: "Priya's farewell", type: 'Farewell', date: addDays(60), recurring: false, budget: 1500, remindDays: 14 },
      { id: anniv, recipientId: mom, title: 'Parents’ anniversary', type: 'Anniversary', date: past(150, 30), recurring: true, budget: 4000, remindDays: 14 },
    ],
    gifts: [
      G(mom, null, 'Silk saree', 2500, 'given', '2024-06-10', '🧣', 'fashion'),
      G(mom, anniv, 'Indoor plant set', 900, 'given', `${y}-01-14`, '🪴', 'garden'),
      G(arjun, null, 'Bluetooth speaker', 1800, 'given', '2025-03-12', '🔊', 'music'),
      G(priya, null, 'Travel journal', 650, 'given', `${y}-08-15`, '📔', 'travel'),
      G(mom, momB, 'Filter coffee hamper', 1499, 'idea', null, '☕', 'coffee'),
      G(arjun, arjunB, 'Batting gloves', 1199, 'idea', null, '🧤', 'sports'),
    ],
  });
}
export function migrate(d = {}) {
  return {
    settings: { yearlyBudget: 0, theme: 'system', planPerson: null, planOcc: null, ...(d.settings || {}) },
    recipients: (d.recipients || []).map((r) => ({ likes: [], dislikes: [], notes: '', relationship: '', ...r })),
    occasions: (d.occasions || []).map((o) => ({ type: 'Other', remindDays: 14, budget: 0, recurring: true, ...o })),
    gifts: (d.gifts || []).map((g) => ({ link: '', purchasedDate: null, dateGiven: null, occasionId: null, e: '🎁', cat: null, personal: null, ...g })),
  };
}

// Selectors that need the planner data (db)
export const person = (db, id) => db.recipients.find((r) => r.id === id);
export const occasion = (db, id) => db.occasions.find((o) => o.id === id);
export const giftsFor = (db, rid) => db.gifts.filter((g) => g.recipientId === rid);
export const spentOn = (db, occId) => db.gifts.filter((g) => g.occasionId === occId && g.status !== 'idea').reduce((s, g) => s + Number(g.price || 0), 0);
export const plannedOn = (db, occId) => db.gifts.filter((g) => g.occasionId === occId && g.status === 'idea').reduce((s, g) => s + Number(g.price || 0), 0);
export const withNext = (o) => { const next = nextOccurrence(o.date, o.recurring); return { ...o, next, left: daysUntil(next) }; };
export const upcoming = (db, days) => db.occasions.map(withNext).filter((o) => o.left >= 0 && o.left <= days).sort((a, b) => a.left - b.left);
const yearOf = (g) => { const d = g.purchasedDate || g.dateGiven; return d ? parse(d).getFullYear() : null; };
export const spentThisYear = (db) => db.gifts.filter((g) => g.status !== 'idea' && yearOf(g) === thisYear()).reduce((s, g) => s + Number(g.price || 0), 0);
export const nextFor = (db, rid) => db.occasions.filter((o) => o.recipientId === rid).map(withNext).filter((o) => o.left >= 0).sort((a, b) => a.left - b.left)[0];

export function planPerson(db) { return person(db, db.settings.planPerson) || db.recipients[0] || null; }
export function planOcc(db) {
  const p = planPerson(db); if (!p) return null;
  const o = occasion(db, db.settings.planOcc);
  if (o && o.recipientId === p.id) return withNext(o);
  return nextFor(db, p.id) || null;
}
export function boxItems(db) {
  const p = planPerson(db), o = planOcc(db); if (!p) return [];
  return db.gifts.filter((g) => g.recipientId === p.id && g.status !== 'given' && (o ? g.occasionId === o.id : !g.occasionId));
}
export function giftState(db, item, p) {
  if (!p) return { clash: [] };
  const o = planOcc(db);
  const mine = giftsFor(db, p.id);
  const inBox = mine.find((g) => g.status !== 'given' && isSimilar(g.name, item.name) && (o ? g.occasionId === o.id : !g.occasionId));
  const prev = mine.find((g) => g !== inBox && isSimilar(g.name, item.name));
  return { inBox, prev, clash: dislikeHits(p, item.name, item.cat) };
}

// ================= reminders =================
// btn: [label, action, value] where action is 'plan' | 'plan-box' | 'go' | 'add-occ'
export function reminders(db) {
  const out = [];
  db.occasions.map(withNext).filter((o) => o.left >= 0 && o.left <= (o.remindDays || 14)).forEach((o) => {
    const p = person(db, o.recipientId);
    const gs = db.gifts.filter((g) => g.occasionId === o.id);
    const bought = gs.some((g) => g.status !== 'idea');
    const spent = spentOn(db, o.id);
    if (!gs.length) out.push({ level: o.left <= 7 ? 'urgent' : 'warn', ic: '⏰', title: `${o.title}: ${leftWords(o.left).toLowerCase()}`, text: 'No gift planned yet.', btn: ['Plan now', 'plan', o.id], sort: o.left });
    else if (!bought && o.left <= 7) out.push({ level: 'urgent', ic: '🛒', title: `Buy the gift for ${o.title}`, text: `${leftWords(o.left)}. ${plural(gs.length, 'idea')} in the gift box.`, btn: ['Open gift box', 'plan-box', o.id], sort: o.left });
    else out.push({ level: 'info', ic: typeEmoji(o.type), title: `${o.title}: ${leftWords(o.left).toLowerCase()}`, text: bought ? 'Gift bought. Mark it given on the day.' : `${plural(gs.length, 'idea')} saved.`, btn: ['Open gift box', 'plan-box', o.id], sort: o.left + 0.5 });
    if (o.budget > 0 && spent > o.budget) out.push({ level: 'warn', ic: '💸', title: `${o.title} is over budget`, text: `${money(spent)} spent of ${money(o.budget)}.`, btn: ['See budget', 'go', 'budget'], sort: o.left + 0.2 });
    if (p) gs.filter((g) => g.status === 'idea' && dislikeHits(p, g.name, g.cat).length).forEach((g) => out.push({ level: 'warn', ic: '🙅', title: `“${g.name}” may not suit ${p.name}`, text: `${p.name} dislikes ${dislikeHits(p, g.name, g.cat).join(', ')}.`, btn: ['Review', 'plan-box', o.id], sort: o.left + 0.3 }));
  });
  const yb = db.settings.yearlyBudget, ys = spentThisYear(db);
  if (yb > 0 && ys > yb * 0.9) out.push({ level: ys > yb ? 'urgent' : 'warn', ic: '📊', title: `${Math.round((ys / yb) * 100)}% of your ${thisYear()} budget used`, text: `${money(ys)} of ${money(yb)}.`, btn: ['See budget', 'go', 'budget'], sort: 999 });
  db.recipients.filter((r) => !db.occasions.some((o) => o.recipientId === r.id)).forEach((r) => out.push({ level: 'info', ic: '📅', title: `Add ${r.name}’s birthday`, text: 'So GiftMemory can remind you in time.', btn: ['Add occasion', 'add-occ', r.id], sort: 1000 }));
  const rank = { urgent: 0, warn: 1, info: 2 };
  return out.sort((a, b) => rank[a.level] - rank[b.level] || a.sort - b.sort);
}
