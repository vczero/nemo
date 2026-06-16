create table spring_session
(
    PRIMARY_ID            char(36) not null
        primary key,
    SESSION_ID            char(36) not null,
    CREATION_TIME         bigint   not null,
    LAST_ACCESS_TIME      bigint   not null,
    MAX_INACTIVE_INTERVAL int      not null,
    EXPIRY_TIME           bigint   not null,
    PRINCIPAL_NAME        varchar(100) null,
    constraint SPRING_SESSION_IX1
        unique (SESSION_ID)
);

create index SPRING_SESSION_IX2
    on spring_session (EXPIRY_TIME);

create index SPRING_SESSION_IX3
    on spring_session (PRINCIPAL_NAME);

create table spring_session_attributes
(
    SESSION_PRIMARY_ID char(36)     not null,
    ATTRIBUTE_NAME     varchar(190) not null,
    ATTRIBUTE_BYTES    blob         not null,
    primary key (SESSION_PRIMARY_ID, ATTRIBUTE_NAME)
);


create table nemo_agreement
(
    agreement_id   varchar(32)                          not null comment 'ID'
		primary key,
    type           varchar(32) default 'USER_AGREEMENT' not null comment '协议类型：USER_AGREEMENT-用户协议, PRIVACY_POLICY-隐私政策, SERVICE_AGREEMENT-产品服务协议',
    version        varchar(32)                          not null comment '版本号',
    title          varchar(190)                         not null comment '标题',
    content        mediumtext                           not null comment '协议内容',
    oss_path       varchar(500)                         not null comment 'OSS路径',
    is_active      int         default 0 null comment '是否激活：0-未激活, 1-已激活',
    effective_date bigint null comment '生效时间',
    create_by      varchar(64)                          not null comment '创建人',
    create_time    bigint                               not null comment '创建时间',
    update_by      varchar(64)                          not null comment '修改人',
    update_time    bigint                               not null comment '修改时间',
    constraint uk_type_version
        unique (type, version)
) comment '协议表';

create index idx_is_active
    on nemo_agreement (is_active);

create table nemo_boss_user_relation
(
    user_id     varchar(32) not null comment '用户ID'
		primary key,
    user_type   varchar(64) not null comment '用户类型：admin-管理员 edit-编辑 read-只读',
    create_by   varchar(64) not null comment '创建人',
    create_time bigint      not null comment '创建时间'
) comment 'Boss用户关联表';

create table nemo_cache
(
    id          bigint auto_increment comment 'ID'
		primary key,
    cache_key   varchar(190) not null comment '缓存键',
    cache_type  varchar(190) not null comment '缓存类型',
    cache_data  text         not null comment '缓存数据(JSON格式)',
    create_time bigint       not null comment '创建时间',
    constraint uk_cache_key
        unique (cache_key)
) comment '缓存表';

create index idx_cache_type
    on nemo_cache (cache_type);

create table nemo_channel_order
(
    order_id             varchar(32)             not null comment '订单ID'
		primary key,
    channel_name         varchar(190)            not null comment '渠道名称',
    channel_order_no     varchar(128) default '' not null comment '渠道订单号',
    channel_order_amount decimal(12, 2)          not null comment '渠道供货价',
    status               varchar(32)             not null comment '渠道订单状态',
    channel_order_type   varchar(32)             not null comment '渠道订单类型',
    email                varchar(128)            not null comment '用户邮箱',
    subscription_plan_id varchar(32)             not null comment '订阅套餐ID',
    subscription_months  int                     not null comment '订阅月数',
    channel_grant_time   bigint                  not null comment '渠道发放时间',
    user_activation_time bigint null comment '用户激活时间',
    create_by            varchar(64)             not null comment '创建人',
    create_time          bigint                  not null comment '创建时间',
    update_by            varchar(64)             not null comment '修改人',
    update_time          bigint                  not null comment '修改时间'
) comment '渠道订单表';

create index idx_channel_grant_time_status
    on nemo_channel_order (channel_grant_time, status);

create index idx_channel_order_no
    on nemo_channel_order (channel_order_no);

