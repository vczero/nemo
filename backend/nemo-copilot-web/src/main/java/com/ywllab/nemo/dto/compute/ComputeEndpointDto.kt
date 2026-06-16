package com.ywllab.nemo.dto.compute

import com.ywllab.nemo.constant.ComputeEndpointStatus
import com.ywllab.nemo.constant.ComputeType
import com.ywllab.nemo.constant.ExecCategory
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("计算服务配置响应")
class ComputeEndpointDto {
    @ApiModelProperty("端点ID")
    var endpointId: String = ""

    @ApiModelProperty("端点名称")
    var endpointName: String = ""

    @ApiModelProperty("执行器类别")
    var execCategory: ExecCategory = ExecCategory.ML_MODEL

    @ApiModelProperty("端点类型")
    var endpointType: ComputeType = ComputeType.SEGMENTATION

    @ApiModelProperty("外部RestAPI地址")
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

    @ApiModelProperty("状态")
    var status: ComputeEndpointStatus = ComputeEndpointStatus.ACTIVE

    @ApiModelProperty("创建时间")
    var createTime: Long = 0L

    @ApiModelProperty("修改时间")
    var updateTime: Long = 0L
}
