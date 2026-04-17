# PRIME — 存在主义日志

一款本地优先的个人方向追踪工具，基于存在主义积分哲学，帮助你量化行为与自我方向的对齐程度。

```
P = ∫₀ᵀ s⃗(τ) · û_prime(τ) dτ
```

> 时间焦虑不是时间在流逝造成的——真正的来源是：你正在做的事与「最是你自己的方向」之间，夹角太大。

---

## 目录

- [核心思想](#核心思想)
- [技术栈](#技术栈)
- [系统架构](#系统架构)
- [数据流详解](#数据流详解)
- [评分公式](#评分公式)
- [LLM 供应商系统](#llm-供应商系统)
- [Prompt 模块](#prompt-模块)
- [数据存储](#数据存储)
- [本地开发](#本地开发)
- [Electron 桌面版](#electron-桌面版)
- [打包发行版](#打包发行版)
- [扩展供应商](#扩展供应商)
- [项目结构](#项目结构)

---

## 核心思想

PRIME 借用一个物理学隐喻：你的每一个行为是空间中的向量 **s⃗**，你「最是自己的方向」是单位向量 **û_prime**。两者的点积（投影）就是那段时间对你生命价值的贡献。

- **点积 ·** — 行为与方向完全对齐时 P 高效增长；逆 Prime 时 P 主动减少，不是停滞，是真实扣分。
- **积分 ∫** — 意义在每一个真实的 dτ 中持续积累，没有一天的努力会消失。
- **有限性 T** — 正因为 T 是有限常数，每个选择才有真实成本。
- **轴会移动** — û_prime(τ) 是时间的函数。二十岁的 Prime ≠ 四十岁的 Prime，这是成长，不是失败。

---

## 技术栈

| 层次 | 技术 |
|------|------|
| 前端框架 | React 18 + Vite 5 |
| 桌面壳 | Electron 31 |
| 图表 | Recharts 2 |
| 数据持久化 | localStorage（纯本地，无服务器） |
| 打包 | electron-builder 25（Win/Mac/Linux） |
| LLM | 可插拔适配器（GLM / Anthropic / Ollama / OpenAI） |
| Embedding | 各供应商原生（GLM embedding-3 / Voyage-3 / nomic-embed-text） |

---

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        PRIME App                            │
│                                                             │
│  ┌──────────┐   navigate()   ┌──────────────────────────┐  │
│  │  App.jsx │ ─────────────► │        Pages             │  │
│  │ (路由器)  │ ◄───────────── │  Setup / Questionnaire   │  │
│  └──────────┘   state        │  ProfileConfirm          │  │
│       │                      │  Dashboard               │  │
│       │ showGuide            │  DailyPlan               │  │
│       ▼                      │  DailyJournal            │  │
│  ┌──────────────┐            │  DailyReport             │  │
│  │OnboardingGuide│           │  Me                      │  │
│  └──────────────┘            └──────────┬───────────────┘  │
│                                         │                   │
│              ┌──────────────────────────┼────────────────┐  │
│              │         核心库            │                │  │
│              │                          ▼                │  │
│              │  ┌────────────┐   ┌─────────────┐        │  │
│              │  │ storage.js │   │   llm.js    │        │  │
│              │  │(localStorage)  │  (门面层)   │        │  │
│              │  └────────────┘   └──────┬──────┘        │  │
│              │                          │                │  │
│              │                   ┌──────▼──────┐        │  │
│              │                   │  registry.js│        │  │
│              │                   │  供应商注册表│        │  │
│              │                   └──────┬──────┘        │  │
│              │                          │                │  │
│              │          ┌───────────────┼────────────┐  │  │
│              │          ▼               ▼            ▼  │  │
│              │       glm.js      anthropic.js   ollama.js│  │
│              │                                          │  │
│              │  ┌────────────┐   ┌─────────────┐       │  │
│              │  │ scoring.js │   │  prompts/   │       │  │
│              │  │(纯数学计算) │   │ A/B/C/D.js │       │  │
│              │  └────────────┘   └─────────────┘       │  │
│              └─────────────────────────────────────────-┘  │
└─────────────────────────────────────────────────────────────┘
```

### 页面状态机

App.jsx 通过一个字符串 `page` 驱动整个应用，没有路由库：

```
首次启动
    │
    ▼
[setup] ──完成配置──► [questionnaire] ──问卷完成──► [profileConfirm]
                                                          │
                                                     锁定 Profile
                                                          │
                                                          ▼
                                                    [dashboard] ◄────────────────┐
                                                     │    │    │                 │
                                              ┌──────┘    │    └───────┐         │
                                              ▼           ▼           ▼         │
                                        [dailyPlan] [dailyJournal] [dailyReport]─┘
                                                          │
                                                    [me] [setup(设置)]
```

**恢复逻辑**（`resolveInitialPage()`）：每次刷新时依次检测：
1. `settings.provider` 为空 → `setup`
2. `questionnaire.completed` 为 false → `questionnaire`
3. `profile.embedding` 不存在 → `profileConfirm`
4. 否则 → `dashboard`

---

## 数据流详解

### 一、新用户初始化流程

```
用户填写供应商 & API Key
        │
        ▼
   [Setup 页面]
   setSettings() 写入 localStorage
        │
        ▼
   [Questionnaire 页面]
   多轮对话（LLM 扮演向导提问）
   对话历史存入 questionnaire.messages
        │
        ▼
   buildPromptA(conversationHistory)
        │
   chat() → LLM 返回 PrimeProfile JSON
        │
        ▼
   [ProfileConfirm 页面]
   用户审阅 / 手动调整 Profile
        │
   embed(profile.core_identity)
        │  生成 core_identity 的 embedding 向量
        ▼
   setProfile({ ...profile, embedding: vec, embedding_provider, version: 1 })
        │
        ▼
   进入 [Dashboard]
```

### 二、每日工作流数据流

```
[DailyPlan 页面]
用户输入行为列表 actions[]
        │
        ▼
buildPromptB({ actions, profile })
        │
chat() → LLM 返回 [{level, annotation}]
        │  level: "+3"/"+2"/"+1"/"0a"/"0b"/"-1"/"-2"
        ▼
setPlan(date, { actions: [...] })    ← 存入 localStorage
        │
        ▼
[DailyJournal 页面]
用户逐条填写日志文字 + 自评分数 (-3 ~ +3)
        │
        ▼
  对于每条有文字的记录：
        │
        ├─ embed(entry.text) → 获取行为 embedding 向量
        │
        └─ computeDeltaP(
              entryEmbedding,     // 行为向量
              profile.embedding,  // Prime 方向向量
              userRating,         // 主观自评
              alpha,              // 混合权重（默认 0.7）
              durationHours,      // 时长
              dimensionWeight     // 维度权重
           )
           → { deltaP, dotScore }
        │
        ▼
setJournal(date, { entries, total_delta_P })
        │
upsertHistoryEntry({ date, delta_P, avg_dot, avg_user_rating })
        │
        ▼
[DailyReport 页面]
buildPromptC({ entries, profile, date, totalDeltaP })
        │
chat() → 报告 JSON
        │  { alignment_assessment, speed_check, gap_analysis, single_suggestion }
        ▼
setJournal(date, { ...existing, report })   ← 追加报告到当日 journal
```

### 三、Prime Profile 更新流程

```
[Me 页面]
用户撰写近期感悟/变化文字
        │
        ▼
buildPromptD({ currentProfile, userNotes })
        │
chat() → 新 PrimeProfile JSON（diff 预览）
        │
用户审阅差异（core_identity 变化 + 维度权重变化）
        │
        ▼
用户确认 → embed(newProfile.core_identity)
        │
setProfile({
  ...newProfile,
  embedding: newVec,
  embedding_provider: settings.provider,
  version: profile.version + 1,
  updated_at: ISO 时间戳
})
```

### 四、评分数据流向总览

```
用户行为文字
    │ embed()
    ▼
行为 embedding 向量 s⃗  ─── cosineSimilarity() ───► dotScore ∈ [-1, 1]
                                                          │
Prime Profile embedding û_prime                          │ α = 0.7
                                                          │
用户自评 r ∈ [-3, +3] ────────── r/3 ─────────────────────┤
                                                          │ (1-α) = 0.3
                                                          ▼
                              deltaP = (α·dot + (1-α)·r/3) × T × w
                                                          │
                                            upsertHistoryEntry()
                                                          │
                                                computeCumulativeP()
                                                          │
                                              累计 P = Σ deltaP
```

---

## 评分公式

### 基础公式

```
ΔP = [α · dot(s⃗, û_prime) + (1-α) · r/3] · T · w
```

| 参数 | 含义 | 范围 |
|------|------|------|
| `dot(s⃗, û_prime)` | 行为文本与 Prime 核心身份的余弦相似度 | -1 ~ 1 |
| `r` | 用户主观自评 | -3 ~ +3 |
| `α` | 客观/主观混合权重（用户可配置）| 0.1 ~ 0.9，默认 0.7 |
| `T` | 活动时长（小时） | > 0 |
| `w` | 该维度在 Profile 中的权重 | 0 ~ 1 |

### 行为级别（Prompt B 输出，用于计划页面显示）

| 级别 | 含义 |
|------|------|
| `+3` | 直接推进核心使命，具有突破性价值 |
| `+2` | 明确支持核心维度，主动实践 |
| `+1` | 普遍积极有生产力，日常正向 |
| `0a` | 中性，与 Prime 无关（休息、娱乐等） |
| `0b` | 必要维护行为（睡眠、饮食等） |
| `-1` | 轻度消耗或不一致 |
| `-2` | 直接违背 Prime Profile |

### 漂移检测

`driftCheck()` 检查近 14 天数据：若其中 ≥ 70% 的天 ΔP ≤ 0，触发漂移警告。

### 落差分析

`gapAnalysis()` 对比主观自评与客观语义对齐：
- 差异 < 0.3：一致
- 主观 > 客观 + 0.3：可能存在自我美化
- 主观 < 客观 - 0.3：行为对齐但情绪抗拒

---

## LLM 供应商系统

### 注册表架构

```
src/lib/providers/
├── registry.js      ← 中央注册表，导出 getProvider() / getEnabledProviders()
├── glm.js           ← 智谱 GLM 适配器（chat + embed）
├── anthropic.js     ← Anthropic Claude 适配器（Electron 直连 / 浏览器 proxy）
├── ollama.js        ← Ollama 本地适配器（含向量归一化）
└── openai.js        ← OpenAI 适配器（默认 disabled）
```

每个适配器实现统一接口：

```js
// 必须导出这两个函数
export async function chat(messages, systemPrompt, settings) → Promise<string>
export async function embed(text, settings) → Promise<number[]>
```

### 当前可用供应商

| ID | 名称 | Chat 模型 | Embed 模型 | 向量维度 | 特点 |
|----|------|-----------|-----------|---------|------|
| `glm` | 智谱 GLM | glm-4-flash | embedding-3 | 2048 | 中文优先，国内网络 |
| `anthropic` | Anthropic Claude | claude-3-5-haiku | voyage-3 | 1024 | 推理质量最高，需 Voyage Key |
| `ollama` | Ollama 本地 | qwen2.5:7b | nomic-embed-text | 768 | 完全离线，零成本 |
| `openai` | OpenAI | gpt-4o-mini | text-embedding-3-small | 1536 | 默认禁用 |

### CORS 处理策略

- **Electron 桌面版**：`webSecurity: false`，所有 API 直连，无 CORS 问题
- **浏览器 dev 模式 + Anthropic**：需在 `vite.config.js` 恢复 proxy 配置
- **GLM / Ollama / OpenAI**：支持跨域，浏览器直接可用

---

## Prompt 模块

所有 Prompt 以独立模块形式存储，解耦于业务逻辑，方便单独修改：

```
src/lib/prompts/
├── index.js     ← 统一导出入口
├── promptA.js   ← Profile 生成（问卷 → PrimeProfile JSON）
├── promptB.js   ← 行为分级（行为列表 → level + annotation）
├── promptC.js   ← 每日报告（日志数据 → 结构化报告 JSON）
└── promptD.js   ← Profile 更新（笔记 + 当前 Profile → 新 Profile JSON）
```

每个 Prompt 模块导出一个 `build(params)` 函数，返回 `{ system, userMessage }`：

| 模块 | 触发时机 | 输入 | LLM 输出 |
|------|---------|------|---------|
| Prompt A | 问卷完成后 | 对话历史 | `PrimeProfile` JSON |
| Prompt B | 提交每日计划时 | 行为列表 + Profile | `[{level, annotation}]` 数组 |
| Prompt C | 点击生成报告时 | 日志条目 + Profile + ΔP 数据 | 结构化报告 JSON |
| Prompt D | Me 页面提交笔记时 | 当前 Profile + 自由文本 | 更新后的 Profile JSON |

---

## 数据存储

所有数据存储在浏览器/Electron 的 `localStorage`，key 前缀统一为 `prime:`，无任何服务器通信。

### localStorage Key 结构

| Key | 类型 | 内容 |
|-----|------|------|
| `prime:settings` | Object | 供应商配置、API Keys、α 权重、主题 |
| `prime:profile` | Object | Prime Profile（含 embedding 向量） |
| `prime:questionnaire` | Object | 问卷对话历史 + 完成标志 |
| `prime:history` | Array | 每日 ΔP 汇总记录（不含全文） |
| `prime:plans:{YYYY-MM-DD}` | Object | 某日行为计划 |
| `prime:journals:{YYYY-MM-DD}` | Object | 某日日志条目 + 报告 |
| `prime:me:notes` | Array | Me 页面提交的更新笔记 |
| `prime:onboarding:seen` | String | `"true"` 表示已看过指南 |

### 核心数据结构

**PrimeProfile**
```json
{
  "core_identity": "不超过30字的核心方向描述",
  "dimensions": [
    { "name": "维度名称", "weight": 0.40 }
  ],
  "anti_patterns": ["负面模式1"],
  "current_stage": "当前人生阶段",
  "embedding": [0.123, -0.456, ...],
  "embedding_provider": "glm",
  "version": 3,
  "updated_at": "2026-04-16T08:00:00.000Z"
}
```

**每日计划（DailyPlan）**
```json
{
  "actions": [
    {
      "text": "行为描述",
      "level": "+2",
      "annotation": "AI 标注",
      "duration": 2
    }
  ]
}
```

**每日日志（DailyJournal）**
```json
{
  "entries": [
    {
      "text": "日志文字",
      "user_rating": 2,
      "dot_score": 0.734,
      "delta_P": 0.5838,
      "embedding": [...]
    }
  ],
  "total_delta_P": 1.2345,
  "report": {
    "alignment_assessment": "...",
    "speed_check": "on_track",
    "speed_note": "...",
    "gap_analysis": null,
    "single_suggestion": "明天做一件具体的事"
  }
}
```

**历史记录条目（History Entry）**
```json
{
  "date": "2026-04-16",
  "delta_P": 1.2345,
  "avg_dot": 0.721,
  "avg_user_rating": 1.5
}
```

> 累计 P 值**不存储**，每次由 `computeCumulativeP(history)` 实时从历史数组推导，确保数据一致性。

---

## 本地开发

### 前置要求

- Node.js >= 18
- npm >= 9

### 安装与启动

```bash
cd prime-app
npm install
npm run dev
```

浏览器打开 `http://localhost:5173`，首次进入 Setup 页面配置 AI 供应商。

> 所有 API Key 仅存储在本地 localStorage，不经过任何中间服务器。

### 环境变量（可选）

在项目根目录创建 `.env.local` 可预填默认值（方便开发调试）：

```env
VITE_PROVIDER=glm
VITE_GLM_API_KEY=your_key_here
VITE_VOYAGE_API_KEY=your_voyage_key
VITE_OLLAMA_BASE_URL=http://localhost:11434
VITE_ALPHA=0.7
```

若通过 Setup 页面配置，无需创建此文件。

---

## Electron 桌面版

### 开发模式（热重载）

```bash
npm run electron:dev
```

启动流程：
1. `vite` 在 5173 端口启动开发服务器
2. `wait-on` 等待服务器就绪
3. `electron .` 加载 `http://localhost:5173`

### Electron 配置要点

**`electron/main.js`**
```js
webPreferences: {
  webSecurity: false,      // 允许直连 Anthropic/Voyage，无 CORS 限制
  contextIsolation: true,
  nodeIntegration: false,  // 安全隔离
}
```

**`vite.config.js`**
```js
base: process.env.ELECTRON === 'true' ? './' : '/'
// 生产构建用相对路径，支持 file:// 协议加载
```

**Anthropic 供应商环境检测（`providers/anthropic.js`）**
```js
const isElectron = navigator.userAgent.toLowerCase().includes('electron')
// Electron: 直连 https://api.anthropic.com
// 浏览器 dev: 通过 /anthropic proxy
```

---

## 打包发行版

```bash
npm run electron:build
```

执行流程：
1. `cross-env ELECTRON=true vite build` → 输出到 `dist/`（相对路径）
2. `electron-builder` → 读取 `package.json` 的 `build` 配置，打包到 `release/`

### 输出产物

| 平台 | 格式 | 架构 |
|------|------|------|
| Windows | NSIS 安装包 (.exe) | x64 |
| macOS | DMG 镜像 (.dmg) | x64 + arm64 |
| Linux | AppImage (.AppImage) | x64 |

### 应用图标

在 `public/` 目录放置：
- `icon.ico` — Windows
- `icon.icns` — macOS
- `icon.png` — Linux（512×512 推荐）

---

## 扩展供应商

添加新的 LLM 供应商只需三步：

**步骤 1** — 新建 `src/lib/providers/myprovider.js`

```js
export async function chat(messages, systemPrompt, settings) {
  // settings.apiKey, settings.myProviderModel 等
  const res = await fetch('https://api.myprovider.com/v1/chat', {
    method: 'POST',
    headers: { Authorization: `Bearer ${settings.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'my-model', messages: [{ role: 'system', content: systemPrompt }, ...messages] }),
  })
  const data = await res.json()
  return data.choices[0].message.content
}

export async function embed(text, settings) {
  // 返回 number[] 向量
  const res = await fetch('https://api.myprovider.com/v1/embeddings', { ... })
  const data = await res.json()
  return data.data[0].embedding
}
```

**步骤 2** — 在 `registry.js` 注册

```js
import * as myprovider from './myprovider.js'

export const PROVIDERS = {
  // ...已有供应商...
  myprovider: {
    id:          'myprovider',
    label:       'My Provider',
    description: '简短描述',
    embedDim:    1536,
    needsApiKey: true,
    // disabled: true,   ← 删除此行即启用
    adapter:     myprovider,
  },
}
```

**步骤 3** — 启动应用，Setup 页面自动出现新供应商选项。

---

## 项目结构

```
prime-app/
├── electron/
│   ├── main.js          # Electron 主进程（窗口创建、安全配置）
│   └── preload.js       # 预加载脚本（扩展预留）
│
├── src/
│   ├── main.jsx         # React 挂载入口
│   ├── App.jsx          # 页面状态机、主题初始化、指南控制
│   ├── index.css        # Obsidian 风格全局样式（CSS 变量主题）
│   │
│   ├── pages/
│   │   ├── Setup.jsx         # 供应商配置（两栏全屏）
│   │   ├── Questionnaire.jsx # 多轮问卷对话
│   │   ├── ProfileConfirm.jsx# Profile 审阅与锁定
│   │   ├── Dashboard.jsx     # 仪表盘（两栏 Grid）
│   │   ├── DailyPlan.jsx     # 今日计划（含 AI 分级）
│   │   ├── DailyJournal.jsx  # 今日日志（含评分与 ΔP 计算）
│   │   ├── DailyReport.jsx   # 今日报告（AI 生成）
│   │   └── Me.jsx            # 我的（Profile 查看 / 历史 / 更新）
│   │
│   ├── components/
│   │   ├── Layout.jsx         # 260px 侧边栏 + 全宽内容区
│   │   ├── OnboardingGuide.jsx# 六页指南弹窗（首次自动弹出）
│   │   ├── PValueChart.jsx    # P 值趋势折线图
│   │   ├── SelfRatingButtons.jsx # -3 ~ +3 评分按钮组
│   │   └── ThemeToggle.jsx    # 深色/浅色切换
│   │
│   └── lib/
│       ├── storage.js         # localStorage 统一读写层
│       ├── llm.js             # LLM 门面（chat / embed / parseLLMJson）
│       ├── scoring.js         # 纯数学：ΔP / 余弦相似度 / 漂移检测
│       │
│       ├── providers/
│       │   ├── registry.js    # 供应商注册表
│       │   ├── glm.js         # 智谱 GLM 适配器
│       │   ├── anthropic.js   # Anthropic 适配器（Electron 直连）
│       │   ├── ollama.js      # Ollama 本地适配器
│       │   └── openai.js      # OpenAI 适配器（默认禁用）
│       │
│       └── prompts/
│           ├── index.js       # 统一导出
│           ├── promptA.js     # Profile 生成
│           ├── promptB.js     # 行为分级
│           ├── promptC.js     # 每日报告
│           └── promptD.js     # Profile 更新
│
├── public/              # 静态资源（图标等）
├── vite.config.js       # Vite 配置（base 路径 + Electron 适配）
└── package.json         # 依赖、脚本、electron-builder 配置
```

---

## 设计原则

- **本地优先** — 所有数据存储在你的设备，没有账号，没有服务器，没有数据上传
- **方向优先于速度** — 从不要求你做更多，只要求你对准更诚实
- **清醒优先于安慰** — 报告冷静、具体、基于数据，不提供虚假鼓励
- **轴会移动** — Prime Profile 不是固定的，系统追踪其随时间的漂移与演化
