package com.ywllab.nemo.transport.dto.tool

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

/**
 * JSON Schema common definition, compatible with all subtypes (object, array, string, etc.)
 */
@ApiModel(description = "JSON Schema common definition")
class Schema {

    @ApiModelProperty("Type, e.g. object, array, string, etc.")
    var type: String? = null

    @ApiModelProperty("Legacy unique identifier")
    var id: String? = null

    @ApiModelProperty("Legacy nested definition mapping")
    var definitions: Map<String, Schema>? = null

    @ApiModelProperty("Title description")
    var title: String? = null

    @ApiModelProperty("Description")
    var description: String? = null

    @ApiModelProperty("Default value")
    var default: Any? = null

    @ApiModelProperty("Example values")
    var examples: List<Any>? = null

    @ApiModelProperty("Read-only flag")
    var readOnly: Boolean? = null

    @ApiModelProperty("Write-only flag")
    var writeOnly: Boolean? = null

    @ApiModelProperty("Deprecated flag")
    var deprecated: Boolean? = null

    @ApiModelProperty("Schema list where all conditions must be satisfied")
    var allOf: List<Schema>? = null

    @ApiModelProperty("Schema list where any condition must be satisfied")
    var anyOf: List<Schema>? = null

    @ApiModelProperty("Schema list where only one condition must be satisfied")
    var oneOf: List<Schema>? = null

    @ApiModelProperty("Schema condition that must not be satisfied")
    var not: Schema? = null

    @ApiModelProperty("Conditional if branch")
    var `if`: Schema? = null

    @ApiModelProperty("Conditional then branch")
    var then: Schema? = null

    @ApiModelProperty("Conditional else branch")
    var `else`: Schema? = null

    @ApiModelProperty("Enumeration values")
    var `enum`: List<Any>? = null

    @ApiModelProperty("Constant value")
    var `const`: Any? = null

    // ========== ObjectSchema specific fields ==========

    @ApiModelProperty("Object property definitions")
    var properties: Map<String, Schema>? = null

    @ApiModelProperty("Pattern-matched property definitions")
    var patternProperties: Map<String, Schema>? = null

    @ApiModelProperty("Required field list")
    var required: List<String>? = null

    @ApiModelProperty("Dependent required fields definition")
    var dependentRequired: Map<String, List<String>>? = null

    @ApiModelProperty("Property name constraints")
    var propertyNames: Schema? = null

    @ApiModelProperty("Minimum property count")
    var minProperties: Int? = null

    @ApiModelProperty("Maximum property count")
    var maxProperties: Int? = null

    @ApiModelProperty("Dependent schema definitions")
    var dependentSchemas: Map<String, Schema>? = null

    // ========== ArraySchema specific fields ==========

    @ApiModelProperty("Array item definition")
    var items: Schema? = null // Schema | Schema[]

    @ApiModelProperty("Prefix item definition list")
    var prefixItems: List<Schema>? = null

    @ApiModelProperty("Contains item definition")
    var contains: Schema? = null

    @ApiModelProperty("Minimum item count")
    var minItems: Int? = null

    @ApiModelProperty("Maximum item count")
    var maxItems: Int? = null

    @ApiModelProperty("Minimum contains count")
    var minContains: Int? = null

    @ApiModelProperty("Maximum contains count")
    var maxContains: Int? = null

    @ApiModelProperty("Whether items must be unique")
    var uniqueItems: Boolean? = null

    // ========== StringSchema specific fields ==========

    @ApiModelProperty("Minimum string length")
    var minLength: Int? = null

    @ApiModelProperty("Maximum string length")
    var maxLength: Int? = null

    @ApiModelProperty("Regular expression pattern")
    var pattern: String? = null

    @ApiModelProperty("Data format description")
    var format: String? = null

    @ApiModelProperty("Content encoding method")
    var contentEncoding: String? = null

    @ApiModelProperty("Media type description")
    var contentMediaType: String? = null

    // ========== NumberSchema / IntegerSchema specific fields ==========

    @ApiModelProperty("Minimum value")
    var minimum: Double? = null

    @ApiModelProperty("Maximum value")
    var maximum: Double? = null

    @ApiModelProperty("Strict minimum value")
    var exclusiveMinimum: Double? = null

    @ApiModelProperty("Strict maximum value")
    var exclusiveMaximum: Double? = null

    @ApiModelProperty("Multiple-of constraint")
    var multipleOf: Double? = null
}
