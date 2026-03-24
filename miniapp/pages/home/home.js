Page({
  data: {
    stats: {}
  },
  async onLoad() {
    try {
      const data = await new Promise((resolve, reject) => {
        wx.request({
          url: 'http://127.0.0.1:4000/api/admin/dashboard',
          success: (res) => resolve(res.data),
          fail: reject
        });
      });
      this.setData({ stats: data });
    } catch (error) {
      console.error(error);
    }
  }
});

