// index.js
const API_HOST = 'https://your-backend-domain.com'  // 改成你的后端地址

Page({
  data: {
    
  },

  onLoad: function () {
    // 检查用户配额
    this.checkQuota()
  },

  checkQuota: function() {
    wx.request({
      url: API_HOST + '/api/user/check-quota',
      method: 'POST',
      data: {
        user_id: getApp().globalData.openId || 'test'
      },
      success: (res) => {
        if (res.data.code === 200) {
          this.setData({
            remaining: res.data.data.remaining
          })
        }
      }
    })
  },

  goToConsult: function() {
    wx.navigateTo({
      url: '/pages/consult/consult'
    })
  },

  goToReview: function() {
    wx.navigateTo({
      url: '/pages/review/review'
    })
  },

  goToGenerate: function() {
    wx.navigateTo({
      url: '/pages/generate/generate'
    })
  }
})
