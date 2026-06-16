import { Outlet, type RouteObject } from 'react-router'
import type { ComponentType } from 'react'

export type LazyImporter = () => Promise<{ default: ComponentType }>

export type RouteConfig = Omit<
  RouteObject,
  'element' | 'children' | 'Component' | 'lazy'
> & {
  permission?: string | string[]
  lazy?: LazyImporter
  Component?: ComponentType
  middlewares?: LazyImporter[]
  children?: RouteConfig[]
}

const toRouteLazy = (importer: LazyImporter) => async () => {
  const mod = await importer()
  return { Component: mod.default }
}

export const buildRoutes = (routes: RouteConfig[]): RouteObject[] => {
  return routes.map((item) => {
    const { lazy, Component, middlewares, children, permission, ...restProps } = item

    // 要返回的路由对象
    let routeObject: RouteObject = {
      ...restProps,
    }

    // 递归构建子路由
    if (children) {
      routeObject.children = buildRoutes(children)
    }

    // 路由级 lazy / Component
    if (lazy) {
      routeObject.lazy = toRouteLazy(lazy)
    } else if (Component) {
      routeObject.Component = Component
    }

    // 中间件处理
    if (middlewares && middlewares.length > 0) {
      // 从后往前遍历中间件，这样中间件的执行顺序就是从前往后
      // 例如：[A, B, C] => A(B(C()))
      for (let i = middlewares.length - 1; i >= 0; i--) {
        const middleware = middlewares[i]
        routeObject = {
          lazy: toRouteLazy(middleware),
          children: [routeObject],
        }
      }
    } else if (!routeObject.lazy && !routeObject.Component && !routeObject.element) {
      // 没有任何元素时，传入 <Outlet />
      routeObject.element = <Outlet />
    }

    // 返回路由对象
    return routeObject
  })
}
