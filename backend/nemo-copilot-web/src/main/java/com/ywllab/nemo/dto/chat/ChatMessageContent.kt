package com.ywllab.nemo.dto.chat

import com.fasterxml.jackson.annotation.JsonAlias
import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@JsonInclude(JsonInclude.Include.NON_NULL)
@ApiModel("消息内容。如果您的输入只有文本，则为 string 类型；如果您的输入包含图像等多模态数据，则为 array 类型。请使用content，imageContent已弃用")
class ChatMessageContent {

    @ApiModelProperty("text、image_url、input_audio，传入的信息类型。")
    var type = ""

    @ApiModelProperty("当type设置为text时，输入文本信息。")
    var text: String? = null

    @ApiModelProperty("图片信息。")
    @JsonProperty("image_url")
    @JsonAlias("imageUrl")
    var imageUrl: ChatImageUrl? = null

    @ApiModelProperty("输入的音频信息")
    @JsonProperty("input_audio")
    var inputAudio: ChatInputAudio? = null

    class ChatImageUrl {

        @ApiModelProperty("图片的 URL或 Base64 Data URL。(data:image/{format};base64,{base64_image})")
        var url = ""
    }

    class ChatInputAudio {

        @ApiModelProperty("音频的 URL或 Base64 Data URL。")
        var data = ""

        @ApiModelProperty("输入音频的格式，如mp3、wav等。")
        var format = ""
    }
}
