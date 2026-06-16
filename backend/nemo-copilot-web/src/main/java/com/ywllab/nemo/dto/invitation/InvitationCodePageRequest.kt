package com.ywllab.nemo.dto.invitation

import com.ywllab.nemo.dto.CommonPageQuery
import io.swagger.annotations.ApiModelProperty

class InvitationCodePageRequest : CommonPageQuery() {
    @ApiModelProperty("邀请码搜索")
    var code: String? = null

    @ApiModelProperty("邀请人ID搜索")
    var inviterId: String? = null

    @ApiModelProperty("邀请人用户名/邮箱搜索")
    var inviterKeyword: String? = null

    @ApiModelProperty("排序字段：used_count, created_at")
    var sortBy: String? = null

    @ApiModelProperty("排序方向：ASC, DESC，默认 DESC")
    var sortOrder: String? = "DESC"
}
