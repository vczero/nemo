package com.ywllab.nemo.constant

enum class AgreementType(var desc: String) {
    USER_AGREEMENT("用户协议"),
    PRIVACY_POLICY("隐私政策"),
    SERVICE_AGREEMENT("产品服务协议");

    companion object {
        fun fromValue(value: String): AgreementType {
            return values().find { it.name == value }
                ?: throw IllegalArgumentException("Invalid AgreementType value: $value")
        }
    }
}