create index idx_email
    on nemo_channel_order (email);

create table nemo_chart
(
    chart_id             varchar(32)  not null comment '图表ID'
		primary key,
    user_id              varchar(32)  not null comment '用户ID',
    chart_name           varchar(190) not null comment '图表名称',
    chart_config         json         not null comment '图表配置（JSON格式）',
    chart_thumbnail_path varchar(190) null comment '图表缩略图路径',
    interpret_content    text null comment '图表解读结果（中文）',
    interpret_content_en text null comment '图表解读结果（英文）',
    purpose              varchar(500) null comment '图表业务用途',
    create_by            varchar(64)  not null comment '创建人',
    create_time          bigint       not null comment '创建时间',
    update_by            varchar(64)  not null comment '修改人',
    update_time          bigint       not null comment '修改时间'
) comment '图表配置表';

create index idx_user_id
    on nemo_chart (user_id);

create table nemo_chart_file_rel
(
    chart_id    varchar(32) not null comment '图表ID',
    file_id     varchar(32) not null comment '文件ID',
    create_time bigint      not null comment '关联创建时间',
    create_by   varchar(64) not null comment '创建人',
    primary key (chart_id, file_id)
) comment '图表文件关联表';

create index idx_file_id
    on nemo_chart_file_rel (file_id);

create table nemo_compute_chart
(
    task_id     varchar(32) not null comment '任务ID',
    chart_id    varchar(32) not null comment '图表ID',
    create_time bigint      not null comment '关联创建时间',
    create_by   varchar(64) not null comment '创建人',
    primary key (task_id, chart_id)
) comment '计算任务关联图表';

create index idx_chart_id
    on nemo_compute_chart (chart_id);

create table nemo_compute_endpoint
(
    endpoint_id        varchar(32)                    not null comment '端点ID'
		primary key,
    endpoint_name      varchar(190)                   not null comment '端点名称',
    exec_category      varchar(32) default 'ML_MODEL' not null comment '服务类别',
    endpoint_type      varchar(32)                    not null comment '端点类型',
    endpoint_url       varchar(1000)                  not null comment '外部RestAPI地址',
    headers            text null comment '请求头配置JSON',
    ml_service_config  text null comment '机器学习模型服务配置JSON',
    llm_service_config json null comment 'LLM模型配置JSON',
    max_retry          int         default 3          not null comment '最大重试次数',
    timeout_ms         int         default 60000      not null comment '超时时间ms',
    status             varchar(32) default 'ACTIVE'   not null comment '状态',
    create_by          varchar(64)                    not null comment '创建人',
    create_time        bigint                         not null comment '创建时间',
    update_by          varchar(64)                    not null comment '修改人',
    update_time        bigint                         not null comment '修改时间'
) comment '计算服务配置表';

create index idx_endpoint_type
    on nemo_compute_endpoint (endpoint_type);

create table nemo_compute_task
(
    task_id            varchar(32)   not null comment '任务ID'
		primary key,
    task_name          varchar(190) null comment '任务名称',
    user_id            varchar(32)   not null comment '用户ID',
    endpoint_id        varchar(32)   not null comment '计算服务ID',
    endpoint_type      varchar(32)   not null comment '计算服务类型',
    task_params        text null comment '任务参数JSON',
    task_status        varchar(32)   not null comment '任务状态',
    worker_host        varchar(64) null comment '执行节点host',
    summary            text null comment '任务摘要JSON',
    error_message      text null comment '异常信息',
    retry_count        int default 0 not null comment '已重试次数',
    start_time         bigint null comment '开始时间',
    end_time           bigint null comment '结束时间',
    external_task_id   varchar(190) null comment '外部系统任务ID',
    input_token_count  int null comment '输入token数',
    output_token_count int null comment '输出token数',
    token_cost         bigint null comment '本次任务消耗积分/配额',
    create_by          varchar(64)   not null comment '创建人',
    create_time        bigint        not null comment '创建时间',
    update_by          varchar(64)   not null comment '修改人',
    update_time        bigint        not null comment '修改时间'
) comment '计算任务实例表';

