package com.ywllab.nemo.transport.dto.request

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

/**
 * Pagination parameters object
 */
@ApiModel(description = "Pagination parameters object")
class ListToolsParams {

    @ApiModelProperty("Pagination cursor")
    var cursor: String? = null
}
