package com.ywllab.nemo.service

import cn.hutool.core.io.file.FileNameUtil
import cn.hutool.core.lang.Validator
import cn.hutool.core.util.IdUtil
import cn.hutool.core.util.RandomUtil
import cn.hutool.crypto.digest.BCrypt
import com.alibaba.fastjson.JSON
import com.ywllab.nemo.constant.FileType
import com.ywllab.nemo.constant.VerificationCodeType
import com.ywllab.nemo.dao.AgreementDao
import com.ywllab.nemo.dao.ChannelOrderDao
import com.ywllab.nemo.dao.UserAgreementDao
import com.ywllab.nemo.dao.UserDao
import com.ywllab.nemo.dao.UserProfileDao
import com.ywllab.nemo.dto.PageResultDto
import com.ywllab.nemo.dto.user.BossUserDetail
import com.ywllab.nemo.dto.user.ChangePasswordByCodeRequest
import com.ywllab.nemo.dto.user.ChangePasswordByPasswordRequest
import com.ywllab.nemo.dto.user.EmailRegisterRequest
import com.ywllab.nemo.dto.user.LoginParam
import com.ywllab.nemo.dto.user.UpdateEmailRequest
import com.ywllab.nemo.dto.user.UpdateUserRequest
import com.ywllab.nemo.dto.user.UserSession
import com.ywllab.nemo.exception.BizException
import com.ywllab.nemo.exception.ParamException
import com.ywllab.nemo.model.User
import com.ywllab.nemo.model.UserProfile
import com.ywllab.nemo.util.ClientDeviceUtil
import com.ywllab.nemo.util.ClientIpUtil
import com.ywllab.nemo.util.CryptoUtil
import org.jetbrains.exposed.sql.transactions.transaction
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import java.util.concurrent.TimeUnit
import javax.annotation.PostConstruct
import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpSession

@Service
open class UserService {
    val log: Logger = LoggerFactory.getLogger(javaClass)

    @Autowired
    private lateinit var emailService: EmailService

    @Autowired
    private lateinit var invitationCodeService: InvitationCodeService

    @Autowired
    private lateinit var invitationService: InvitationService

    @Autowired
    lateinit var fileService: FileService

    @Autowired
    private lateinit var agreementService: AgreementService

    @Autowired
    private lateinit var userAccountService: UserAccountService

    @Autowired
    private lateinit var channelOrderService: ChannelOrderService

    @Autowired
    private lateinit var ossService: OssService

    private lateinit var universityMapping: Map<String, String>

    companion object {
        const val ADMINER_USER = "nemo"
        const val AVATAR_PROCESS = "image/resize,h_200"
    }

    @Suppress("UNCHECKED_CAST")
    @PostConstruct
    fun init() {
        val resource = ClassPathResource("university-mapping.json")
        universityMapping = try {
            val json = resource.inputStream.bufferedReader().use { it.readText() }
            JSON.parseObject(json).toJavaObject(Map::class.java) as Map<String, String>
        } catch (e: Exception) {
            emptyMap()
        }
    }

    /**
     * Boss端登录，不处理协议授权
     */
    open fun login(param: LoginParam): UserSession {
        return doLogin(param)
    }

    /**
     * C端登录，处理协议授权
     */
    open fun login(httpRequest: HttpServletRequest, param: LoginParam): UserSession {
        return doLogin(param, httpRequest)
    }

