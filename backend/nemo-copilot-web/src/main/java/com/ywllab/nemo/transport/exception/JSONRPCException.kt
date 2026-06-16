package com.ywllab.nemo.transport.exception

class JSONRPCException : RuntimeException {

    constructor(message: String) : super(message)

    constructor(throwable: Throwable?) : super(throwable)
}
