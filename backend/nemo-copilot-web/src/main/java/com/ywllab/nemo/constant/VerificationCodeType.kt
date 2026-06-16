package com.ywllab.nemo.constant

enum class VerificationCodeType(var desc: String) {
    REGISTER("注册"),
    RESET_PASSWORD("重置密码"),
    LOGIN("登录"),
    UPDATE_EMAIL("修改邮箱");

    companion object {
        fun fromValue(value: String): VerificationCodeType {
            return values().find { it.name == value }
                ?: throw IllegalArgumentException("Invalid VerifyCodeType value: $value")
        }
    }
}
