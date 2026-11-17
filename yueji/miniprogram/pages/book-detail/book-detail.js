const api = require('../../utils/api');

const COVERS = ['bc-1', 'bc-2', 'bc-3', 'bc-4', 'bc-5', 'bc-6'];
const STATUS_OPTIONS = [
  { key: 'READING', label: '在读' },
  { key: 'WISH', label: '想读' },
  { key: 'DONE', label: '读完' }
];

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function toForm(book) {
  return {
    title: book.title || '',
    author: book.author || '',
    publisher: book.publisher || '',
    description: book.description || '',
    pages: book.pages ? String(book.pages) : '',
    currentPage: book.currentPage ? String(book.currentPage) : '0',
    status: book.status || 'READING',
    rating: Number(book.rating) || 5,
    finishedAt: book.finishedAt || '',
    coverCls: book.coverCls || 'bc-1'
  };
}

function decorate(book) {
  const pages = Number(book.pages) || 0;
  const currentPage = Number(book.currentPage) || 0;
  const done = book.status === 'DONE';
  const pct = done ? 100 : (pages > 0 ? Math.min(100, Math.round(currentPage / pages * 100)) : 0);
  const statusLabel = done ? '已读完' : (book.status === 'WISH' ? '想读' : '在读');
  return Object.assign({}, book, { pages, currentPage, pct, done, statusLabel });
}

Page({
  data: {
    statusBarH: 20,
    loading: true,
    loadError: '',
    notFound: false,
    book: null,
    editing: false,
    form: toForm({}),
    covers: COVERS,
    statuses: STATUS_OPTIONS,
    stars: [1, 2, 3, 4, 5]
  },

  onLoad(options) {
    this.bookId = options && options.id;
    this.setData({ statusBarH: (getApp().globalData.statusBarHeight || 20) });
    this.refresh();
  },

  goBack() {
    wx.navigateBack();
  },

  async refresh() {
    this.setData({ loading: true, loadError: '', notFound: false });
    if (!this.bookId) {
      this.setData({ loading: false, notFound: true });
      return;
    }
    const { data, error, needLogin } = await api.getBook(this.bookId);
    if (needLogin) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    if (error) {
      this.setData({ loading: false, loadError: '书籍详情加载失败，点击重试' });
      return;
    }
    if (!data) {
      this.setData({ loading: false, notFound: true });
      return;
    }
    this.setData({
      loading: false,
      book: decorate(data),
      form: toForm(data),
      editing: false
    });
  },

  toggleEdit() {
    this.setData({ editing: !this.data.editing });
  },

  cancelEdit() {
    this.setData({ form: toForm(this.data.book), editing: false });
  },

  onFieldInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onDateChange(e) {
    this.setData({ 'form.finishedAt': e.detail.value });
  },

  pickStatus(e) {
    this.setData({ 'form.status': e.currentTarget.dataset.status });
  },

  pickCover(e) {
    this.setData({ 'form.coverCls': e.currentTarget.dataset.cls });
  },

  pickStar(e) {
    this.setData({ 'form.rating': Number(e.currentTarget.dataset.n) });
  },

  async save() {
    const f = this.data.form;
    const title = String(f.title || '').trim();
    const author = String(f.author || '').trim();
    if (!title) return wx.showToast({ title: '请填写书名', icon: 'none' });
    if (!author) return wx.showToast({ title: '请填写作者', icon: 'none' });
    const pages = Number(f.pages);
    if (!Number.isFinite(pages) || pages <= 0) {
      return wx.showToast({ title: '总页数需大于 0', icon: 'none' });
    }
    let currentPage = Number(f.currentPage);
    if (!Number.isFinite(currentPage) || currentPage < 0) currentPage = 0;
    currentPage = Math.min(currentPage, pages);

    const patch = {
      title: title.slice(0, 60),
      author: author.slice(0, 60),
      publisher: String(f.publisher || '').trim().slice(0, 80),
      description: String(f.description || '').trim().slice(0, 500),
      pages,
      currentPage,
      status: f.status,
      rating: Number(f.rating) || 5,
      finishedAt: f.status === 'DONE' ? (f.finishedAt || todayKey()) : '',
      coverCls: f.coverCls || 'bc-1'
    };

    wx.showLoading({ title: '保存中', mask: true });
    const { error, needLogin } = await api.updateBook(this.bookId, patch);
    wx.hideLoading();
    if (needLogin) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    if (error) {
      wx.showToast({ title: error.message || '保存失败，请重试', icon: 'none' });
      return;
    }
    wx.showToast({ title: '已保存', icon: 'success' });
    await this.refresh();
  },

  async deleteBook() {
    const ok = await new Promise(resolve => {
      wx.showModal({
        title: '从书架移除这本书？',
        content: '删除后无法恢复，这本书的阅读进度也会一并移除。',
        confirmText: '删除',
        confirmColor: '#B4532A',
        success: r => resolve(!!r.confirm),
        fail: () => resolve(false)
      });
    });
    if (!ok) return;
    wx.showLoading({ title: '删除中', mask: true });
    const { error, needLogin } = await api.deleteBook(this.bookId);
    wx.hideLoading();
    if (needLogin) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    if (error) {
      wx.showToast({ title: error.message || '删除失败', icon: 'none' });
      return;
    }
    wx.showToast({
      title: '已从书架移除',
      icon: 'success',
      success: () => setTimeout(() => wx.navigateBack(), 600)
    });
  }
});