create index idx_endpoint_type
    on nemo_compute_task (endpoint_type, create_time, task_status, user_id);

create index idx_worker_host_task_status
    on nemo_compute_task (worker_host, task_status);

create table nemo_compute_task_file
(
    file_id     varchar(32)  not null comment '文件ID',
    task_id     varchar(32)  not null comment '任务ID',
    file_type   varchar(32)  not null comment '文件类型',
    name        varchar(190) not null comment '文件标识名',
    create_time bigint       not null comment '创建时间',
    create_by   varchar(64)  not null comment '创建人',
    primary key (task_id, file_id, name)
) comment '计算任务关联文件表';

create index idx_task_id
    on nemo_compute_task_file (task_id);

create table nemo_file
(
    file_id     varchar(32)  not null comment '文件ID'
		primary key,
    user_id     varchar(32)  not null comment '用户ID',
    file_name   varchar(190) not null comment '文件名',
    oss_path    varchar(500) not null comment 'OSS存储路径',
    file_size   bigint       not null comment '文件大小（字节）',
    file_type   varchar(50)  not null comment '文件类型（扩展名）',
    mime_type   varchar(190) not null comment 'MIME类型',
    create_by   varchar(64)  not null comment '创建人',
    create_time bigint       not null comment '创建时间',
    update_by   varchar(64)  not null comment '修改人',
    update_time bigint       not null comment '修改时间'
) comment '文件表';

create index idx_user_id
    on nemo_file (user_id);

create table nemo_invitation_codes
(
    invitation_code_id varchar(32) not null comment 'ID'
		primary key,
    code               varchar(20) not null comment '邀请码',
    inviter_id         varchar(32) not null comment '邀请人用户ID',
    used_count         int default 0 null comment '使用次数',
    create_by          varchar(64) not null comment '创建人',
    create_time        bigint      not null comment '创建时间',
    update_by          varchar(64) not null comment '修改人',
    update_time        bigint      not null comment '修改时间',
    constraint uk_code
        unique (code)
) comment '邀请码表';

create index idx_inviter_id
    on nemo_invitation_codes (inviter_id);

create table nemo_invoice
(
    invoice_id       varchar(32)                   not null comment '发票ID'
		primary key,
    invoice_no       varchar(32)                   not null comment '发票编号',
    user_id          varchar(32)                   not null comment '用户ID',
    invoice_type     varchar(32)                   not null comment '发票类型',
    title            varchar(190)                  not null comment '发票抬头',
    amount           decimal(10, 2)                not null comment '开票金额',
    credit_code      varchar(32) null comment '社会统一信用代码(企业发票)',
    email            varchar(190)                  not null comment '接收邮箱',
    remark           varchar(190) null comment '备注',
    status           varchar(32) default 'PENDING' not null comment '发票状态',
    reject_reason    varchar(190) null comment '拒绝原因',
    invoice_file_url varchar(500) null comment '发票文件URL',
    apply_time       bigint                        not null comment '申请时间',
    issue_time       bigint null comment '开具时间',
    create_by        varchar(64)                   not null comment '创建人',
    create_time      bigint                        not null comment '创建时间',
    update_by        varchar(64)                   not null comment '修改人',
    update_time      bigint                        not null comment '修改时间',
    constraint uk_invoice_no
        unique (invoice_no)
) comment '开票记录表';

create index idx_status
    on nemo_invoice (user_id, apply_time);

create table nemo_llm_log
(
    log_id             varchar(32)  not null comment '日志ID'
		primary key,
    biz_type           varchar(64)  not null comment '业务类型',
    biz_id             varchar(64)  not null comment '业务ID',
    user_id            varchar(32)  not null comment '用户ID',
    account_id         varchar(32)  not null comment '账号ID',
    url                varchar(190) not null comment '请求URL',
    model              varchar(190) not null comment '模型名称',
    input_content      mediumtext   not null comment '输入内容',
    output_content     mediumtext null comment '输出内容',
    input_token_count  int null comment '输入token数',
    output_token_count int null comment '输出token数',
    total_token_count  int null comment '总token数',
    create_time        bigint       not null comment '创建时间',
    create_by          varchar(64)  not null comment '创建人'
) comment 'LLM调用日志表';

