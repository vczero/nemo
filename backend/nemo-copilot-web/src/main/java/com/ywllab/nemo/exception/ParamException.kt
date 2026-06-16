package com.ywllab.nemo.exception

class ParamException(message: String) : BizException(ErrorCode.INVALID_PARAM, message)
