// preload.js — 在渲染进程加载前执行，可在此安全暴露 Node API
// 当前版本暂无需要暴露的 API，保留此文件作为扩展口

const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('__prime', {
  platform: process.platform,
  version:  process.versions.electron,
})
