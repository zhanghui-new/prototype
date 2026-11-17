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
    // 先做乐观更新，接口返回后用真实计数校正；失败则回滚
    const feed = this.data.feed.map(item => item.id === id
      ? Object.assign({}, item, {
        liked: !item.liked,
        likes: Math.max(0, item.likes + (item.liked ? -1 : 1))
      })
      : item);
    this.setData({ feed });
    const { data, error, needLogin } = await api.toggleFeedLike(id);
    if (needLogin) {
      wx.showToast({ title: '登录后即可点赞', icon: 'none' });
      this.goLogin();
    } else if (error) {
      wx.showToast({ title: '点赞失败，请重试', icon: 'none' });
    } else if (data) {
      const synced = this.data.feed.map(item => item.id === id
        ? Object.assign({}, item, { liked: !!data.liked, likes: data.likes })
        : item);
      this.setData({ feed: synced });
    }
    if (needLogin || error) this.refresh();
  },

  async deleteFeed(e) {
    const id = e.currentTarget.dataset.id;
    const ok = await new Promise(resolve => {
      wx.showModal({
        title: '删除这条动态？',
        content: '删除后无法恢复，相关的点赞和评论也会一并移除。',
        confirmText: '删除',
        confirmColor: '#B4532A',
        success: r => resolve(!!r.confirm),
        fail: () => resolve(false)
      });
    });
    if (!ok) return;
    wx.showLoading({ title: '删除中', mask: true });
    const res = await api.deleteFeed(id);
    wx.hideLoading();
    if (res.needLogin) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return this.goLogin();
    }
    if (res.error) {
      wx.showToast({ title: res.error.message || '删除失败', icon: 'none' });
      return;
    }
    wx.showToast({ title: '已删除', icon: 'success' });
    this.refresh();
  },

  toggleComment(e) {
    const i = Number(e.currentTarget.dataset.index);
    this.setData({ [`feed[${i}].commentOpen`]: !this.data.feed[i].commentOpen });
  },

  onCommentInput(e) {
    const i = Number(e.currentTarget.dataset.index);
    this.setData({ [`feed[${i}].commentDraft`]: e.detail.value });
  },

  async submitComment(e) {
    const i = Number(e.currentTarget.dataset.index);
    const item = this.data.feed[i];
    const text = String(item.commentDraft || '').trim();
    if (!text) return wx.showToast({ title: '写点什么再发送吧', icon: 'none' });
    wx.showLoading({ title: '发送中', mask: true });
    const res = await api.addComment(item.id, text);
    wx.hideLoading();
    if (res.needLogin) {
      wx.showToast({ title: '登录后即可评论', icon: 'none' });
      return this.goLogin();
    }
    if (res.error) {
      wx.showToast({ title: res.error.message || '评论失败', icon: 'none' });
      return;
    }
    this.setData({
      [`feed[${i}].commentList`]: item.commentList.concat(res.data),
      [`feed[${i}].comments`]: item.commentList.length + 1,
      [`feed[${i}].commentDraft`]: '',
      [`feed[${i}].commentOpen`]: true
    });
  },

  async deleteComment(e) {
    const i = Number(e.currentTarget.dataset.feedIndex);
    const cid = e.currentTarget.dataset.id;
    const ok = await new Promise(resolve => {
      wx.showModal({
        title: '删除这条评论？',
        content: '删除后无法恢复。',
        confirmText: '删除',
        confirmColor: '#B4532A',
        success: r => resolve(!!r.confirm),
        fail: () => resolve(false)
      });
    });
    if (!ok) return;
    const res = await api.deleteComment(cid);
    if (res.needLogin) return this.goLogin();
    if (res.error) return wx.showToast({ title: res.error.message || '删除失败', icon: 'none' });
    const item = this.data.feed[i];
    this.setData({
      [`feed[${i}].commentList`]: item.commentList.filter(c => c.id !== cid),
      [`feed[${i}].comments`]: Math.max(0, item.commentList.length - 1)
    });
    wx.showToast({ title: '评论已删除', icon: 'success' });
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
