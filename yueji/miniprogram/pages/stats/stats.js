const api = require('../../utils/api');

Page({
  data: {
    streak: 0,
    bestStreak: 0,
    ratePct: 0,
    monthMissed: 0,
    recentDays: [],
    weekBars: [],
    heat: [],
    heatMonth: '',
    totalHours: 0,
    avgMinutes: 0,
    booksDone: 0,
    yearPct: 0,
    noteCount: 0,
    checkinDays: 0,
    statusBarH: 20,
    loading: true,
    loadError: ''
  },

  onLoad() {
    this.setData({ statusBarH: getApp().globalData.statusBarHeight });
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
    this.setData({
      loading: false,
      streak: data.streak,
      bestStreak: data.bestStreak,
      ratePct: data.ratePct,
      monthMissed: data.monthMissed,
      recentDays: data.weekDays,
      weekBars: data.weekBars,
      heat: data.heat,
      heatMonth: data.heatMonth,
      totalHours: data.totalHours,
      avgMinutes: data.avgMinutes,
      booksDone: data.booksDone,
      yearPct: data.yearPct,
      noteCount: data.noteCount,
      checkinDays: data.checkinDays
    });
  },

  goBack() {
    wx.navigateBack();
  },

  tapCell(e) {
    wx.showToast({ title: e.currentTarget.dataset.title, icon: 'none' });
  },

  exportReport() {
    wx.showToast({ title: `周报已生成 · 本周打卡 ${this.data.streak} 天连续`, icon: 'none' });
  }
});
