package com.ywllab.nemo.dto.compute.llm

import com.ywllab.nemo.constant.BatchStatus
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

/**
 * Batch API - 查询Batch状态响应
 */
@ApiModel("查询Batch状态响应")
class BatchStatusResponse {
    @ApiModelProperty("Batch ID")
    var id: String? = null

    @ApiModelProperty("对象类型")
    var `object`: String? = null

    @ApiModelProperty("端点")
    var endpoint: String? = null

    @ApiModelProperty("错误信息")
    var errors: Any? = null

    @ApiModelProperty("输入文件ID")
    var input_file_id: String? = null

    @ApiModelProperty("完成窗口")
    var completion_window: String? = null

    @ApiModelProperty("Batch状态")
    var status: BatchStatus? = null

    @ApiModelProperty("输出文件ID")
    var output_file_id: String? = null

    @ApiModelProperty("错误文件ID")
    var error_file_id: String? = null

    @ApiModelProperty("创建时间")
    var created_at: Long? = null

    @ApiModelProperty("开始时间")
    var in_progress_at: Long? = null

    @ApiModelProperty("过期时间")
    var expires_at: Long? = null

    @ApiModelProperty("完成中时间")
    var finalizing_at: Long? = null

    @ApiModelProperty("完成时间")
    var completed_at: Long? = null

    @ApiModelProperty("失败时间")
    var failed_at: Long? = null

    @ApiModelProperty("过期时间戳")
    var expired_at: Long? = null

    @ApiModelProperty("取消中时间")
    var cancelling_at: Long? = null

    @ApiModelProperty("取消时间")
    var cancelled_at: Long? = null

    @ApiModelProperty("请求统计")
    var request_counts: BatchRequestCounts? = null

    @ApiModelProperty("元数据")
    var metadata: Map<String, Any>? = null

    @ApiModelProperty("错误信息")
    var error: Any? = null

    /**
     * 请求统计
     */
    @ApiModel("请求统计")
    class BatchRequestCounts {
        @ApiModelProperty("总请求数")
        var total: Int? = null

        @ApiModelProperty("成功数")
        var completed: Int? = null

        @ApiModelProperty("失败数")
        var failed: Int? = null
    }
}