    private fun doLogin(param: LoginParam, httpRequest: HttpServletRequest? = null): UserSession {
        val isCodeLogin = param.verifyCode != null && param.password == null
        val isPasswordLogin = param.password != null && param.verifyCode == null

        if (!isCodeLogin && !isPasswordLogin) {
            throw ParamException("登录参数错误")
        }

        val user = findUserByUsernameOrEmailOrPhone(param.username)
            ?: throw ParamException("用户名/邮箱不存在")

        if (user.status != "ACTIVE") {
            throw ParamException("非法用户")
        }

        if (isPasswordLogin) {
            if (!BCrypt.checkpw(CryptoUtil.decrypt(param.password!!), user.password)) {
                throw ParamException("密码不正确")
            }
        } else {
            param.verifyCode ?: throw ParamException("验证码不能为空")
            emailService.verifyCode(user.email, param.verifyCode!!, VerificationCodeType.LOGIN)
        }

        UserDao.updateLastLoginTime(user.userId)

        // 处理用户协议授权（复用注册时的逻辑）
        if (httpRequest != null && param.agreementIds.isNotEmpty()) {
            // 校验协议是否存在
            if (AgreementDao.countByIds(param.agreementIds) != param.agreementIds.size) {
                throw ParamException("协议不存在")
            }
            val userAgent = httpRequest.getHeader("User-Agent")
            val deviceInfo = ClientDeviceUtil.deviceInfo(userAgent)
            val ipAddress = ClientIpUtil.getClientIp(httpRequest)
            param.agreementIds.forEach { agreementId ->
                // 如果用户尚未授权该协议，则新增授权记录
                if (UserAgreementDao.getByUserIdAndAgreementId(user.userId, agreementId) == null) {
                    agreementService.recordUserAgreementOnRegister(
                        userId = user.userId,
                        agreementId = agreementId,
                        ipAddress = ipAddress,
                        userAgent = userAgent,
                        deviceInfo = deviceInfo
                    )
                }
            }
        }

        // 从UserProfile表获取机构
        val organization = UserProfileDao.getOrganization(user.userId)
        val avatarUrl = user.avatarUrl?.let {
            ossService.generatePresignedUrl(it, 7, TimeUnit.DAYS, AVATAR_PROCESS)
        }
        val userSession = UserSession().apply {
            userId = user.userId
            username = user.username
            nickname = user.nickname ?: user.username
            email = user.email
            this.avatarUrl = avatarUrl
            this.organization = organization
        }
        UserSessionHelper.setUserSession(userSession)
        return userSession
    }

    open fun logout(session: HttpSession) {
        session.invalidate()
    }

    open fun getByEmail(email: String): User? {
        return UserDao.getByEmail(email)
    }

    private fun generateUsername(prefix: String): String {
        var code: String
        do {
            code = prefix + "-" + RandomUtil.randomString(6).lowercase()
        } while (UserDao.getByUsername(code) != null)
        return code
    }

    open fun createUser(httpRequest: HttpServletRequest, request: EmailRegisterRequest): String {
        // 校验email格式
        if (!Validator.isEmail(request.email)) {
            throw ParamException("邮箱格式不正确")
        }
        if (request.agreementIds.isEmpty()) {
            throw ParamException("请同意协议")
        }
        if (AgreementDao.countByIds(request.agreementIds) != request.agreementIds.size) {
            throw ParamException("协议不存在")
        }
        if (UserDao.getByEmail(request.email) != null) {
            throw BizException("用户邮箱已注册")
        }
        if (!emailService.verifyCode(request.email, request.verifyCode, VerificationCodeType.REGISTER)) {
            throw BizException("验证码无效")
        }
        // 解密前端AES加密后的Base64密码
        val decryptedPassword = CryptoUtil.decrypt(request.password)
        val randomUserName = generateUsername(request.email.split("@")[0])
        val user = User().apply {
            userId = IdUtil.getSnowflakeNextIdStr()
            this.username = randomUserName
            password = decryptedPassword
            nickname = request.nickname
            email = request.email
        }

        // 从教育邮箱提取机构名称
        val organization = extractOrganizationFromEmail(request.email)

        // 调用公共创建方法
        doCreateUser(user, ADMINER_USER, organization, request.inviteCode)

        transaction {
            if (request.agreementIds.isNotEmpty()) {
                // 记录用户协议授权
                val userAgent = httpRequest.getHeader("User-Agent")
                val deviceInfo = ClientDeviceUtil.deviceInfo(userAgent)
                request.agreementIds.forEach {
                    agreementService.recordUserAgreementOnRegister(
                        userId = user.userId,
                        agreementId = it,
                        ipAddress = ClientIpUtil.getClientIp(httpRequest),
                        userAgent = userAgent,
                        deviceInfo = deviceInfo
                    )
                }
            }
            emailService.clearCode(request.email, VerificationCodeType.REGISTER)
        }
        return user.userId
    }

