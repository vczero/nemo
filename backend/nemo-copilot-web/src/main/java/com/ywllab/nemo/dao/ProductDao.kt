package com.ywllab.nemo.dao

import com.ywllab.nemo.constant.ProductType
import com.ywllab.nemo.dto.PageQuery
import com.ywllab.nemo.model.Product
import org.jetbrains.exposed.sql.Op
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update

object ProductDao : BaseDao<Product>("nemo_product") {
    val productId = varchar("product_id", 32)
    val productCode = varchar("product_code", 32)
    val productName = varchar("product_name", 190)
    val productType = enumerationByName<ProductType>("product_type", 16)
    val subscriptionPlanId = varchar("subscription_plan_id", 32).nullable()
    val subscriptionMonths = integer("subscription_months").nullable()
    val tokenAmount = decimal("token_amount", 16, 4).nullable()
    val validityDays = integer("validity_days").nullable()
    val originalPrice = decimal("original_price", 12, 2)
    val currentPrice = decimal("current_price", 12, 2)
    val pointsDeductEnabled = bool("points_deduct_enabled")
    val maxPointsDeduct = integer("max_points_deduct").nullable()
    val sortOrder = integer("sort_order")
    val isActive = bool("is_active")

    override val primaryKey = PrimaryKey(productId)

    private val self = this

    override fun createModel(): Product {
        return Product()
    }

    fun getById(idParam: String): Product? {
        return transaction {
            select { self.productId eq idParam }
                .map(mapper)
                .firstOrNull()
        }
    }

    fun list(pageNum: Int = 1, pageSize: Int = 20): Pair<List<Product>, Long> {
        val pageQuery = PageQuery().apply {
            this.pageNum = pageNum.toLong()
            this.pageSize = pageSize.toLong()
        }
        return page(pageQuery, sortOrder, org.jetbrains.exposed.sql.SortOrder.ASC) {
            Op.TRUE
        }
    }

    fun list(pageNum: Int = 1, pageSize: Int = 20, planId: String? = null): Pair<List<Product>, Long> {
        val pageQuery = PageQuery().apply {
            this.pageNum = pageNum.toLong()
            this.pageSize = pageSize.toLong()
        }
        return page(pageQuery, sortOrder, org.jetbrains.exposed.sql.SortOrder.ASC) {
            if (planId != null) {
                subscriptionPlanId eq planId
            } else {
                Op.TRUE
            }
        }
    }

    fun listActive(): List<Product> {
        return transaction {
            select { self.isActive eq true }
                .orderBy(sortOrder)
                .map(mapper)
        }
    }

    fun listProductByProductType(productType: ProductType): List<String> {
        return transaction {
            slice(self.productId).select { self.productType eq productType }
                .orderBy(sortOrder)
                .map { it[self.productId] }
        }
    }

    fun listPlanByProductType(productType: ProductType): List<String> {
        return transaction {
            slice(self.subscriptionPlanId).select { self.productType eq productType }
                .orderBy(sortOrder)
                .mapNotNull { it[self.subscriptionPlanId] }
        }
    }

    fun create(product: Product) {
        transaction {
            self.insert {
                it[productId] = product.productId
                it[productCode] = product.productCode
                it[productName] = product.productName
                it[productType] = product.productType
                it[subscriptionPlanId] = product.subscriptionPlanId
                it[subscriptionMonths] = product.subscriptionMonths
                it[tokenAmount] = product.tokenAmount?.toBigDecimal()
                it[validityDays] = product.validityDays
                it[originalPrice] = product.originalPrice.toBigDecimal()
                it[currentPrice] = product.currentPrice.toBigDecimal()
                it[pointsDeductEnabled] = product.pointsDeductEnabled
                it[maxPointsDeduct] = product.maxPointsDeduct
                it[sortOrder] = product.sortOrder
                it[isActive] = product.isActive
                it[createBy] = product.createBy
                it[createTime] = product.createTime
                it[updateBy] = product.updateBy
                it[updateTime] = product.updateTime
            }
        }
    }

    fun update(product: Product) {
        transaction {
            update({ productId eq product.productId }) {
                it[productName] = product.productName
                it[subscriptionMonths] = product.subscriptionMonths
                it[tokenAmount] = product.tokenAmount?.toBigDecimal()
                it[validityDays] = product.validityDays
                it[originalPrice] = product.originalPrice.toBigDecimal()
                it[currentPrice] = product.currentPrice.toBigDecimal()
                it[pointsDeductEnabled] = product.pointsDeductEnabled
                it[maxPointsDeduct] = product.maxPointsDeduct
                it[sortOrder] = product.sortOrder
                it[isActive] = product.isActive
                it[updateBy] = product.updateBy
                it[updateTime] = product.updateTime
            }
        }
    }
}
