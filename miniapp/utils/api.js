const BASE_URL = 'http://127.0.0.1:4000';

export function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${path}`,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'content-type': 'application/json',
        ...(options.header || {})
      },
      success: (res) => resolve(res.data),
      fail: reject
    });
  });
}

