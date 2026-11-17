const app = getApp();
const api = require('../../utils/api');

Page({
  data: {
    pane: 'feed',
    feed: [],
    feedCount: 0,
    podium: [],
    rankList: [],
    rooms: [],
    myRooms: [],
    joining: false,
    statusBarH: 20,
    loading: true,
    loadError: ''
  },

  onLoad() {
    this.setData({ statusBarH: getApp().globalData.statusBarHeight });
  },

  onShow() {
    // 刚发布完打卡时自动切回动态流
    if (app.globalData.justPublished) {
      app.globalData.justPublished = false;
      this.setData({ pane: 'feed' });
    }
    this.refresh();
  },

  async refresh() {
    this.setData({ loading: true, loadError: '' });
    const [f, r, rm] = await Promise.all([
      api.getFeed(), api.getLeaderboard(), api.getRooms()
    ]);
    const failed = !!(f.error || r.error || rm.error);
    this.setData({
      loading: false,
      loadError: failed ? '部分数据加载失败，点击重试' : '',
      feed: f.data ? f.data.feed : [],
      feedCount: f.data ? f.data.count : 0,
      podium: r.data ? r.data.podium : [],
      rankList: r.data ? r.data.rankList : [],
      rooms: rm.data ? rm.data.rooms : [],
      myRooms: rm.data ? rm.data.myRooms : []
    });
  },

  switchPane(e) {
    this.setData({ pane: e.currentTarget.dataset.pane });
  },

  async toggleLike(e) {
    const id = e.currentTarget.dataset.id;
    // 先做乐观更新，接口成功后保持；失败则回滚
    const feed = this.data.feed.map(item => item.id === id
      ? Object.assign({}, item, {
        liked: !item.liked,
        likes: item.likes + (item.liked ? -1 : 1)
      })
      : item);
    this.setData({ feed });
    const { error, needLogin } = await api.toggleFeedLike(id);
    if (needLogin) {
      wx.showToast({ title: '登录后即可点赞', icon: 'none' });
      this.goLogin();
    } else if (error) {
      wx.showToast({ title: '点赞失败，请重试', icon: 'none' });
    }
    if (needLogin || error) this.refresh();
  },

  comment() {
    wx.showToast({ title: '评论功能开发中', icon: 'none' });
  },

  collect() {
    wx.showToast({ title: '已收藏到摘录本', icon: 'none' });
  },

  congrats() {
    wx.showToast({ title: '已送出祝贺 🏅', icon: 'none' });
  },

  // ---------- 共读小队 ----------
  goCreateRoom() {
    wx.navigateTo({ url: '/pages/room-create/room-create' });
  },

  openRoom(e) {
    wx.navigateTo({ url: `/pages/room/room?id=${e.currentTarget.dataset.id}` });
  },

  async joinByCode() {
    if (this.data.joining) return;
    const res = await new Promise(resolve => {
      wx.showModal({
        title: '加入共读小队',
        placeholderText: '输入 6 位邀请码',
        editable: true,
        success: r => resolve(r.confirm ? r.content : null),
        fail: () => resolve(null)
      });
    });
    if (!res) return;
    const code = String(res).trim();
    if (code.length !== 6) {
      wx.showToast({ title: '邀请码为 6 位', icon: 'none' });
      return;
    }
    this.setData({ joining: true });
    const r = await api.joinRoom(code);
    this.setData({ joining: false });
    if (r.needLogin) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return this.goLogin();
    }
    if (r.error) return wx.showToast({ title: r.error.message || '加入失败', icon: 'none' });
    wx.showToast({ title: r.alreadyJoined ? '你已在该小队' : '加入成功', icon: 'success' });
    this.refresh();
    if (!r.alreadyJoined && r.data) {
      wx.navigateTo({ url: `/pages/room/room?id=${r.data.id}` });
    }
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  }
});
