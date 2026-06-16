package com.ywllab.nemo.service

import cn.hutool.core.util.IdUtil
import com.ywllab.nemo.constant.ProductType
import com.ywllab.nemo.dao.ProductDao
import com.ywllab.nemo.dao.SubscriptionPlanDao
import com.ywllab.nemo.dto.PageResultDto
import com.ywllab.nemo.dto.subscription.CreateProductRequest
import com.ywllab.nemo.dto.subscription.ProductDto
import com.ywllab.nemo.dto.subscription.UpdateProductRequest
import com.ywllab.nemo.exception.BizException
import com.ywllab.nemo.model.Product
import org.jetbrains.exposed.sql.transactions.transaction
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
open class ProductService {
    private val log = LoggerFactory.getLogger(ProductService::class.java)

    open fun list(pageNum: Int = 1, pageSize: Int = 20, planId: String? = null): PageResultDto<ProductDto> {
        val (products, total) = ProductDao.list(pageNum, pageSize, planId)
        val dtos = products.map { toDto(it) }
        return PageResultDto(dtos, total, pageNum.toLong(), pageSize.toLong())
    }

    open fun listActive(): List<ProductDto> {
        return transaction {
            ProductDao.listActive().map { toDto(it) }
        }
    }

    open fun getById(productId: String): ProductDto? {
        val product = ProductDao.getById(productId) ?: return null
        return toDto(product)
    }

    open fun create(request: CreateProductRequest): ProductDto {
        val userId = UserSessionHelper.getUserId()

        if (request.productType == ProductType.SUBSCRIPTION) {
            if (request.subscriptionPlanId == null) {
                throw BizException("订阅套餐产品必须关联套餐ID")
            }
            SubscriptionPlanDao.getById(request.subscriptionPlanId!!)
                ?: throw BizException("关联的套餐不存在")
        }

        val product = Product().apply {
            productId = IdUtil.getSnowflakeNextIdStr()
            productCode = request.productCode
            productName = request.productName
            productType = request.productType
            subscriptionPlanId = request.subscriptionPlanId
            subscriptionMonths = request.subscriptionMonths
            tokenAmount = request.tokenAmount
            originalPrice = request.originalPrice
            currentPrice = request.currentPrice
            pointsDeductEnabled = request.pointsDeductEnabled
            maxPointsDeduct = request.maxPointsDeduct
            sortOrder = request.sortOrder
            isActive = request.isActive
            createBy = userId
            createTime = System.currentTimeMillis()
            updateBy = userId
            updateTime = System.currentTimeMillis()
        }

        ProductDao.create(product)
        log.info("Product created, productId={}, userId={}", product.productId, userId)
        return toDto(product)
    }

    open fun update(productId: String, request: UpdateProductRequest): ProductDto {
        val userId = UserSessionHelper.getUserId()
        val product = ProductDao.getById(productId) ?: throw BizException("产品不存在")

        product.productName = request.productName
        product.subscriptionMonths = request.subscriptionMonths
        product.tokenAmount = request.tokenAmount
        product.originalPrice = request.originalPrice
        product.currentPrice = request.currentPrice
        product.pointsDeductEnabled = request.pointsDeductEnabled
        product.maxPointsDeduct = request.maxPointsDeduct
        product.sortOrder = request.sortOrder
        product.isActive = request.isActive
        product.updateBy = userId
        product.updateTime = System.currentTimeMillis()

        ProductDao.update(product)
        log.info("Product updated, productId={}, userId={}", productId, userId)
        return toDto(product)
    }

    open fun updateStatus(productId: String, isActive: Boolean): ProductDto {
        val userId = UserSessionHelper.getUserId()
        val product = ProductDao.getById(productId) ?: throw BizException("产品不存在")

        product.isActive = isActive
        product.updateBy = userId
        product.updateTime = System.currentTimeMillis()

        ProductDao.update(product)
        log.info("Product status updated, productId={}, isActive={}, userId={}", productId, isActive, userId)
        return toDto(product)
    }

    private fun toDto(product: Product): ProductDto {
        return ProductDto().apply {
            this.productId = product.productId
            this.productCode = product.productCode
            this.productName = product.productName
            this.productType = product.productType
            this.subscriptionPlanId = product.subscriptionPlanId
            this.subscriptionMonths = product.subscriptionMonths
            this.tokenAmount = product.tokenAmount
            this.originalPrice = product.originalPrice
            this.currentPrice = product.currentPrice
            this.pointsDeductEnabled = booleanToBoolean(product.pointsDeductEnabled)
            this.maxPointsDeduct = product.maxPointsDeduct
            this.sortOrder = product.sortOrder
            this.isActive = booleanToBoolean(product.isActive)
        }
    }

    private fun booleanToBoolean(value: Any?): Boolean {
        return when (value) {
            is Boolean -> value
            is Int -> value == 1
            else -> true
        }
    }
}
