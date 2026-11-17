const api = require('../../utils/api');

// 封面配色仅用于云端未指定 cover_cls 时的视觉兜底，不是业务数据
const COVER_FALLBACK = ['bc-1', 'bc-2', 'bc-3', 'bc-4', 'bc-5', 'bc-6'];

function decorate(book, idx) {
  const pages = book.pages || 0;
  const currentPage = book.currentPage || 0;
  const pct = pages > 0 ? Math.round(currentPage / pages * 100) : 0;
  let progressText, progressRight;
  if (book.status === 'DONE') {
    progressText = book.finishedAt ? `${book.finishedAt} 读完` : '已读完';
    progressRight = `${book.rating || '5.0'} 分`;
  } else if (book.status === 'WISH') {
    progressText = '想读';
    progressRight = '待开始';
  } else {
    progressText = `P${currentPage} / ${pages}`;
    progressRight = `${pct}%`;
  }
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    status: book.status,
    tag: book.status === 'DONE' ? '已读完' : '',
    coverCls: book.coverCls || COVER_FALLBACK[idx % COVER_FALLBACK.length],
    pct: book.status === 'DONE' ? 100 : pct,
    done: book.status === 'DONE',
    progressText,
    progressRight
  };
}

Page({
  data: {
    activeTab: 'READING',
    countReading: 0,
    countWish: 0,
    countDone: 0,
    filtered: [],
    sheetShow: false,
    form: { title: '', author: '', pages: '', status: 'READING' },
    loading: true,
    loadError: '',
    notLoggedIn: false,
    statusBarH: 20
  },

  _books: [],

  onLoad() {
    this.setData({ statusBarH: getApp().globalData.statusBarHeight });
  },

  onShow() {
    this.refresh();
  },

  async refresh() {
    this.setData({ loading: true, loadError: '', notLoggedIn: false });
    const { session } = await api.currentSession();
    if (!session) {
      this._books = [];
      this.setData({
        loading: false, notLoggedIn: true, filtered: [],
        countReading: 0, countWish: 0, countDone: 0
      });
      return;
    }
    const { data, error } = await api.listBooks();
    if (error) {
      this.setData({ loading: false, loadError: '书架加载失败，点击重试' });
      return;
    }
    const books = data || [];
    this._books = books;
    this.setData({
      loading: false,
      countReading: books.filter(b => b.status === 'READING').length,
      countWish: books.filter(b => b.status === 'WISH').length,
      countDone: books.filter(b => b.status === 'DONE').length
    });
    this.applyFilter();
  },

  applyFilter() {
    const all = this._books || [];
    this.setData({
      filtered: all
        .filter(b => b.status === this.data.activeTab)
        .map(b => decorate(b, all.indexOf(b)))
    });
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.status }, () => this.applyFilter());
  },

  openSheet() {
    if (this.data.notLoggedIn) {
      this.goLogin();
      return;
    }
    this.setData({ sheetShow: true });
  },

  closeSheet() {
    this.setData({ sheetShow: false });
  },

  onTitleInput(e) { this.setData({ 'form.title': e.detail.value }); },
  onAuthorInput(e) { this.setData({ 'form.author': e.detail.value }); },
  onPagesInput(e) { this.setData({ 'form.pages': e.detail.value }); },

  pickStatus(e) {
    this.setData({ 'form.status': e.currentTarget.dataset.status });
  },

  async addBook() {
    const f = this.data.form;
    if (!f.title.trim() || !f.author.trim() || !f.pages) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }
    const { error, needLogin } = await api.addBook({
      title: f.title.trim(),
      author: f.author.trim(),
      pages: Number(f.pages),
      status: f.status
    });
    if (needLogin) {
      this.goLogin();
      return;
    }
    if (error) {
      wx.showToast({ title: '保存失败，请重试', icon: 'none' });
      return;
    }
    this.setData({
      sheetShow: false,
      form: { title: '', author: '', pages: '', status: 'READING' },
      activeTab: f.status
    });
    await this.refresh();
    wx.showToast({ title: `《${f.title.trim()}》已加入书架`, icon: 'none' });
  },

  tapBook(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/book-detail/book-detail?id=${id}` });
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  }
});
