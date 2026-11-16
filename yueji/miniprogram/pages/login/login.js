const { cloud } = require('../../utils/cloud');

Page({
  data: {
    loggingIn: false,
    loginError: '',
    topPad: 60
  },

  onLoad() {
    const h = getApp().globalData.statusBarHeight || 20;
    this.setData({ topPad: h + 40 });
  },

  onShow() {
    // 若已登录则直接返回
    this.checkSession();
  },

  async checkSession() {
    const { data: session } = await cloud.auth.getSession();
    if (session) {
      this.enterApp();
    }
  },

  async onWorkBuddyLogin() {
    this.setData({ loggingIn: true, loginError: '' });
    const { error } = await cloud.auth.signInWithWorkBuddyMiniProgram({
      redirectPath: 'pages/login/login'
    });
    this.setData({
      loggingIn: false,
      loginError: error && error.code !== 'cancelled' ? (error.message || '登录失败，请重试') : ''
    });
  },

  onSignedIn() {
    this.enterApp();
  },

  enterApp() {
    wx.showToast({ title: '登录成功', icon: 'success' });
    // 返回上一页，或跳到首页
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
    } else {
      wx.switchTab({ url: '/pages/home/home' });
    }
  }
});
