package com.ywllab.nemo.dto.compute

import com.ywllab.nemo.constant.ComputeType
import com.ywllab.nemo.constant.ExecCategory
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("创建计算服务请求")
class CreateComputeEndpointRequest {
    @ApiModelProperty("端点名称", required = true)
    var endpointName: String = ""

    @ApiModelProperty("执行器类别")
    var execCategory: ExecCategory = ExecCategory.ML_MODEL

    @ApiModelProperty("端点类型", required = true)
    var endpointType: ComputeType = ComputeType.SEGMENTATION

    @ApiModelProperty("外部RestAPI地址", required = true)
    var endpointUrl: String = ""

    @ApiModelProperty("请求头配置")
    var headers: Map<String, String>? = null

    @ApiModelProperty("机器学习模型服务配置")
    var mlServiceConfig: Map<String, Any>? = null

    @ApiModelProperty("LLM模型配置")
    var llmServiceConfig: Map<String, Any>? = null

    @ApiModelProperty("最大重试次数")
    var maxRetry: Int = 3

    @ApiModelProperty("超时时间ms")
    var timeoutMs: Int = 60000
}
