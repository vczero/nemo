package com.ywllab.nemo.transport.dto.result

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

/**
 * Server capabilities definition, compatible with MCP protocol extensions
 */
@ApiModel(description = "Server capabilities definition")
class ServerCapabilities {

    @ApiModelProperty("Experimental, non-standard capabilities")
    var experimental: Map<String, Any>? = null

    @ApiModelProperty("Whether to support logging")
    var logging: Map<String, Any>? = null

    @ApiModelProperty("Whether to support sending completions")
    var completions: Map<String, Any>? = null

    @ApiModelProperty("Prompt template related capabilities")
    var prompts = PromptCapabilities()

    @ApiModelProperty("Resource related capabilities")
    var resources = ResourceCapabilities()

    @ApiModelProperty("Tool related capabilities")
    var tools = ToolCapabilities()
}
