package com.ywllab.nemo.dto.compute

import com.ywllab.nemo.constant.ExecCategory
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("更新计算服务请求")
class UpdateComputeEndpointRequest {
    @ApiModelProperty("端点名称")
    var endpointName: String? = null

    @ApiModelProperty("执行器类别")
    var execCategory: ExecCategory? = null

    @ApiModelProperty("外部RestAPI地址")
    var endpointUrl: String? = null

    @ApiModelProperty("请求头配置")
    var headers: Map<String, String>? = null

    @ApiModelProperty("机器学习模型服务配置")
    var mlServiceConfig: Map<String, Any>? = null

    @ApiModelProperty("LLM模型配置")
    var llmServiceConfig: Map<String, Any>? = null

    @ApiModelProperty("最大重试次数")
    var maxRetry: Int? = null

    @ApiModelProperty("超时时间ms")
    var timeoutMs: Int? = null
}
