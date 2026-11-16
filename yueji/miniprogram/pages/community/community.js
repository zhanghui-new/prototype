const app = getApp();
const api = require('../../utils/api');

Page({
  data: {
    pane: 'feed',
    feed: [],
    feedCount: 0,
    podium: [],
    rankList: [],
    nearbyList: [],
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
    const [f, n, r] = await Promise.all([
      api.getFeed(), api.getNearby(), api.getLeaderboard()
    ]);
    const failed = !!(f.error || n.error || r.error);
    this.setData({
      loading: false,
      loadError: failed ? '部分数据加载失败，点击重试' : '',
      feed: f.data ? f.data.feed : [],
      feedCount: f.data ? f.data.count : 0,
      nearbyList: n.data || [],
      podium: r.data ? r.data.podium : [],
      rankList: r.data ? r.data.rankList : []
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

  greet(e) {
    wx.showToast({ title: `已向 ${e.currentTarget.dataset.name} 打招呼 👋`, icon: 'none' });
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  }
});
