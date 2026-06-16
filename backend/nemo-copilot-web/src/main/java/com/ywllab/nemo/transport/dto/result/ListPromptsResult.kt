package com.ywllab.nemo.transport.dto.result

import com.ywllab.nemo.transport.dto.prompt.Prompt
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

/**
 * Prompt list response data
 */
@ApiModel(description = "Prompt list response data")
open class ListPromptsResult : Result() {

    @ApiModelProperty("Pagination cursor for fetching more results")
    var nextCursor: String? = null

    @ApiModelProperty("Prompt object array")
    var prompts: List<Prompt>? = null
}
