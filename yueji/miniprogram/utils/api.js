// 阅迹统一数据接口层
// 所有页面数据只经此层读写云数据库；页面不再持有任何静态业务数据。
// 私有数据（books/checkins/profiles/feed_likes）由 RLS 按 owner 隔离，
// 平台内容（feeds/badges/nearby_readers/quotes/leaderboard）公开只读。
const { cloud } = require('./cloud');
const { createTableAccess } = require('./cloud-data-access');
const { booksTable, checkinsTable } = require('./repo');

// 产品换算规则（属业务规则，不是演示数据）
const PAGES_PER_MIN = 1.2;
const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日'];
const DEFAULT_GOAL_MIN = 30;
const DEFAULT_YEAR_GOAL = 24;
const PUBLISH_POINTS = 15;
const PENDING_KEY = 'yueji_pending_checkins';

function pad(n) { return String(n).padStart(2, '0'); }
function dateKey(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function parseKey(s) {
  const p = String(s).split('-');
  return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
}
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function mondayOf(d) { return addDays(d, -((d.getDay() + 6) % 7)); }
function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }

// ---------------- 表访问定义 ----------------
const profilesTable = createTableAccess(cloud, {
  table: 'profiles',
  columns: ['id', 'nickname', 'signature', 'level', 'goal_min', 'year_goal', 'remind_on', 'report_on', 'points', 'makeup_cards', 'created_at'],
  orderBy: { column: 'created_at', ascending: false },
  fromRow: r => ({
    id: r.id, nickname: r.nickname, signature: r.signature, level: r.level,
    goalMin: r.goal_min, yearGoal: r.year_goal, remindOn: r.remind_on,
    reportOn: r.report_on, points: r.points, makeupCards: r.makeup_cards
  }),
  toRow: p => {
    const row = {};
    if (p.nickname !== undefined) row.nickname = p.nickname;
    if (p.signature !== undefined) row.signature = p.signature;
    if (p.level !== undefined) row.level = p.level;
    if (p.goalMin !== undefined) row.goal_min = p.goalMin;
    if (p.yearGoal !== undefined) row.year_goal = p.yearGoal;
    if (p.remindOn !== undefined) row.remind_on = p.remindOn;
    if (p.reportOn !== undefined) row.report_on = p.reportOn;
    if (p.points !== undefined) row.points = p.points;
    if (p.makeupCards !== undefined) row.makeup_cards = p.makeupCards;
    return row;
  }
});

const feedsTable = createTableAccess(cloud, {
  table: 'feeds',
  columns: ['id', 'author_name', 'author_level', 'ava_text', 'ava_cls', 'content', 'hl', 'suffix', 'quote', 'quote_src', 'book', 'cover_cls', 'likes', 'comments', 'show_collect', 'show_congrats', 'created_at'],
  orderBy: { column: 'created_at', ascending: false },
  fromRow: r => ({
    id: r.id, authorName: r.author_name, authorLevel: r.author_level,
    avaText: r.ava_text, avaCls: r.ava_cls, content: r.content,
    hl: r.hl, suffix: r.suffix, quote: r.quote, quoteSrc: r.quote_src,
    book: r.book, coverCls: r.cover_cls, likes: r.likes, comments: r.comments,
    showCollect: r.show_collect, showCongrats: r.show_congrats,
    createdAt: r.created_at
  }),
  toRow: f => {
    const row = {};
    if (f.authorName !== undefined) row.author_name = f.authorName;
    if (f.authorLevel !== undefined) row.author_level = f.authorLevel;
    if (f.avaText !== undefined) row.ava_text = f.avaText;
    if (f.avaCls !== undefined) row.ava_cls = f.avaCls;
    if (f.content !== undefined) row.content = f.content;
    if (f.hl !== undefined) row.hl = f.hl;
    if (f.suffix !== undefined) row.suffix = f.suffix;
    if (f.quote !== undefined) row.quote = f.quote;
    if (f.quoteSrc !== undefined) row.quote_src = f.quoteSrc;
    if (f.book !== undefined) row.book = f.book;
    if (f.coverCls !== undefined) row.cover_cls = f.coverCls;
    if (f.likes !== undefined) row.likes = f.likes;
    if (f.comments !== undefined) row.comments = f.comments;
    if (f.showCollect !== undefined) row.show_collect = f.showCollect;
    if (f.showCongrats !== undefined) row.show_congrats = f.showCongrats;
    return row;
  }
});

