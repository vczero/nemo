package com.ywllab.nemo.model

import com.ywllab.nemo.constant.ComputeType
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("LLM调用日志")
class LlmLog {
    @ApiModelProperty("日志ID")
    lateinit var logId: String

    @ApiModelProperty("业务类型")
    lateinit var bizType: ComputeType

    @ApiModelProperty("业务ID")
    lateinit var bizId: String

    @ApiModelProperty("用户ID")
    lateinit var userId: String

    @ApiModelProperty("账号ID")
    lateinit var accountId: String

    @ApiModelProperty("请求URL")
    lateinit var url: String

    @ApiModelProperty("模型名称")
    lateinit var model: String

    @ApiModelProperty("输入内容")
    lateinit var inputContent: String

    @ApiModelProperty("输出内容")
    var outputContent: String? = null

    @ApiModelProperty("输入token数")
    var inputTokenCount: Int? = null

    @ApiModelProperty("输出token数")
    var outputTokenCount: Int? = null

    @ApiModelProperty("总token数")
    var totalTokenCount: Int? = null

    @ApiModelProperty("创建时间")
    var createTime: Long = System.currentTimeMillis()

    @ApiModelProperty("创建人")
    lateinit var createBy: String
}
