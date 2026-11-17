const app = getApp();
const api = require('../../utils/api');

Page({
  data: {
    roomId: 0,
    statusBarH: 20,
    detail: null,
    minutes: 30,
    note: '',
    checkinOpen: false,
    loading: true,
    loadError: '',
    submitting: false
  },

  onLoad(query) {
    this.setData({
      statusBarH: app.globalData.statusBarHeight || 20,
      roomId: Number(query.id) || 0
    });
  },

  onShow() { this.refresh(); },

  async refresh() {
    if (!this.data.roomId) {
      this.setData({ loading: false, loadError: '小队不存在' });
      return;
    }
    this.setData({ loading: true, loadError: '' });
    const r = await api.getRoomDetail(this.data.roomId);
    if (r.error && !r.data) {
      this.setData({ loading: false, loadError: (r.error && r.error.message) || '加载失败，点击重试' });
      return;
    }
    this.setData({ loading: false, detail: r.data, minutes: (r.data && r.data.goalMin) || 30 });
  },

  goBack() { wx.navigateBack(); },

  openCheckin() {
    if (this.data.detail && this.data.detail.needLogin) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return setTimeout(() => wx.navigateTo({ url: '/pages/login/login' }), 500);
    }
    this.setData({ checkinOpen: true });
  },
  closeCheckin() { this.setData({ checkinOpen: false }); },
  onMinutes(e) { this.setData({ minutes: e.detail.value }); },
  onNote(e) { this.setData({ note: e.detail.value }); },
  minus() { this.setData({ minutes: Math.max(1, Number(this.data.minutes) - 5) }); },
  plus() { this.setData({ minutes: Math.min(600, Number(this.data.minutes) + 5) }); },

  async submitCheckin() {
    if (this.data.submitting) return;
    const min = Math.max(1, Number(this.data.minutes) || 0);
    this.setData({ submitting: true });
    const r = await api.roomCheckin(this.data.roomId, min, this.data.note);
    this.setData({ submitting: false });
    if (r.needLogin) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return this.navigateLogin();
    }
    if (r.error) return wx.showToast({ title: r.error.message || '打卡失败', icon: 'none' });
    this.setData({ checkinOpen: false, note: '' });
    wx.showToast({ title: r.appended ? `已追加 ${min} 分钟` : `打卡成功 · +5 积分`, icon: 'success' });
    this.refresh();
  },

  copyCode() {
    const code = this.data.detail && this.data.detail.inviteCode;
    if (!code) return;
    wx.setClipboardData({
      data: code,
      success: () => wx.showToast({ title: '邀请码已复制', icon: 'success' })
    });
  },

  shareRoom() {
    const d = this.data.detail;
    if (!d) return;
    wx.setClipboardData({
      data: `来「阅迹」和我一起读书打卡！小队「${d.name}」，邀请码 ${d.inviteCode}。`,
      success: () => wx.showToast({ title: '邀请文案已复制', icon: 'success' })
    });
  },

  leave() {
    wx.showModal({
      title: '退出小队',
      content: '退出后将不再显示你的打卡进度，确定吗？',
      success: async r => {
        if (!r.confirm) return;
        const res = await api.leaveRoom(this.data.roomId);
        if (res.error) return wx.showToast({ title: res.error.message || '退出失败', icon: 'none' });
        wx.showToast({ title: '已退出小队', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 600);
      }
    });
  },

  navigateLogin() {
    setTimeout(() => wx.navigateTo({ url: '/pages/login/login' }), 500);
  }
});
