package com.ywllab.nemo.transport.enum

enum class ErrorCode(val code: Int) {
    // SDK error codes
    CONNECTION_CLOSED(-32000),
    REQUEST_TIMEOUT(-32001),

    // Standard JSON-RPC error codes
    PARSE_ERROR(-32700),
    INVALID_REQUEST(-32600),
    METHOD_NOT_FOUND(-32601),
    INVALID_PARAMS(-32602),
    INTERNAL_ERROR(-32603),
}
