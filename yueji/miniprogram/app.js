const { cloud } = require('./utils/cloud');
const api = require('./utils/api');

// 全局只保留设备布局参数与页面间的一次性信号；
// 所有业务数据一律由 utils/api.js 从云数据库读取。
App({
  globalData: {
    statusBarHeight: 20,
    navBarHeight: 44,
    menuRight: 0,
    menuTop: 0,
    menuHeight: 32,
    justPublished: false
  },

  // 会话就绪 Promise：需要登录态的逻辑可 await 它
  authReady: null,

  onLaunch() {
    // 自定义导航栏需要避开系统状态栏与右上角胶囊按钮
    try {
      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      this.globalData.statusBarHeight = info.statusBarHeight || 20;
      const menu = wx.getMenuButtonBoundingClientRect();
      if (menu && menu.height) {
        this.globalData.navBarHeight = (menu.top - info.statusBarHeight) * 2 + menu.height;
        this.globalData.menuTop = menu.top;
        this.globalData.menuRight = menu.right;
        this.globalData.menuHeight = menu.height;
      }
    } catch (e) {}
  },

  onShow(options) {
    this.authReady = (async () => {
      const callback = await cloud.auth.handleWorkBuddyMiniProgramCallback(options);
      if (callback.error) return callback;
      const result = await cloud.auth.getSession();
      // 登录后自动补传离线期间暂存的打卡记录
      if (result && result.data) await api.flushPendingCheckins();
      return result;
    })();
  }
});