create index idx_biz_type_biz_id
    on nemo_llm_log (biz_type, biz_id);

create index idx_create_time
    on nemo_llm_log (create_time);

create index idx_user_id
    on nemo_llm_log (user_id);

create table nemo_notification
(
    notification_id varchar(32)                  not null comment '通知ID'
		primary key,
    user_id         varchar(32)                  not null comment '用户ID',
    type            varchar(32)                  not null comment '通知类型',
    title           varchar(500)                 not null comment '通知标题',
    content         text                         not null comment '通知内容',
    ext_data        json null comment '扩展数据',
    priority        varchar(32) default 'NORMAL' not null comment '优先级',
    status          varchar(32) default 'UNREAD' not null comment '状态',
    read_time       bigint null comment '已读时间',
    link_url        varchar(500) null comment '跳转链接',
    link_id         varchar(64) null comment '关联业务ID',
    create_by       varchar(64)                  not null comment '创建人',
    create_time     bigint                       not null comment '创建时间',
    update_by       varchar(64)                  not null comment '修改人',
    update_time     bigint                       not null comment '修改时间'
) comment '通知表';

create index idx_user_status
    on nemo_notification (user_id, status, priority);

create table nemo_order
(
    order_id               varchar(32)                 not null comment '订单ID'
		primary key,
    order_no               varchar(64)                 not null comment '订单编号',
    account_id             varchar(32)                 not null comment '账户ID',
    product_id             varchar(32)                 not null comment '产品ID',
    subscription_plan_id   varchar(32) null comment '套餐ID（套餐订单必填，独立产品的订单为NULL）',
    product_snapshot       json                        not null comment '产品快照',
    quantity               int            default 1    not null comment '购买数量',
    original_amount        decimal(12, 2)              not null comment '原价总额',
    discount_amount        decimal(12, 2) default 0.00 not null comment '优惠金额',
    points_deduct_amount   decimal(12, 2) default 0.00 not null comment '积分抵扣金额',
    points_used            int            default 0    not null comment '使用积分数量',
    pay_amount             decimal(12, 2)              not null comment '实付金额',
    status                 varchar(32)                 not null comment '订单状态：PENDING/PAID/CANCELLED/REFUNDED',
    pay_method             varchar(32) null comment '支付方式',
    paid_time              bigint null comment '支付时间',
    expire_time            bigint                      not null comment '订单过期时间',
    remark                 varchar(512) null comment '备注',
    source                 varchar(190)   default 'TO_C' null comment '订单来源',
    create_by              varchar(32)    default ''   not null comment '创建人',
    create_time            bigint         default 0    not null comment '创建时间',
    update_by              varchar(32)    default ''   not null comment '更新人',
    update_time            bigint         default 0    not null comment '更新时间',
    token_remaining_amount bigint         default 0    not null comment '流量包剩余数量',
    token_pack_status      varchar(16) null comment '流量包状态',
    constraint uk_order_no
        unique (order_no)
) comment '订单表' charset=utf8mb4;

create index idx_account_id
    on nemo_order (account_id);

create index idx_product_id
    on nemo_order (product_id);

create index idx_subscription_plan_id
    on nemo_order (subscription_plan_id);

create index idx_token_pack_status
    on nemo_order (account_id, product_id, token_pack_status);

create table nemo_points_record
(
    record_id      varchar(32) not null comment '记录ID（主键）'
		primary key,
    account_id     varchar(32) not null comment '账户ID',
    points         int         not null comment '积分变动（正数增加，负数减少）',
    balance_before int         not null comment '变动前余额',
    balance_after  int         not null comment '变动后余额',
    TYPE           varchar(32) not null comment '类型：INVITE_REWARD/INVITED_REWARD/ORDER_DEDUCT/ADMIN_ADJUST/ACTIVITY',
    biz_id         varchar(32) null comment '关联业务ID',
    biz_type       varchar(32) null comment '关联业务类型',
    remark         varchar(500) null comment '备注',
    create_by      varchar(64) not null comment '创建人',
    create_time    bigint      not null comment '创建时间',
    update_by      varchar(64) not null comment '修改人',
    update_time    bigint      not null comment '修改时间'
) comment '积分记录表';

