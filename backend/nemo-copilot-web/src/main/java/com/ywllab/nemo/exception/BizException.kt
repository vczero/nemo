package com.ywllab.nemo.exception

/***
 * 业务异常
 */
open class BizException(msg: String) : SystemException(msg) {
    var code: ErrorCode = ErrorCode.UNKNOWN

    constructor(code: ErrorCode, msg: String = code.msg) : this(msg) {
        this.code = code
    }
}

enum class ErrorCode(var msg: String) {
    OK("成功"),
    UNKNOWN("未知错误"),
    INVALID_PARAM("非法参数"),

    EXPIRED_SUBSCRIPTION("订阅套餐已过期"),
    NO_SUBSCRIPTION("尚未订阅套餐"),
    ILLEGAL_ACCESS("非法访问"),
}
