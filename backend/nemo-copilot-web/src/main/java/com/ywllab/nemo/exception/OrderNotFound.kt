package com.ywllab.nemo.exception

open class OrderNotFound(key: String) : SystemException("订单${key}不存在")
