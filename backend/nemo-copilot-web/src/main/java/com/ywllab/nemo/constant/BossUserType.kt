package com.ywllab.nemo.constant

enum class BossUserType(val value: String, val description: String) {
    ADMIN("ADMIN", "管理员"),
    EDIT("EDIT", "编辑"),
    READ("READ", "只读");

    companion object {
        fun fromValue(value: String): BossUserType? {
            return values().find { it.value == value }
        }

        fun isValid(value: String): Boolean {
            return values().any { it.value == value }
        }
    }
}
