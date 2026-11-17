const app = getApp();
const api = require('../../utils/api');

Page({
  data: {
    statusBarH: 20,
    loading: true,
    loadError: '',
    saving: false,
    nickname: '',
    signature: '',
    avatarCls: 'a1',
    initial: '书',
    yearGoal: 24,
    yearText: '',
    colors: [
      { cls: 'a1', label: '赭' },
      { cls: 'a2', label: '墨' },
      { cls: 'a3', label: '蓝' },
      { cls: 'a4', label: '金' }
    ],
    yearGoals: [12, 24, 36, 50]
  },

  onLoad() {
    this.setData({
      statusBarH: app.globalData.statusBarHeight || 20,
      yearText: String(new Date().getFullYear())
    });
    this.load();
  },

  goBack() { wx.navigateBack(); },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  },

  async load() {
    this.setData({ loading: true, loadError: '' });
    const res = await api.getMyProfile();
    if (res.needLogin) {
      this.setData({ loading: false, loadError: '请先登录后再编辑资料，点击前往登录' });
      return;
    }
    if (res.error || !res.data) {
      this.setData({ loading: false, loadError: '资料读取失败，点击重试' });
      return;
    }
    const p = res.data;
    const nickname = p.nickname || '';
    this.setData({
      loading: false,
      nickname,
      signature: p.signature || '',
      avatarCls: p.avatarCls || 'a1',
      initial: nickname.charAt(0) || '书',
      yearGoal: p.yearGoal || 24
    });
  },

  onNickname(e) {
    const nickname = e.detail.value;
    this.setData({ nickname, initial: nickname.charAt(0) || '书' });
  },

  onSignature(e) {
    this.setData({ signature: e.detail.value });
  },

  pickAvatar(e) {
    this.setData({ avatarCls: e.currentTarget.dataset.cls });
  },

  pickYear(e) {
    this.setData({ yearGoal: Number(e.currentTarget.dataset.year) });
  },

  async save() {
    if (this.data.saving) return;
    const nickname = (this.data.nickname || '').trim();
    if (!nickname) return wx.showToast({ title: '请填写昵称', icon: 'none' });
    this.setData({ saving: true });
    const res = await api.updateProfile({
      nickname,
      signature: (this.data.signature || '').trim(),
      avatarCls: this.data.avatarCls,
      yearGoal: this.data.yearGoal
    });
    this.setData({ saving: false });
    if (res.needLogin) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return setTimeout(() => this.goLogin(), 600);
    }
    if (res.error) {
      return wx.showToast({ title: '保存失败，请重试', icon: 'none' });
    }
    wx.showToast({ title: '资料已更新', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 700);
  }
});
