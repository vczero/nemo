package com.ywllab.nemo.util

import com.ywllab.nemo.dto.user.UserSession

object McpSessionContextHelper {
    private var threadLocalApiContext = ThreadLocal<UserSession>()

    fun setApiContext(param: UserSession) {
        threadLocalApiContext.set(param)
    }

    fun getApiContext(): UserSession? {
        return threadLocalApiContext.get()
    }

    // 线程池使用时需要clear
    fun clearContext() {
        return threadLocalApiContext.remove()
    }
}