const feedLikesTable = createTableAccess(cloud, {
  table: 'feed_likes',
  columns: ['id', 'feed_id', 'created_at'],
  orderBy: { column: 'created_at', ascending: false },
  fromRow: r => ({ id: r.id, feedId: r.feed_id }),
  toRow: l => ({ feed_id: l.feedId })
});

const badgesTable = createTableAccess(cloud, {
  table: 'badges',
  columns: ['id', 'code', 'icon', 'name', 'description', 'rule', 'threshold', 'sort_order'],
  orderBy: { column: 'sort_order', ascending: true },
  fromRow: r => ({
    id: r.id, code: r.code, icon: r.icon, name: r.name,
    description: r.description, rule: r.rule, threshold: r.threshold,
    sortOrder: r.sort_order
  }),
  toRow: b => ({
    code: b.code, icon: b.icon, name: b.name, description: b.description,
    rule: b.rule, threshold: b.threshold, sort_order: b.sortOrder
  })
});

const nearbyTable = createTableAccess(cloud, {
  table: 'nearby_readers',
  columns: ['id', 'name', 'ava_text', 'ava_cls', 'distance', 'book', 'reading', 'sort_order'],
  orderBy: { column: 'sort_order', ascending: true },
  fromRow: r => ({
    id: r.id, name: r.name, avaText: r.ava_text, avaCls: r.ava_cls,
    distance: r.distance, book: r.book, reading: r.reading
  }),
  toRow: n => ({
    name: n.name, ava_text: n.avaText, ava_cls: n.avaCls,
    distance: n.distance, book: n.book, reading: n.reading, sort_order: n.sortOrder
  })
});

const quotesTable = createTableAccess(cloud, {
  table: 'quotes',
  columns: ['id', 'content', 'book', 'page_info', 'sort_order'],
  orderBy: { column: 'sort_order', ascending: true },
  fromRow: r => ({ id: r.id, content: r.content, book: r.book, pageInfo: r.page_info }),
  toRow: q => ({ content: q.content, book: q.book, page_info: q.pageInfo, sort_order: q.sortOrder })
});

const leaderboardTable = createTableAccess(cloud, {
  table: 'leaderboard',
  columns: ['id', 'name', 'ava_text', 'ava_cls', 'days', 'is_me', 'sort_order'],
  orderBy: { column: 'sort_order', ascending: true },
  fromRow: r => ({
    id: r.id, name: r.name, avaText: r.ava_text, avaCls: r.ava_cls,
    days: r.days, isMe: r.is_me
  }),
  toRow: l => ({
    name: l.name, ava_text: l.avaText, ava_cls: l.avaCls,
    days: l.days, is_me: l.isMe, sort_order: l.sortOrder
  })
});

// ---------------- 通用工具 ----------------
async function listOf(table) {
  const { data, error } = await table.list();
  return { rows: data || [], error: error || null };
}

async function currentSession() {
  try {
    const { data, error } = await cloud.auth.getSession();
    return { session: data || null, error: error || null };
  } catch (e) {
    return { session: null, error: { message: e.message } };
  }
}

function displayName(session) {
  const u = (session && (session.user || session)) || {};
  const raw = u.name || u.nickname || u.displayName || (u.email ? String(u.email).split('@')[0] : '');
  return raw || '书友';
}

function relativeTime(ts, now) {
  if (!ts) return '';
  const diff = now - ts;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;
  return dateKey(new Date(ts));
}

function enqueue(record) {
  try {
    const q = wx.getStorageSync(PENDING_KEY) || [];
    q.push(record);
    wx.setStorageSync(PENDING_KEY, q.slice(-30));
  } catch (e) {}
}

// ---------------- 档案 ----------------
async function createProfileFor(session) {
  const { data, error } = await profilesTable.create({
    nickname: displayName(session),
    signature: '',
    level: '拾页者 · Lv.1',
    goalMin: DEFAULT_GOAL_MIN,
    yearGoal: DEFAULT_YEAR_GOAL,
    remindOn: true,
    reportOn: true,
    points: 0,
    makeupCards: 2
  });
  return { data, error: error || null };
}

async function updateProfile(patch) {
  const { session } = await currentSession();
  if (!session) return { data: null, error: { message: '请先登录' }, needLogin: true };
  const { rows, error } = await listOf(profilesTable);
  if (error) return { data: null, error };
  if (!rows.length) {
    const created = await createProfileFor(session);
    if (created.error || !created.data) return created;
    const res = await profilesTable.update(created.data.id, patch);
    return { data: res.data, error: res.error || null };
  }
  const res = await profilesTable.update(rows[0].id, patch);
  return { data: res.data, error: res.error || null };
}

