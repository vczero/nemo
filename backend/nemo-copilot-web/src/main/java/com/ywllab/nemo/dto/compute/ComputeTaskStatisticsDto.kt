package com.ywllab.nemo.dto.compute

data class ComputeTaskStatisticsDto(
    val total: Long = 0,
    val pending: Long = 0,
    val running: Long = 0,
    val success: Long = 0,
    val failed: Long = 0,
    val cancelled: Long = 0
)
