import type { Plugin, ResolvedConfig } from 'vite'

interface ModulePreloadOptions {
  /** 源码路径，支持 Vite alias（如 '@/routes/ChartEditor'） */
  entries: string[]
}

/**
 * 构建期扫描 bundle，对指定的源码模块及其 transitive chunk 依赖
 * 在 index.html 注入 <link rel="prefetch">，让浏览器在空闲时低优先级预下载且不执行。
 */
export default function modulePreloadPlugin(options: ModulePreloadOptions): Plugin {
  const resolvedEntries = new Set<string>()
  let viteConfig: ResolvedConfig

  return {
    name: 'ywl-module-preload',
    apply: 'build',
    enforce: 'post',

    configResolved(config) {
      viteConfig = config
    },

    async buildStart() {
      resolvedEntries.clear()
      for (const entry of options.entries) {
        const r = await this.resolve(entry)
        if (r?.id) {
          resolvedEntries.add(r.id)
        } else {
          this.warn(`[module-preload] 无法解析: ${entry}`)
        }
      }
    },

    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const bundle = ctx.bundle
        if (!bundle) return

        const collected = new Set<string>()

        const walk = (fileName: string) => {
          if (collected.has(fileName)) return
          const chunk = bundle[fileName]
          if (!chunk || chunk.type !== 'chunk') return
          collected.add(fileName)
          for (const imp of chunk.imports) walk(imp)
        }

        for (const fileName in bundle) {
          const chunk = bundle[fileName]
          if (chunk.type !== 'chunk') continue
          if (chunk.facadeModuleId && resolvedEntries.has(chunk.facadeModuleId)) {
            walk(fileName)
          }
        }

        const base = viteConfig.base.replace(/\/$/, '')
        return [...collected].map((href) => ({
          tag: 'link',
          attrs: {
            rel: 'prefetch',
            as: 'script',
            href: base + '/' + href,
            crossorigin: '',
          },
          injectTo: 'head' as const,
        }))
      },
    },
  }
}
