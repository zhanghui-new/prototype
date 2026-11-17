const app = getApp();
const api = require('../../utils/api');

Page({
  data: {
    statusBarH: 20,
    name: '',
    book: '',
    goalMin: 30,
    goalDays: 21,
    dayOptions: [7, 14, 21, 30, 60],
    submitting: false
  },

  onLoad() {
    this.setData({ statusBarH: app.globalData.statusBarHeight || 20 });
  },

  goBack() { wx.navigateBack(); },
  onName(e) { this.setData({ name: e.detail.value }); },
  onBook(e) { this.setData({ book: e.detail.value }); },
  minusGoal() { this.setData({ goalMin: Math.max(5, this.data.goalMin - 5) }); },
  plusGoal() { this.setData({ goalMin: Math.min(240, this.data.goalMin + 5) }); },
  pickDays(e) { this.setData({ goalDays: Number(e.currentTarget.dataset.days) }); },

  async submit() {
    if (this.data.submitting) return;
    const name = (this.data.name || '').trim();
    if (!name) return wx.showToast({ title: '请填写小队名称', icon: 'none' });
    this.setData({ submitting: true });
    const res = await api.createRoom({
      name, book: (this.data.book || '').trim(),
      goalMin: this.data.goalMin, goalDays: this.data.goalDays
    });
    this.setData({ submitting: false });
    if (res.needLogin) {
      wx.showToast({ title: '请先登录后创建', icon: 'none' });
      return setTimeout(() => wx.navigateTo({ url: '/pages/login/login' }), 600);
    }
    if (res.error || !res.data) {
      return wx.showToast({ title: (res.error && res.error.message) || '创建失败', icon: 'none' });
    }
    wx.showToast({ title: '小队已创建', icon: 'success' });
    setTimeout(() => wx.redirectTo({ url: `/pages/room/room?id=${res.data.id}` }), 700);
  }
});
