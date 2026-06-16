package com.ywllab.nemo.constant

/**
 * 积分记录类型
 */
enum class PointsRecordType(val desc: String) {
    INVITE_REWARD("邀请奖励"),
    INVITED_REWARD("被邀请奖励"),
    ORDER_DEDUCT("订单抵扣"),
    ADMIN_ADJUST("系统赠送"),
    ACTIVITY("活动奖励");
}