async function addPoints(n) {
  const overview = await getOverview();
  const p = overview.data && overview.data.profile;
  if (!p) return { data: null, error: { message: '请先登录' }, needLogin: true };
  return updateProfile({ points: (p.points || 0) + n });
}

// ---------------- 统计聚合（全部来自真实记录）----------------
async function getOverview() {
  const { session } = await currentSession();
  const [ck, bk, pf, qt] = await Promise.all([
    listOf(checkinsTable), listOf(booksTable), listOf(profilesTable), listOf(quotesTable)
  ]);

  let profile = pf.rows[0] || null;
  if (session && !profile) {
    const created = await createProfileFor(session);
    profile = created.data || null;
  }

  const checkins = ck.rows;
  const books = bk.rows;
  const quotes = qt.rows;
  const error = ck.error || bk.error || pf.error || qt.error || null;

  const byDate = {};
  checkins.forEach(c => {
    if (!c.date) return;
    byDate[c.date] = (byDate[c.date] || 0) + (Number(c.minutes) || 0);
  });
  const dateSet = new Set(checkins.map(c => c.date).filter(Boolean));

  const today = startOfDay(new Date());
  const todayK = dateKey(today);
  const todayMin = byDate[todayK] || 0;
  const monday = mondayOf(today);

  // 本周节奏（周一 → 周日）
  const weekBars = WEEK_LABELS.map((label, i) => {
    const d = addDays(monday, i);
    const k = dateKey(d);
    const min = byDate[k] || 0;
    const isToday = k === todayK;
    const future = d > today;
    return {
      day: label,
      min: future ? '—' : String(min),
      height: future ? 16 : (min > 0 ? Math.min(120, Math.round(min * 1.4)) : 8),
      cls: isToday ? 'today' : (min > 0 ? 'done' : '')
    };
  });
  let weekMinutes = 0;
  for (let i = 0; i < 7; i++) weekMinutes += byDate[dateKey(addDays(monday, i))] || 0;

  // 连击天数：今天已打卡则从今天算，否则从昨天算（连击保留到昨天）
  let cursor = new Date(today);
  if (!dateSet.has(todayK)) cursor = addDays(cursor, -1);
  let streak = 0;
  while (dateSet.has(dateKey(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }

  // 历史最长连续
  const sortedDates = Array.from(dateSet).sort();
  let bestStreak = 0, run = 0, prev = null;
  sortedDates.forEach(k => {
    run = (prev && dateKey(addDays(parseKey(prev), 1)) === k) ? run + 1 : 1;
    if (run > bestStreak) bestStreak = run;
    prev = k;
  });

  // 本月打卡情况
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  let passed = 0, monthChecked = 0;
  for (let d = new Date(monthStart); d <= today; d = addDays(d, 1)) {
    passed++;
    if ((byDate[dateKey(d)] || 0) > 0) monthChecked++;
  }
  const monthMissed = passed - monthChecked;
  const ratePct = passed ? Math.round(monthChecked / passed * 100) : 0;

  // 打卡热力日历（近 5 周，35 格）
  const gridStart = addDays(monday, -28);
  const heat = [];
  for (let i = 0; i < 35; i++) {
    const d = addDays(gridStart, i);
    const k = dateKey(d);
    const min = byDate[k] || 0;
    const isToday = k === todayK;
    const future = d > today;
    const level = min >= 45 ? 'l4' : min >= 30 ? 'l3' : min >= 15 ? 'l2' : min > 0 ? 'l1' : '';
    let cls = '';
    if (!future) cls = min > 0 ? (isToday ? 'today ' + level : level) : (isToday ? 'today' : 'skip');
    heat.push({
      date: k, cls, minutes: min,
      title: future ? '尚未到来' : (min > 0 ? `${k} · 阅读 ${min} 分钟` : (isToday ? `${k} · 今日还未打卡` : `${k} · 缺卡`))
    });
  }

  const totalMinutes = checkins.reduce((s, c) => s + (Number(c.minutes) || 0), 0);
  const booksDone = books.filter(b => b.status === 'DONE').length;
  const noteCount = checkins.filter(c => c.note && String(c.note).trim()).length;
  const checkinDays = dateSet.size;
  const goalMin = profile && profile.goalMin ? profile.goalMin : DEFAULT_GOAL_MIN;
  const yearGoal = profile && profile.yearGoal ? profile.yearGoal : DEFAULT_YEAR_GOAL;

  const reading = books.filter(b => b.status === 'READING');
  const cb = reading[0] || null;
  const currentBook = cb ? {
    id: cb.id,
    title: cb.title,
    author: cb.author,
    coverCls: cb.coverCls || 'bc-1',
    pct: cb.pages > 0 ? Math.round((cb.currentPage || 0) / cb.pages * 100) : 0,
    pageText: `已读至 P${cb.currentPage || 0} / ${cb.pages || 0} 页`
  } : null;

  const heroQuote = (quotes.find(q => currentBook && q.book === currentBook.title) || quotes[0] || null);
  const noteQuote = quotes.find(q => q.pageInfo) || quotes[0] || null;

  return {
    data: {
      profile,
      nickname: (profile && profile.nickname) || (session ? displayName(session) : ''),
      signature: (profile && profile.signature) || '',
      level: `拾页者 · Lv.${1 + Math.floor(checkinDays / 10)}`,
      goalMin, yearGoal,
      remindOn: profile ? profile.remindOn !== false : true,
      reportOn: profile ? profile.reportOn !== false : true,
      points: (profile && profile.points) || 0,
      makeupCards: (profile && profile.makeupCards) || 0,
      todayMin,
      todayPages: Math.round(todayMin * PAGES_PER_MIN),
      checkedIn: todayMin > 0 || dateSet.has(todayK),
      goalPct: Math.min(100, Math.round(todayMin / goalMin * 100)),
      remainMin: Math.max(0, goalMin - todayMin),
      totalHours: Math.round(totalMinutes / 60 * 10) / 10,
      weekHours: Math.round(weekMinutes / 60 * 10) / 10,
      avgMinutes: checkinDays ? Math.round(totalMinutes / checkinDays) : 0,
      booksDone, noteCount, checkinDays,
      yearPct: Math.round(booksDone / yearGoal * 100),
      streak, bestStreak, monthMissed, ratePct,
      weekBars, heat, weekDays: WEEK_LABELS,
      currentBook, heroQuote, noteQuote, quotes,
      heatMonth: `${today.getMonth() + 1} 月 · 打卡日历`
    },
    error,
    needLogin: !session
  };
}

// ---------------- 打卡 ----------------
async function createCheckin(payload) {
  const record = {
    bookTitle: payload.bookTitle || '',
    date: payload.date || dateKey(new Date()),
    minutes: Number(payload.minutes) || 0,
    streak: Number(payload.streak) || 0,
    mood: payload.mood || '',
    star: Number(payload.star) || 0,
    note: payload.note || ''
  };
  const { session } = await currentSession();
  if (!session) {
    enqueue(record);
    return { data: null, error: null, queued: true, needLogin: true };
  }
  const { data, error } = await checkinsTable.create(record);
  if (error) {
    enqueue(record);
    return { data: null, error, queued: true };
  }
  return { data, error: null };
}

async function flushPendingCheckins() {
  const { session } = await currentSession();
  if (!session) return { flushed: 0 };
  let pending = [];
  try { pending = wx.getStorageSync(PENDING_KEY) || []; } catch (e) {}
  if (!pending.length) return { flushed: 0 };
  const left = [];
  let flushed = 0;
  for (const rec of pending) {
    const { error } = await checkinsTable.create(rec);
    if (error) left.push(rec); else flushed++;
  }
  wx.setStorageSync(PENDING_KEY, left);
  return { flushed, remaining: left.length };
}

// ---------------- 书架 ----------------
async function listBooks() {
  const r = await listOf(booksTable);
  return { data: r.rows, error: r.error };
}

async function addBook(book) {
  const { session } = await currentSession();
  if (!session) return { data: null, error: { message: '请先登录' }, needLogin: true };
  const res = await booksTable.create(book);
  return { data: res.data, error: res.error || null };
}

// ---------------- 社区动态 ----------------
async function getFeed() {
  const [f, l] = await Promise.all([listOf(feedsTable), listOf(feedLikesTable)]);
  const likedIds = new Set(l.rows.map(x => String(x.feedId)));
  const now = Date.now();
  const feed = f.rows.map(r => {
    const ts = r.createdAt ? new Date(r.createdAt).getTime() : 0;
    const liked = likedIds.has(String(r.id));
    return {
      id: r.id,
      name: r.authorName,
      level: r.authorLevel || '',
      avaText: r.avaText || '',
      avaCls: r.avaCls || 'a1',
      text: r.content || '',
      hl: r.hl || '',
      suffix: r.suffix || '',
      quote: r.quote || '',
      quoteSrc: r.quoteSrc || '',
      book: r.book || '',
      coverCls: r.coverCls || '',
      likes: (r.likes || 0) + (liked ? 1 : 0),
      comments: r.comments || 0,
      liked,
      showCollect: !!r.showCollect,
      showCongrats: !!r.showCongrats,
      time: relativeTime(ts, now),
      isNew: ts > 0 && now - ts < 60000,
      createdTs: ts
    };
  }).sort((a, b) => b.createdTs - a.createdTs);
  return { data: { feed, count: feed.length }, error: f.error || l.error || null };
}

async function publishFeed(payload) {
  const { session } = await currentSession();
  if (!session) return { data: null, error: { message: '请先登录后发布' }, needLogin: true };
  const name = displayName(session);
  const overview = await getOverview();
  const { data, error } = await feedsTable.create({
    authorName: name,
    authorLevel: (overview.data && overview.data.level) || '',
    avaText: name.charAt(0) || '书',
    avaCls: 'a1',
    content: payload.text || '',
    suffix: payload.suffix || '',
    quote: payload.quote || '',
    quoteSrc: payload.quoteSrc || '',
    book: payload.book || '',
    coverCls: payload.coverCls || '',
    likes: 0, comments: 0,
    showCollect: true, showCongrats: false
  });
  if (!error) await addPoints(PUBLISH_POINTS);
  return { data, error: error || null };
}

async function toggleFeedLike(feedId) {
  const { session } = await currentSession();
  if (!session) return { data: null, error: { message: '请先登录后点赞' }, needLogin: true };
  const { rows, error } = await listOf(feedLikesTable);
  if (error) return { data: null, error };
  const hit = rows.find(r => String(r.feedId) === String(feedId));
  if (hit) {
    const res = await feedLikesTable.remove(hit.id);
    return { data: { liked: false }, error: res.error || null };
  }
  const res = await feedLikesTable.create({ feedId: Number(feedId) });
  return { data: { liked: !res.error }, error: res.error || null };
}

// ---------------- 徽章 / 附近 / 榜单 ----------------
async function getBadges() {
  const [b, ov] = await Promise.all([listOf(badgesTable), getOverview()]);
  const o = ov.data || {};
  const values = {
    streak: o.streak || 0,
    checkinDays: o.checkinDays || 0,
    booksDone: o.booksDone || 0,
    noteCount: o.noteCount || 0
  };
  const badges = b.rows.map(x => {
    const current = values[x.rule] || 0;
    const threshold = x.threshold || 0;
    return {
      id: x.id, icon: x.icon, name: x.name, description: x.description,
      rule: x.rule, threshold, current,
      got: current >= threshold,
      progress: threshold ? Math.min(100, Math.round(current / threshold * 100)) : 0
    };
  });
  return { data: badges, error: b.error || ov.error || null };
}

async function getNearby() {
  const r = await listOf(nearbyTable);
  return { data: r.rows, error: r.error };
}

async function getLeaderboard() {
  const [lb, ov] = await Promise.all([listOf(leaderboardTable), getOverview()]);
  const o = ov.data || {};
  const rows = lb.rows.map(r => r.isMe
    ? Object.assign({}, r, { days: o.streak || 0, name: o.nickname || r.name })
    : Object.assign({}, r));
  rows.sort((a, b) => (b.days || 0) - (a.days || 0));
  const all = rows.map((r, i) => Object.assign({}, r, {
    no: String(i + 1),
    me: !!r.isMe,
    days: r.days || 0
  }));
  return {
    data: { podium: all.slice(0, 3), rankList: all.slice(3), all },
    error: lb.error || ov.error || null
  };
}

module.exports = {
  // 会话
  currentSession,
  // 综合统计
  getOverview,
  // 档案
  updateProfile, addPoints,
  // 打卡
  createCheckin, flushPendingCheckins,
  // 书架
  listBooks, addBook,
  // 社区
  getFeed, publishFeed, toggleFeedLike,
  // 我的 / 榜单
  getBadges, getNearby, getLeaderboard,
  // 常量（产品规则）
  PAGES_PER_MIN, PUBLISH_POINTS,
  // 底层表（供扩展）
  tables: { profilesTable, feedsTable, feedLikesTable, badgesTable, nearbyTable, quotesTable, leaderboardTable, booksTable, checkinsTable }
};
