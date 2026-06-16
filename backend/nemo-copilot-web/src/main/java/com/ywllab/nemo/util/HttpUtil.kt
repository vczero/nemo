package com.ywllab.nemo.util

import cn.hutool.http.HttpRequest
import okhttp3.Dispatcher
import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit

object HttpUtil {

    val okhttpClient: OkHttpClient = getOkHttpClient(10_000, 600_000)

    fun getOkHttpClient(connectionTimeout: Long, readTimeout: Long): OkHttpClient {
        return OkHttpClient.Builder()
            .dispatcher(
                Dispatcher().also {
                    it.maxRequests = 1000
                    it.maxRequestsPerHost = 500
                }
            )
            .connectTimeout(connectionTimeout, TimeUnit.MILLISECONDS)
            .readTimeout(readTimeout, TimeUnit.MILLISECONDS)
            .build()
    }

    fun getWithAuth(url: String, auth: String): String {
        return HttpRequest.get(url).bearerAuth(auth).setConnectionTimeout(1000)
            .execute().use { it.body() }
    }
}