create index idx_account_type_time
    on nemo_points_record (account_id, TYPE, create_time);

create index idx_create_time
    on nemo_points_record (create_time);

create table nemo_product
(
    product_id            varchar(32)            not null comment '产品ID'
		primary key,
    product_code          varchar(32)            not null comment '产品编码',
    product_name          varchar(190)           not null comment '产品名称',
    product_type          varchar(32)            not null comment '产品类型：SUBSCRIPTION/TOKEN_PACK',
    subscription_plan_id  varchar(32) null comment '关联套餐ID',
    subscription_months   int null comment '订阅月数',
    token_amount          decimal(16, 4) null comment 'Token数量',
    validity_days         int null comment '有效期天数',
    original_price        decimal(12, 2)         not null comment '原价',
    current_price         decimal(12, 2)         not null comment '现价',
    points_deduct_enabled tinyint(1) default 1 not null comment '是否支持积分抵扣',
    max_points_deduct     int null comment '最大积分抵扣数量',
    sort_order            int         default 0  not null comment '排序',
    is_active             tinyint(1) default 1 not null comment '是否上架',
    create_by             varchar(32) default '' not null comment '创建人',
    create_time           bigint      default 0  not null comment '创建时间',
    update_by             varchar(32) default '' not null comment '更新人',
    update_time           bigint      default 0  not null comment '更新时间'
) comment '产品表' charset=utf8mb4;

create index idx_subscription_plan_id
    on nemo_product (subscription_plan_id);

create table nemo_story
(
    story_id    varchar(32)  not null comment '故事ID'
		primary key,
    user_id     varchar(32)  not null comment '用户ID',
    title       varchar(190) not null comment '故事标题',
    author      varchar(64)  not null comment '作者',
    description varchar(2000) null comment '故事描述',
    create_by   varchar(64)  not null comment '创建人',
    create_time bigint       not null comment '创建时间',
    update_by   varchar(64)  not null comment '修改人',
    update_time bigint       not null comment '修改时间'
) comment '故事表';

create index idx_user_id
    on nemo_story (user_id);

create table nemo_story_chart_rel
(
    story_id    varchar(32)   not null comment '故事ID',
    chart_id    varchar(32)   not null comment '图表ID',
    description text null comment '描述',
    sort_order  int default 0 not null comment '排序顺序',
    create_by   varchar(64)   not null comment '创建人',
    create_time bigint        not null comment '创建时间',
    update_by   varchar(64)   not null comment '修改人',
    update_time bigint        not null comment '修改时间',
    primary key (story_id, chart_id)
) comment '故事图表关联表';

create index idx_chart_id
    on nemo_story_chart_rel (chart_id);

create table nemo_subscription_plan
(
    plan_id          varchar(32)                 not null comment '套餐ID'
		primary key,
    plan_code        varchar(32)                 not null comment '套餐编码：STANDARD/PRO',
    plan_name        varchar(64)                 not null comment '套餐名称',
    plan_description varchar(512) null comment '套餐描述',
    plan_type        varchar(32) null comment '套餐类型',
    monthly_price    decimal(12, 2) default 0.00 not null comment '月费价格',
    pricing_rules    json null comment '计费规则',
    features         json null comment '功能特性列表',
    sort_order       int            default 0    not null comment '排序顺序',
    is_recommended   tinyint(1) default 0 not null comment '是否主推套餐',
    is_active        tinyint(1) default 1 not null comment '是否启用',
    create_by        varchar(32)    default ''   not null comment '创建人',
    create_time      bigint         default 0    not null comment '创建时间',
    update_by        varchar(32)    default ''   not null comment '更新人',
    update_time      bigint         default 0    not null comment '更新时间',
    constraint uk_plan_code
        unique (plan_code)
) comment '订阅套餐表' charset=utf8mb4;

create table nemo_sysctl
(
    sys_key     varchar(190) not null comment '键'
		primary key,
    sys_value   text         not null comment '值',
    update_time bigint       not null comment '修改时间'
) comment '系统配置';

