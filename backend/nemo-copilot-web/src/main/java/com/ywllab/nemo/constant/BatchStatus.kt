package com.ywllab.nemo.constant

/**
 * Batch任务状态枚举
https://bailian.console.aliyun.com/cn-beijing?spm=5176.ecs-console-networkv2_.console-base_search-panel.dtab-product_sfm.240d4df5S9eKaI&tab=api#/api/?type=model&url=2842025

任务状态，可能的值包括：

validating：正在验证输入文件。

in_progress：任务正在处理中。

finalizing：任务已完成处理，正在生成输出文件。

completed：任务成功完成。

failed：任务因严重错误失败。

expired：任务在 completion_window 内未能完成而过期。

cancelling：正在取消任务。

cancelled：任务已被取消。
 */
enum class BatchStatus(val desc: String) {
    VALIDATING("验证中"),
    IN_PROGRESS("执行中"),
    COMPLETED("已完成"),
    FAILED("失败"),
    CANCELLED("已取消");

    companion object {
        fun fromValue(value: String): BatchStatus? {
            return values().find { it.name == value || it.name.lowercase() == value.lowercase() }
        }
    }
}
