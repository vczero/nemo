package com.ywllab.nemo.dto.chat

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("返回内容的格式")
class ChatResponseFormat {

    @ApiModelProperty("返回内容的格式。可选值：text、json_object、json_schema")
    var type = ""

    @ApiModelProperty("当 type 为 json_schema 时，该字段为必选，用于定义结构化输出的配置。")
    @JsonProperty("json_schema")
    var jsonSchema: Any? = null
}
