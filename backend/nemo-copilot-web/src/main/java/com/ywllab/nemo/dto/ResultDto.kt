package com.ywllab.nemo.dto

import com.ywllab.nemo.exception.ErrorCode
import java.io.Serializable

class ResultDto<T> : Serializable {
    var code: ErrorCode = ErrorCode.OK

    /** 提示信息  */
    var message: String? = null

    /** 返回结果值  */
    var value: T? = null

    /** 成功失败标识(true/false)  */
    var success: Boolean = false

    constructor()

    constructor(value: T) {
        this.success = true
        this.value = value
    }

    companion object {
        const val serialVersionUID: Long = -3669396979051990642L

        /** 成功结果  */
        fun <T> success(): ResultDto<T> {
            return ResultDto<T>().also {
                it.success = true
            }
        }

        /** 成功结果  */
        fun <T> success(value: T? = null): ResultDto<T> {
            return if (value == null) {
                ResultDto<T>().also {
                    it.success = true
                }
            } else {
                ResultDto(value)
            }
        }

        /** 失败结果  */
        fun <T> fail(message: String?, code: ErrorCode? = null): ResultDto<T> {
            return valueOfError(message, code)
        }

        private fun <T> valueOfError(msg: String?, code: ErrorCode? = null): ResultDto<T> {
            val vo: ResultDto<T> = ResultDto()
            vo.code = code ?: ErrorCode.OK
            vo.message = if (msg.isNullOrBlank()) {
                vo.code.msg
            } else {
                msg
            }
            vo.success = false
            return vo
        }
    }
}
