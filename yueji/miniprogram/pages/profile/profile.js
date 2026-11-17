const api = require('../../utils/api');

Page({
  data: {
    goalMin: 30,
    remindOn: true,
    reportOn: true,
    loggedIn: false,
    userName: '',
    nickname: '',
    avaText: '',
    avatarCls: 'a1',
    level: '',
    signature: '',
    totalHours: 0,
    booksDone: 0,
    noteCount: 0,
    yearPct: 0,
    yearGoal: 24,
    yearText: '',
    points: 0,
    makeupCards: 0,
    badgeCount: 0,
    badges: [],
    statusBarH: 20,
    loading: true,
    loadError: ''
  },

  onLoad() {
    this.setData({
      statusBarH: getApp().globalData.statusBarHeight,
      yearText: String(new Date().getFullYear())
    });
  },

  onShow() {
    this.refresh();
  },

  async refresh() {
    this.setData({ loading: true, loadError: '' });
    const [ov, bg, ss] = await Promise.all([
      api.getOverview(), api.getBadges(), api.currentSession()
    ]);
    if (ov.error || bg.error || !ov.data) {
      this.setData({ loading: false, loadError: '数据加载失败，点击重试' });
      return;
    }
    const d = ov.data;
    const badges = bg.data || [];
    this.setData({
      loading: false,
      goalMin: d.goalMin,
      remindOn: d.remindOn,
      reportOn: d.reportOn,
      loggedIn: !!ss.session,
      userName: d.nickname,
      nickname: d.nickname,
      avaText: (d.nickname || '书').charAt(0),
      avatarCls: d.avatarCls || 'a1',
      level: d.level,
      signature: d.signature || '还没有签名，去设置一句吧',
      totalHours: d.totalHours,
      booksDone: d.booksDone,
      noteCount: d.noteCount,
      yearPct: d.yearPct,
      yearGoal: d.yearGoal,
      points: d.points,
      makeupCards: d.makeupCards,
      badgeCount: badges.length,
      badges
    });
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  },

  goEditProfile() {
    if (!this.data.loggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return this.goLogin();
    }
    wx.navigateTo({ url: '/pages/profile-edit/profile-edit' });
  },

  async signOut() {
    const res = await new Promise(resolve => {
      wx.showModal({
        title: '退出登录',
        content: '退出后将无法读取云端书架与打卡记录。',
        confirmText: '退出',
        success: resolve
      });
    });
    if (!res.confirm) return;
    const { cloud } = require('../../utils/cloud');
    await cloud.auth.signOut();
    this.setData({ loggedIn: false, userName: '' });
    wx.showToast({ title: '已退出登录', icon: 'none' });
    this.refresh();
  },

  async saveSetting(patch, rollback, okText) {
    const { error, needLogin } = await api.updateProfile(patch);
    if (needLogin) {
      this.goLogin();
      this.refresh();
      return;
    }
    if (error) {
      this.setData(rollback);
      wx.showToast({ title: '保存失败，请重试', icon: 'none' });
      return;
    }
    if (okText) wx.showToast({ title: okText, icon: 'none' });
  },

  toggleRemind() {
    const on = !this.data.remindOn;
    this.setData({ remindOn: on });
    this.saveSetting({ remindOn: on }, { remindOn: !on }, on ? '已开启每日阅读提醒' : '已关闭每日阅读提醒');
  },

  toggleReport() {
    const on = !this.data.reportOn;
    this.setData({ reportOn: on });
    this.saveSetting({ reportOn: on }, { reportOn: !on }, on ? '已开启周报订阅' : '已关闭周报订阅');
  },

  editGoal() {
    const that = this;
    wx.showActionSheet({
      itemList: ['15 分钟', '30 分钟', '45 分钟', '60 分钟'],
      success(res) {
        const mins = [15, 30, 45, 60][res.tapIndex];
        const before = that.data.goalMin;
        that.setData({ goalMin: mins });
        that.saveSetting({ goalMin: mins }, { goalMin: before }, `目标已设为 ${mins} 分钟`);
      }
    });
  },

  makeup() {
    wx.showToast({ title: `补签卡剩余 ${this.data.makeupCards} 张`, icon: 'none' });
  },

  about() {
    wx.showToast({ title: '阅迹 V1.0 · 读书打卡小程序', icon: 'none' });
  },

  allBadges() {
    const got = this.data.badges.filter(b => b.got).length;
    wx.showToast({ title: `已解锁 ${got} 枚 · 共 ${this.data.badgeCount} 枚徽章`, icon: 'none' });
  },

  tapBadge(e) {
    const { name, got, progress, description } = e.currentTarget.dataset;
    wx.showToast({
      title: got ? `「${name}」已获得` : `「${name}」${description || ''} · ${progress}%`,
      icon: 'none'
    });
  }
});
