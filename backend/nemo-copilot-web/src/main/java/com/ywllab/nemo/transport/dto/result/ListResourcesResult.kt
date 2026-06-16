package com.ywllab.nemo.transport.dto.result

import com.ywllab.nemo.transport.dto.resource.Resource
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

/**
 * Resource list response data
 */
@ApiModel(description = "Resource list response data")
open class ListResourcesResult : Result() {

    @ApiModelProperty("Pagination cursor for fetching more results")
    var nextCursor: String? = null

    @ApiModelProperty("Resource object array")
    var resources: List<Resource>? = null
}
