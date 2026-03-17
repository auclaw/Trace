// generate.js
const API_HOST = 'https://your-backend-domain.com'  // 改成你的后端地址

Page({
  data: {
    docTypes: [
      '借条',
      '租房合同',
      '劳动合同',
      '离职证明',
      '离婚协议书',
      '欠款协议',
      '其他类型'
    ],
    currentTypeIndex: 0,
    userInfo: '',
    document: '',
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

  onTypeChange: function(e) {
    this.setData({
      currentTypeIndex: e.detail.value
    })
  },

  onInput: function(e) {
    this.setData({
      userInfo: e.detail.value
    })
  },

  submitGenerate: function() {
    const docType = this.data.docTypes[this.data.currentTypeIndex]
    const userInfo = this.data.userInfo.trim()
    
    if (!userInfo) {
      wx.showToast({
        title: '请填写相关信息',
        icon: 'none'
      })
      return
    }

    this.setData({
      loading: true,
      disabled: true
    })

    wx.request({
      url: API_HOST + '/api/generate-document',
      method: 'POST',
      data: {
        type: docType,
        info: userInfo,
        user_id: getApp().globalData.openId || 'test'
      },
      success: (res) => {
        if (res.data.code === 200) {
          this.setData({
            document: res.data.data.document
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
  },

  copyResult: function() {
    if (!this.data.document) {
      return
    }
    wx.setClipboardData({
      data: this.data.document,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        })
      }
    })
  }
})
