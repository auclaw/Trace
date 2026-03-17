// consult.js
const API_HOST = 'https://your-backend-domain.com'  // 改成你的后端地址

Page({
  data: {
    question: '',
    answer: '',
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
      question: e.detail.value
    })
  },

  submitQuestion: function() {
    const question = this.data.question.trim()
    
    if (!question) {
      wx.showToast({
        title: '请输入问题',
        icon: 'none'
      })
      return
    }

    this.setData({
      loading: true,
      disabled: true
    })

    wx.request({
      url: API_HOST + '/api/consult',
      method: 'POST',
      data: {
        question: question,
        user_id: getApp().globalData.openId || 'test'
      },
      success: (res) => {
        if (res.data.code === 200) {
          this.setData({
            answer: res.data.data.answer
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
