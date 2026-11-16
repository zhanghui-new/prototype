const app = getApp();
const api = require('../../utils/api');

Page({
  data: {
    session: 0,
    totalMin: 0,
    streak: 0,
    pages: 0,
    bookTitle: '',
    bookLabel: '',
    quoteText: '',
    quoteSrc: '',
    mood: '沉思',
    star: 4,
    note: '',
    publishPoints: api.PUBLISH_POINTS,
    popped: false,
    publishing: false,
    topPad: 50,
    loading: true,
    loadError: ''
  },

  onLoad(query) {
    this.setData({
      topPad: (app.globalData.statusBarHeight || 20) + 30,
      session: Number(query.session) || 0
    });
    this.refresh();
    setTimeout(() => this.setData({ popped: true }), 60);
  },

  async refresh() {
    this.setData({ loading: true, loadError: '' });
    const { data, error } = await api.getOverview();
    if (error || !data) {
      this.setData({ loading: false, loadError: '数据加载失败，点击重试' });
      return;
    }
    const book = data.currentBook;
    const q = data.noteQuote;
    const session = this.data.session;
    this.setData({
      loading: false,
      totalMin: data.todayMin + session,
      // 本次提交后预计达到的连续天数
      streak: data.checkedIn ? data.streak : data.streak + 1,
      pages: Math.round(session * api.PAGES_PER_MIN),
      bookTitle: book ? book.title : '',
      bookLabel: book ? `《${book.title}》今日阅读` : '今日阅读',
      quoteText: q ? q.content : '',
      quoteSrc: q ? `— 《${q.book}》 ${q.pageInfo}` : ''
    });
  },

  pickMood(e) {
    this.setData({ mood: e.currentTarget.dataset.mood });
  },

  pickStar(e) {
    this.setData({ star: Number(e.currentTarget.dataset.star) });
  },

  onNoteInput(e) {
    this.setData({ note: e.detail.value });
  },

  goBack() {
    wx.navigateBack();
  },

  // 打卡记录写入云端（未登录或网络异常时自动进离线队列）
  async saveCheckin() {
    return api.createCheckin({
      bookTitle: this.data.bookTitle,
      minutes: this.data.session,
      streak: this.data.streak,
      mood: this.data.mood,
      star: this.data.star,
      note: this.data.note
    });
  },

  buildFeedItem() {
    const d = this.data;
    const note = (d.note || '').trim() || '今天也在书页里走了很远。';
    return {
      text: note,
      suffix: `（心情：${d.mood} · 评分 ${'★'.repeat(d.star)}）`,
      quote: d.quoteText,
      quoteSrc: d.quoteSrc,
      book: d.bookTitle ? `${d.bookTitle} · 今日 ${d.session} 分钟` : `今日阅读 ${d.session} 分钟`,
      coverCls: 'bc-1'
    };
  },

  async publish() {
    if (this.data.publishing) return;
    this.setData({ publishing: true });
    await this.saveCheckin();
    const { error, needLogin } = await api.publishFeed(this.buildFeedItem());
    app.globalData.justPublished = true;
    this.setData({ publishing: false });
    if (needLogin) {
      wx.showToast({ title: '打卡已保存，登录后即可发布到社区', icon: 'none' });
    } else if (error) {
      wx.showToast({ title: '打卡已保存，动态发布失败', icon: 'none' });
    } else {
      wx.showToast({ title: `已发布到共读圈 · +${api.PUBLISH_POINTS} 书页积分`, icon: 'none' });
    }
    setTimeout(() => wx.switchTab({ url: '/pages/community/community' }), 700);
  },

  async savePrivate() {
    if (this.data.publishing) return;
    this.setData({ publishing: true });
    await this.saveCheckin();
    this.setData({ publishing: false });
    wx.showToast({ title: '打卡与笔记已保存', icon: 'none' });
    setTimeout(() => wx.switchTab({ url: '/pages/home/home' }), 700);
  }
});