    open fun doCreateUser(
        user: User,
        operator: String,
        organization: String? = null,
        inviteCode: String? = null
    ): String {
        if (UserDao.getByUsername(user.username) != null) {
            throw BizException("用户已存在")
        }

        val userId = user.userId
        user.password = BCrypt.hashpw(user.password, BCrypt.gensalt())

        transaction {
            UserDao.create(user, operator)
            // 创建用户账户
            val account = userAccountService.createAccount(userId, operator)
            // 为用户生成邀请码
            invitationCodeService.getOrCreateCode(userId)
            // 创建用户扩展信息
            val organization = organization ?: ""
            UserProfileDao.create(userId, organization, operator)
            // 处理邀请码逻辑
            if (!inviteCode.isNullOrBlank()) {
                val invitationCode = invitationCodeService.validateAndUseCode(inviteCode)
                if (invitationCode != null) {
                    invitationService.createInvitationRecord(invitationCode.inviterId, userId, inviteCode)
                    userAccountService.rewardInvitePoints(invitationCode.inviterId, userId, operator)
                }
            }

            val pendingOrders = ChannelOrderDao.getPendingByEmail(user.email)
            log.info(
                "激活渠道订单: {} 个, email: {}, userId: {}, accountId: {}, operator: {}",
                pendingOrders.size, user.email, userId, account.accountId, operator
            )
            // 激活待激活的渠道订单
            pendingOrders.forEach { channelOrder ->
                channelOrderService.activateChannelOrder(channelOrder, account.accountId, operator)
            }
        }
        return userId
    }

    open fun updateUser(user: User) {
        user.updateTime = System.currentTimeMillis()
        UserDao.update(user)
    }

    open fun updateCurrentUser(request: UpdateUserRequest) {
        val session = UserSessionHelper.getUserSession()
        // 更新 User 表的昵称
        if (request.nickname != null) {
            val user = UserDao.getById(session.userId) ?: throw BizException("用户不存在")
            user.nickname = request.nickname
            user.updateTime = System.currentTimeMillis()
            UserDao.update(user)
            session.nickname = request.nickname
        }

        // 更新 UserProfile 表的机构
        if (request.organization != null) {
            val profile = UserProfileDao.getById(session.userId)
            if (profile == null) {
                // todo fixme 兼容历史数据，后续需要删除
                UserProfileDao.create(session.userId, request.organization ?: "", ADMINER_USER)
            } else {
                UserProfileDao.updateOrganization(session.userId, request.organization)
            }
            session.organization = request.organization
        }

        // 更新 UserSession
        UserSessionHelper.setUserSession(session)
    }

    /**
     * 修改邮箱
     * 需要验证新邮箱的验证码，且新邮箱不能已被其他用户使用
     */
    open fun updateEmail(request: UpdateEmailRequest) {
        val userId = UserSessionHelper.getUserId()

        // 校验新邮箱格式
        if (!Validator.isEmail(request.newEmail)) {
            throw ParamException("邮箱格式不正确")
        }

        // 检查新邮箱是否已被其他用户使用
        val existingUser = UserDao.getByEmail(request.newEmail)
        if (existingUser != null && existingUser.userId != userId) {
            throw BizException("该邮箱已被其他用户使用")
        }

        // 验证验证码
        if (!emailService.verifyCode(request.newEmail, request.verifyCode, VerificationCodeType.UPDATE_EMAIL)) {
            throw BizException("验证码无效或已过期")
        }

        transaction {
            // 更新邮箱
            UserDao.updateEmail(userId, request.newEmail)
            // 更新 UserSession 中的邮箱
            val session = UserSessionHelper.getUserSession()
            session.email = request.newEmail
            UserSessionHelper.setUserSession(session)
        }
    }

    open fun changePasswordByPassword(request: ChangePasswordByPasswordRequest) {
        val userId = UserSessionHelper.getUserId()
        val user = UserDao.getById(userId)
            ?: throw BizException("用户不存在")
        // 前后端的密码使用固定的加密算法传输
        val newPassword = CryptoUtil.decrypt(request.newPassword)
        val oldPassword = CryptoUtil.decrypt(request.oldPassword)
        // user.password是bcrypt加密后的密码
        if (!BCrypt.checkpw(oldPassword, user.password)) {
            throw BizException("密码错误")
        }
        val hashedPassword = BCrypt.hashpw(newPassword, BCrypt.gensalt())
        UserDao.updatePassword(userId, hashedPassword)
    }

