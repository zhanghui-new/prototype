const api = require('../../utils/api');

Page({
  data: {
    sec: 0,
    mm: '00',
    ss: '00',
    running: true,
    totalMin: 0,
    goalText: '',
    currentBook: null,
    statusBarH: 20,
    loading: true,
    loadError: ''
  },

  timer: null,

  onLoad() {
    this.setData({ statusBarH: getApp().globalData.statusBarHeight });
    this.refresh();
    this.start();
  },

  onUnload() {
    this.stop();
  },

  onHide() {
    if (this.data.running) this.pause();
  },

  async refresh() {
    this.setData({ loading: true, loadError: '' });
    const { data, error } = await api.getOverview();
    if (error || !data) {
      this.setData({ loading: false, loadError: '目标数据加载失败，点击重试' });
      return;
    }
    this.setData({
      loading: false,
      totalMin: data.todayMin,
      currentBook: data.currentBook,
      goalText: data.remainMin > 0
        ? `再读 ${data.remainMin} 分钟即达成今日目标`
        : '已达成今日目标，继续保持！'
    });
  },

  start() {
    this.setData({ running: true });
    this.timer = setInterval(() => {
      const sec = this.data.sec + 1;
      this.setData({
        sec,
        mm: String(Math.floor(sec / 60)).padStart(2, '0'),
        ss: String(sec % 60).padStart(2, '0')
      });
    }, 1000);
  },

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  pause() {
    this.stop();
    this.setData({ running: false });
  },

  togglePause() {
    if (this.data.running) this.pause();
    else this.start();
  },

  finish() {
    this.stop();
    const session = Math.max(1, Math.floor(this.data.sec / 60));
    // 只把本次时长传给打卡页；统计与连击由打卡页提交后从云端重新读取
    wx.redirectTo({ url: `/pages/done/done?session=${session}` });
  },

  goBack() {
    wx.navigateBack();
  }
});