create table nemo_token_usage_record
(
    record_id      varchar(32)            not null comment '记录ID'
		primary key,
    account_id     varchar(32)            not null comment '账户ID',
    order_id       varchar(32)            not null comment '关联订单ID',
    product_id     varchar(32)            not null comment '产品ID',
    used_amount    bigint                 not null comment '消耗Token数量',
    balance_before bigint                 not null comment '消耗前余额',
    balance_after  bigint                 not null comment '消耗后余额',
    biz_type       varchar(32)            not null comment '业务类型',
    biz_id         varchar(64) null comment '业务ID',
    remark         varchar(256) null comment '备注',
    create_by      varchar(64) default '' not null,
    create_time    bigint      default 0  not null,
    update_by      varchar(64) default '' not null,
    update_time    bigint      default 0  not null
) comment 'Token消耗记录表' charset=utf8mb4;

create index idx_account_id
    on nemo_token_usage_record (account_id);

create index idx_create_time
    on nemo_token_usage_record (create_time);

create index idx_order_id
    on nemo_token_usage_record (order_id);

create table nemo_agent_round_log
(
    id                varchar(32) not null comment '主键ID'
		primary key,
    session_id        varchar(32) not null comment '会话ID',
    file_id_list      text null comment '文件ID列表(JSON)',
    parent_id         varchar(32) default '' null comment '父级ID',
    ROLE              varchar(16) not null comment '角色',
    content           text null comment '消息内容',
    reasoning_content text null comment '思考内容',
    spend_time        int         default 0 null comment '花费时间',
    tool_call_result  text null comment '工具调用结果',
    create_by         varchar(64) not null comment '创建人',
    create_time       bigint      not null comment '创建时间',
    update_by         varchar(64) not null comment '修改人',
    update_time       bigint      not null comment '修改时间'
) comment '智能体会话轮次表';

create index idx_session_id
    on nemo_agent_round_log (session_id);

create table nemo_agent_session
(
    session_id  varchar(32)  not null comment '会话ID'
		primary key,
    TYPE        varchar(190) not null comment '类型',
    summary     varchar(190) default '' null comment '摘要',
    query_num   int          default 0 null comment '对话提问数',
    deleted     tinyint(1) default 0 null comment '是否删除',
    user_id     varchar(32)  not null comment '用户ID',
    create_by   varchar(64)  not null comment '创建人',
    create_time bigint       not null comment '创建时间',
    update_by   varchar(64)  not null comment '修改人',
    update_time bigint       not null comment '修改时间'
) comment '智能体会话表';

create index idx_user_id
    on nemo_agent_session (user_id);

create table nemo_user
(
    user_id         varchar(32)  not null comment '主键ID'
		primary key,
    username        varchar(190) not null comment '用户名',
    password        varchar(190) not null comment '密码（BCrypt加密）',
    nickname        varchar(190) null comment '昵称',
    avatar_url      varchar(500) null comment '头像URL',
    phone           varchar(20) null comment '手机号（加密存储）',
    email           varchar(190) null comment '邮箱',
    register_ip     varchar(64) null comment '注册IP',
    last_login_ip   varchar(64) null comment '最后登录IP',
    last_login_time bigint null comment '最后登录时间',
    status          varchar(64) null comment '用户状态',
    create_by       varchar(64)  not null comment '创建人',
    create_time     bigint       not null comment '创建时间',
    update_by       varchar(64)  not null comment '修改人',
    update_time     bigint       not null comment '修改时间',
    constraint uk_email
        unique (email),
    constraint uk_username
        unique (username)
) comment '用户表';

