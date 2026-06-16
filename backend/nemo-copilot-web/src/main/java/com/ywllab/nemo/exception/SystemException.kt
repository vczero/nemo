package com.ywllab.nemo.exception

/***
 * 系统异常
 */
open class SystemException(override val message: String?) : RuntimeException(message)
