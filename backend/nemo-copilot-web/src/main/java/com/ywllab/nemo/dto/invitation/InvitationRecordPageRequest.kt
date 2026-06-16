package com.ywllab.nemo.dto.invitation

import io.swagger.annotations.ApiModelProperty

class InvitationRecordPageRequest {
    @ApiModelProperty("邀请码搜索")
    var invitationCode: String? = null

    @ApiModelProperty("邀请人ID搜索")
    var inviterId: String? = null

    @ApiModelProperty("邀请人用户名/邮箱搜索")
    var inviterKeyword: String? = null

    @ApiModelProperty("被邀请人ID搜索")
    var inviteeId: String? = null

    @ApiModelProperty("被邀请人用户名/邮箱搜索")
    var inviteeKeyword: String? = null

    @ApiModelProperty("排序字段：invite_time")
    var sortBy: String? = null

    @ApiModelProperty("排序方向：ASC, DESC，默认 DESC")
    var sortOrder: String? = "DESC"

    @ApiModelProperty("页码", required = true)
    var pageNum: Int = 1

    @ApiModelProperty("每页大小", required = true)
    var pageSize: Int = 20
}
