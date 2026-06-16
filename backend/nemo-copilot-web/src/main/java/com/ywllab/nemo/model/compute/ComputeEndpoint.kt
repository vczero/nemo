package com.ywllab.nemo.model.compute

import com.ywllab.nemo.constant.ComputeEndpointStatus
import com.ywllab.nemo.constant.ComputeType
import com.ywllab.nemo.constant.ExecCategory
import com.ywllab.nemo.model.BaseColumn
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("计算服务配置")
class ComputeEndpoint : BaseColumn() {
    @ApiModelProperty("端点ID")
    lateinit var endpointId: String

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
}
