package com.ywllab.nemo.constant

enum class PayMethod(val description: String) {
    ALIPAY("支付宝"),
    WECHAT("微信"),
    EXTERNAL("三方渠道"),
    INTERNAL_POINT("内部积分")
}
