import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Electron 生产构建需要相对路径（file:// 协议）
  base: process.env.ELECTRON === 'true' ? './' : '/',
  // 注意：删除了 server.proxy，Electron 通过 webSecurity:false 直连所有 API
  // 浏览器 dev 模式若需 Anthropic，可在此处恢复 proxy 配置
})
