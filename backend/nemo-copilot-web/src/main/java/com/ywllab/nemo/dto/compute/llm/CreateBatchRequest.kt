package com.ywllab.nemo.dto.compute.llm

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

/**
 * Batch API - 创建Batch任务请求
 */
@ApiModel("创建Batch任务请求")
class CreateBatchRequest {
    @ApiModelProperty("输入文件ID")
    var input_file_id: String? = null

    @ApiModelProperty("端点")
    var endpoint: String = "/v1/chat/completions"

    @ApiModelProperty("请求配置")
    var completion_window: String = "24h"

    @ApiModelProperty("metadata")
    var metadata: BatchMetadata? = null

    /**
     * Batch元数据
     */
    @ApiModel("Batch元数据")
    class BatchMetadata {
        @ApiModelProperty("任务名称")
        var ds_name: String? = null

        @ApiModelProperty("任务描述")
        var ds_description: String? = null
    }
}