create table nemo_user_account
(
    account_id              varchar(32)      not null comment '账户ID（主键）'
		primary key,
    user_id                 varchar(32)      not null comment '关联用户ID',
    token_balance           bigint default 0 not null comment 'Token可用余额（单位：毫，1元=1000）',
    token_frozen            bigint default 0 not null comment 'Token冻结金额（单位：毫，1元=1000）',
    points_balance          int    default 0 not null comment '积分余额',
    points_used             int    default 0 not null comment '累计已使用积分',
    current_plan_id         varchar(64) null comment '当前订阅套餐ID',
    subscription_end_time   bigint null comment '订阅到期时间（毫秒时间戳）',
    subscribe_token_balance bigint default 0 not null comment '订阅token余额（每月1号重置）',
    subscribe_token_quota   bigint default 0 not null comment '订阅token配额（月发放量）',
    create_by               varchar(64)      not null comment '创建人',
    create_time             bigint           not null comment '创建时间',
    update_by               varchar(64)      not null comment '修改人',
    update_time             bigint           not null comment '修改时间',
    constraint uk_user_id
        unique (user_id)
) comment '用户账户表';

create table nemo_user_agreement
(
    agreement_record_id varchar(32) not null comment 'ID'
		primary key,
    user_id             varchar(32) not null comment '用户ID',
    agreement_id        varchar(32) not null comment '协议ID',
    agreement_version   varchar(32) not null comment '协议版本',
    ip_address          varchar(64) null comment 'IP地址',
    user_agent          varchar(500) null comment '浏览器信息',
    device_info         varchar(500) null comment '设备信息',
    create_by           varchar(64) not null comment '创建人',
    create_time         bigint      not null comment '创建时间',
    update_by           varchar(64) not null comment '修改人',
    update_time         bigint      not null comment '修改时间',
    constraint uk_user_agreement
        unique (user_id, agreement_id)
) comment '用户协议授权表';

create index idx_agreement_id
    on nemo_user_agreement (agreement_id);

create index idx_user_id
    on nemo_user_agreement (user_id);

create table nemo_user_invitations
(
    relation_id     varchar(32) not null comment 'ID'
		primary key,
    inviter_id      varchar(32) not null comment '邀请人用户ID',
    invitee_id      varchar(32) not null comment '被邀请人用户ID',
    invitation_code varchar(20) not null comment '使用的邀请码',
    invite_time     bigint      not null comment '邀请时间',
    create_by       varchar(64) not null comment '创建人',
    create_time     bigint      not null comment '创建时间',
    update_by       varchar(64) not null comment '修改人',
    update_time     bigint      not null comment '修改时间'
) comment '邀请记录表';

create index idx_invitation_code
    on nemo_user_invitations (invitation_code);

create index idx_invitee_id
    on nemo_user_invitations (invitee_id);

create index idx_inviter_id
    on nemo_user_invitations (inviter_id);

create table nemo_user_profiles
(
    user_id      varchar(32) not null comment '用户ID'
		primary key,
    organization varchar(190) null comment '机构/学校',
    real_name    varchar(190) null comment '真实姓名（加密存储）',
    id_card      varchar(190) null comment '身份证号（加密存储）',
    birthday     date null comment '生日',
    gender       tinyint null comment '性别：0-未知 1-男 2-女',
    province     varchar(64) null comment '省份',
    city         varchar(64) null comment '城市',
    bio          text null comment '个人简介',
    create_by    varchar(64) not null comment '创建人',
    create_time  bigint      not null comment '创建时间',
    update_by    varchar(64) not null comment '修改人',
    update_time  bigint      not null comment '修改时间'
) comment '用户扩展信息表';

create table nemo_user_subscription
(
    subscription_id varchar(32)            not null comment '订阅ID'
		primary key,
    account_id      varchar(32)            not null comment '账户ID',
    plan_id         varchar(32)            not null comment '套餐ID',
    start_time      bigint                 not null comment '订阅开始时间',
    end_time        bigint null comment '订阅结束时间',
    status          varchar(16)            not null comment '状态：ACTIVE/EXPIRED/CANCELLED',
    create_by       varchar(32) default '' not null comment '创建人',
    create_time     bigint      default 0  not null comment '创建时间',
    update_by       varchar(32) default '' not null comment '更新人',
    update_time     bigint      default 0  not null comment '更新时间'
) comment '用户订阅表' charset=utf8mb4;

create index idx_account_id
    on nemo_user_subscription (account_id);

create index idx_plan_id
    on nemo_user_subscription (plan_id);
