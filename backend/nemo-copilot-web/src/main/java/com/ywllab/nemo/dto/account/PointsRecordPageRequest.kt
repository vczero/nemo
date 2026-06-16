package com.ywllab.nemo.dto.account

import com.ywllab.nemo.constant.PointsRecordType
import com.ywllab.nemo.dto.PageQuery
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("积分记录分页请求")
class PointsRecordPageRequest : PageQuery() {
    @ApiModelProperty("积分类型")
    var type: PointsRecordType? = null
}
