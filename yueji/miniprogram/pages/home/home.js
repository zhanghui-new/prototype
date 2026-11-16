const api = require('../../utils/api');

Page({
  data: {
    dateText: '',
    greeting: '',
    nickname: '',
    avaText: '',
    todayMin: 0,
    goalMin: 30,
    goalPct: 0,
    remainText: '',
    streak: 0,
    bestStreak: 0,
    monthMissed: 0,
    weekBars: [],
    todayPages: 0,
    weekHours: 0,
    booksDone: 0,
    noteCount: 0,
    currentBook: null,
    quoteText: '',
    quoteBook: '',
    statusBarH: 20,
    menuRightGap: 0,
    loading: true,
    loadError: ''
  },

  onLoad() {
    const g = getApp().globalData;
    this.setData({
      statusBarH: g.statusBarHeight,
      menuRightGap: Math.max(0, wx.getSystemInfoSync().windowWidth - (g.menuRight || 0) + 12)
    });
  },

  onShow() {
    this.refresh();
  },

  async refresh() {
    this.setData({ loading: true, loadError: '' });
    const { data, error } = await api.getOverview();
    if (error || !data) {
      this.setData({ loading: false, loadError: '数据加载失败，点击重试' });
      return;
    }
    const now = new Date();
    const h = now.getHours();
    const wd = ['日', '一', '二', '三', '四', '五', '六'];
    this.setData({
      loading: false,
      dateText: `${now.getMonth() + 1}月${now.getDate()}日 · 周${wd[now.getDay()]}`,
      greeting: h < 12 ? '早上好' : (h < 18 ? '下午好' : '晚上好'),
      nickname: data.nickname || '书友',
      avaText: (data.nickname || '书友').charAt(0),
      todayMin: data.todayMin,
      goalMin: data.goalMin,
      goalPct: data.goalPct,
      remainText: data.remainMin > 0 ? `剩余 ${data.remainMin} 分钟达标` : '今日目标已达成',
      streak: data.streak,
      bestStreak: data.bestStreak,
      monthMissed: data.monthMissed,
      weekBars: data.weekBars,
      todayPages: data.todayPages,
      weekHours: data.weekHours,
      booksDone: data.booksDone,
      noteCount: data.noteCount,
      currentBook: data.currentBook,
      quoteText: data.heroQuote ? data.heroQuote.content : '',
      quoteBook: data.heroQuote ? data.heroQuote.book : ''
    });
  },

  startTimer() {
    wx.navigateTo({ url: '/pages/timer/timer' });
  },

  goStats() {
    wx.navigateTo({ url: '/pages/stats/stats' });
  },

  goShelf() {
    wx.switchTab({ url: '/pages/shelf/shelf' });
  },

  goProfile() {
    wx.switchTab({ url: '/pages/profile/profile' });
  }
});
