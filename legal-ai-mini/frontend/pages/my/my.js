// my.js
const API_HOST = 'https://your-backend-domain.com'  // 改成你的后端地址

Page({
  data: {
    nickname: '微信用户',
    isVip: false,
    expireDate: '-',
    remaining: 1,
    selected: 1
  },

  onLoad: function () {
    this.getUserInfo()
  },

  onShow: function() {
    this.getUserInfo()
  },

  getUserInfo: function() {
    // TODO: 从后端获取用户信息
    // 这里是示例数据
    this.setData({
      nickname: getApp().globalData.nickname || '微信用户',
      remaining: this.data.remaining
    })

    wx.request({
      url: API_HOST + '/api/user/check-quota',
      method: 'POST',
      data: {
        user_id: getApp().globalData.openId || 'test'
      },
      success: (res) => {
        if (res.data.code === 200) {
          this.setData({
            remaining: res.data.data.remaining,
            isVip: res.data.data.is_vip
          })
        }
      }
    })
  },

  selectPrice: function(e) {
    const index = parseInt(e.currentTarget.dataset.index)
    this.setData({
      selected: index
    })
  },

  buyVip: function() {
    const productTypes = ['month', 'year']
    const productType = productTypes[this.data.selected - 1]
    
    wx.showLoading({
      title: '发起支付...'
    })
    
    wx.request({
      url: API_HOST + '/api/pay/create-order',
      method: 'POST',
      data: {
        product_type: productType,
        user_id: getApp().globalData.openId || 'test'
      },
      success: (res) => {
        wx.hideLoading()
        if (res.data.code === 200) {
          // 拿到prepay_id后调用微信支付
          // 这里填上微信支付请求参数即可
          wx.requestPayment({
            timeStamp: '',
            nonceStr: '',
            package: '',
            signType: 'MD5',
            paySign: '',
            success: () => {
              wx.showToast({
                title: '支付成功',
                icon: 'success'
              })
              this.getUserInfo()
            },
            fail: () => {
              wx.showToast({
                title: '支付取消',
                icon: 'none'
              })
            }
          })
        } else {
          wx.showToast({
            title: res.data.msg || '创建订单失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        })
      }
    })
  }
})
