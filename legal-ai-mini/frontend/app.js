// app.js
App({
  onLaunch: function () {
    // 登录获取openid
    this.login()
  },

  globalData: {
    openId: null,
    nickname: null,
    avatarUrl: null
  },

  login: function() {
    wx.login({
      success: res => {
        // 这里调用后端接口，用code换openid
        // 暂时留空，你配置好后填上去
        console.log('code:', res.code)
      }
    })
  }
})
