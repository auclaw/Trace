// review.js
const API_HOST = 'https://your-backend-domain.com'  // 改成你的后端地址

Page({
  data: {
    contractText: '',
    result: '',
    loading: false,
    disabled: false,
    remaining: 0
  },

  onLoad: function () {
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
          if (res.data.data.remaining <= 0 && !res.data.data.is_vip) {
            this.setData({
              disabled: true
            })
          }
        }
      }
    })
  },

  onInput: function(e) {
    this.setData({
      contractText: e.detail.value
    })
  },

  // 用户点击例子，直接填充
  useExample: function(e) {
    const text = e.currentTarget.dataset.text
    this.setData({
      contractText: text
    })
  },

  submitReview: function() {
    const contractText = this.data.contractText.trim()
    
    if (!contractText) {
      wx.showToast({
        title: '请粘贴合同内容',
        icon: 'none'
      })
      return
    }

    this.setData({
      loading: true,
      disabled: true
    })

    wx.request({
      url: API_HOST + '/api/review-contract',
      method: 'POST',
      data: {
        text: contractText,
        user_id: getApp().globalData.openId || 'test'
      },
      success: (res) => {
        if (res.data.code === 200) {
          this.setData({
            result: res.data.data.review
          })
          this.checkQuota()
        } else {
          wx.showToast({
            title: res.data.msg || '请求失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        })
      },
      complete: () => {
        this.setData({
          loading: false
        })
        if (this.data.remaining > 1) {
          this.setData({
            disabled: false
          })
        }
      }
    })
  }
})