    open fun changePasswordByCode(request: ChangePasswordByCodeRequest) {
        val user = UserDao.getByEmail(request.email)
            ?: throw BizException("用户不存在")

        if (!emailService.verifyCode(request.email, request.verifyCode, VerificationCodeType.RESET_PASSWORD)) {
            throw BizException("验证码无效")
        }
        val newPassword = CryptoUtil.decrypt(request.newPassword)
        if (newPassword == user.password) {
            throw ParamException("不能和已有密码一致")
        }
        val hashedPassword = BCrypt.hashpw(newPassword, BCrypt.gensalt())
        UserDao.updatePassword(user.userId, hashedPassword)
    }

    open fun resetPassword(userId: String, newPassword: String) {
        val hashedPassword = BCrypt.hashpw(newPassword, BCrypt.gensalt())
        UserDao.updatePassword(userId, hashedPassword)
    }

    open fun listUsers(
        keyword: String?,
        status: String?,
        pageNum: Int,
        pageSize: Int
    ): PageResultDto<User> {
        val (list, total) = UserDao.list(keyword, status, pageNum, pageSize)
        return PageResultDto(list, total, pageNum.toLong(), pageSize.toLong())
    }

    /**
     * 根据用户ID获取用户信息
     */
    open fun getUserById(userId: String): User? {
        return UserDao.getById(userId)
    }

    /**
     * 根据用户ID获取用户扩展信息
     */
    open fun getUserProfile(userId: String): UserProfile? {
        return UserProfileDao.getById(userId)
    }

    /**
     * 获取用户详情（包含用户信息、用户扩展信息、账户信息和积分统计信息）
     */
    open fun getUserDetail(userId: String): BossUserDetail? {
        val user = getUserById(userId) ?: return null

        val profile = getUserProfile(userId)
        val account = userAccountService.getAccountInfo(userId)
        val pointsStatistics = userAccountService.getPointsStatistics(userId)

        val response = BossUserDetail().apply {
            this.user = user
            this.profile = profile
            this.account = account
            this.pointsStatistics = pointsStatistics
            this.registerTime = user.createTime
            this.lastLoginTime = user.lastLoginTime
            this.lastLoginIp = user.lastLoginIp
            this.status = user.status
            this.isLocked = user.isLocked
        }

        return response
    }

    open fun deleteUser(userId: String) {
        UserDao.deleteById(userId)
    }

    private fun findUserByUsernameOrEmailOrPhone(identifier: String): User? {
        return UserDao.getByUsername(identifier)
            ?: UserDao.getByEmail(identifier)
            ?: UserDao.getByPhone(identifier)
    }

    open fun updateAvatar(file: MultipartFile) {
        // 文件后缀，支持jpg、png
        val fileType = FileNameUtil.getSuffix(file.originalFilename).lowercase()
        if (fileType !in listOf("jpg", "png", "jpeg", "gif")) {
            throw ParamException("文件类型必须为jpg、png、jpeg、gif")
        }
        // 文件大小，最大1MB
        if (file.size > 1 * 1024 * 1024) {
            throw ParamException("文件大小不能超过1MB")
        }
        val res = fileService.add(FileType.AVATAR, file, false)

        transaction {
            UserDao.updateAvatarUrl(UserSessionHelper.getUserId(), res.url)
            val session = UserSessionHelper.getUserSession().also {
                it.avatarUrl = ossService.generatePresignedUrl(res.ossPath, 7, TimeUnit.DAYS, AVATAR_PROCESS)
            }
            UserSessionHelper.setUserSession(session)
        }
    }

    /**
     * 从教育邮箱提取机构名称
     * 支持格式：xxx@xxx.edu.cn, xxx@xxx.edu
     */
    private fun extractOrganizationFromEmail(email: String?): String? {
        if (email.isNullOrBlank()) return null

        val parts = email.split("@")
        if (parts.size != 2) return null

        val domain = parts[1].lowercase()

        // 教育邮箱域名后缀
        val educationSuffixes = listOf(".edu.cn", ".edu")

        // 检查是否是教育邮箱
        val isEducationEmail = educationSuffixes.any { domain.endsWith(it) }
        if (!isEducationEmail) return null

        // 提取学校/机构域名（去掉教育后缀）
        var orgDomain = domain
        for (suffix in educationSuffixes) {
            if (orgDomain.endsWith(suffix)) {
                orgDomain = orgDomain.substring(0, orgDomain.length - suffix.length)
                break
            }
        }

        // 从配置文件读取的高校域名映射
        return universityMapping[orgDomain] ?: orgDomain
    }
}
