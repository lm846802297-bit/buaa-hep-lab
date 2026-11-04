import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { rm } from 'node:fs/promises'

const isGitHubPages = process.env.GITHUB_PAGES === 'true' || process.env.VITE_GITHUB_PAGES === 'true'
const repoName = process.env.GITHUB_REPOSITORY ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/` : '/lab-orbit/'

// Cloudflare Pages only performs its native SPA fallback when no top-level
// 404.html is present. Keep the legacy redirect page in GitHub Pages demo
// builds, but omit it from the production Pages artifact.
function cloudflarePagesSpaFallback() {
  let outputDirectory
  return {
    name: 'cloudflare-pages-spa-fallback',
    apply: 'build',
    configResolved(config) {
      outputDirectory = path.resolve(config.root, config.build.outDir)
    },
    async writeBundle() {
      if (isGitHubPages) return
      await rm(path.join(outputDirectory, '404.html'), { force: true })
    }
  }
}

export default defineConfig({
  base: isGitHubPages ? repoName : '/',
  plugins: [vue({ template: { transformAssetUrls: { includeAbsolute: false } } }), cloudflarePagesSpaFallback()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api/arxiv/proxy-markdown': {
        target: 'https://www.alphaxiv.org',
        changeOrigin: true,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        rewrite: (p) => p.replace(/^\/api\/arxiv\/proxy-markdown\/?/, '/abs/').replace(/\.md$/, '') + '.md',
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['access-control-allow-origin'] = '*'
          })
        }
      },
      '/api/arxiv/proxy-pdf': {
        target: 'https://arxiv.org',
        changeOrigin: true,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        rewrite: (p) => p.replace(/^\/api\/arxiv\/proxy-pdf\/?/, '/pdf/').replace(/\.pdf$/, ''),
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['access-control-allow-origin'] = '*'
          })
        }
      },
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 4173,
    host: '0.0.0.0',
    allowedHosts: true
  },
  build: {
    manifest: true,
    target: ['es2020', 'safari14']
  }
})
