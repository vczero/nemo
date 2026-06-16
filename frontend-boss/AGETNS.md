# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nemo Copilot BOSS - 管理后台前端项目，基于 React 18 + Vite + Ant Design 构建的管理系统。

## Development Commands

```bash
pnpm dev      # 启动开发服务器 (端口 8771)
pnpm build    # 构建生产版本
pnpm preview  # 预览生产构建
```

## Architecture

### API 代理配置
- 前端开发服务器：`http://localhost:8771`
- 后端 API 代理：`/boss/api` -> `http://localhost:8770`

### API 响应格式
后端返回格式为 `{ success, value, message }`，request.js 会自动转换：
- **分页结果**：`value` 包含 `{ list, total, pageNum, pageSize }`
- **普通结果**：`value` 直接是数据

### 目录结构
- `src/pages/` - 页面组件，按功能模块组织
  - `user/UserManagement.jsx` - 用户管理
  - `order/OrderManagement.jsx` - 订单管理
  - `subscription/` - 套餐和产品管理
  - `paymentConfig/` - 支付配置
- `src/services/` - API 服务模块，每个模块对应一组后端接口
- `src/components/` - 可复用 UI 组件
- `src/theme/nautilusTheme.js` - Ant Design 主题配置（深色海洋风格）
- `src/utils/request.js` - Axios 封装，处理认证和响应转换

### 认证机制
- JWT Token 存储在 `localStorage.getItem('token')`
- 用户信息存储在 `localStorage.getItem('user')`
- 请求拦截器自动添加 `Authorization: Bearer ${token}` 头

### 主题系统
使用 Ant Design 的 darkAlgorithm，主色调为青蓝色 (#00d4ff)，整体为深色海洋风格。

### 路由配置
路由定义在 `src/App.jsx`：
- `/login` - 登录页
- `/users` - 用户管理
- `/orders` - 订单管理
- `/subscription-plans` - 套餐管理
- `/products` - 产品管理
- `/invitation-codes` - 邀请码管理
- `/notifications` - 系统通知
- `/agreements` - 协议管理
- `/payment-config` - 支付配置

## Code Conventions

### 新增页面
1. 在 `src/pages/` 下创建页面组件
2. 在 `src/services/` 下创建对应 API 服务模块
3. 在 `src/App.jsx` 的 MainLayout 中添加路由和菜单项

### API 服务模块
```javascript
// src/services/example.js
import request from '../utils/request'

export const getList = params => {
  return request({
    url: '/boss/api/example/list',
    method: 'get',
    params,
  })
}
```

### 表格分页
使用 Ant Design Table 组件，分页参数为 `pageNum` 和 `pageSize`。

### 状态标签
订单状态使用 `StatusMap` 和 `StatusColorMap` 映射显示文本和颜色。