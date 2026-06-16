package com.ywllab.nemo.transport.dto.result

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

/**
 * Implementation name and version
 */
@ApiModel(description = "Implementation name and version")
open class Implementation {

    @ApiModelProperty("Name")
    lateinit var name: String

    @ApiModelProperty("Version")
    lateinit var version: String

    constructor()

    constructor(name: String, version: String) {
        this.name = name
        this.version = version
    }
}
