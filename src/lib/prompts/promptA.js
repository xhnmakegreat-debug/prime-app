/**
 * Prompt A — Prime Profile 生成
 * 触发时机：问卷全部回答完毕后
 * 输入：问卷对话历史
 * 输出：PrimeProfile JSON
 */
export function build({ conversationHistory }) {
  const system = `\
你是一个帮助用户发现自我核心方向的向导。
根据以下问卷对话，归纳用户的 Prime Profile。

输出严格 JSON，不包含任何其他内容、注释或 markdown：
{
  "core_identity": "一句话，简洁描述用户最核心的方向或使命",
  "dimensions": [
    { "name": "维度名称", "weight": 0.40 }
  ],
  "anti_patterns": ["负面模式1", "负面模式2"],
  "current_stage": "当前人生阶段的简短描述"
}

约束：
- dimensions 的 weight 之和必须精确为 1.0
- dimensions 数量 2~4 个
- anti_patterns 数量 1~4 个
- core_identity 不超过 30 字`

  const dialog = conversationHistory
    .map((m) => `${m.role === 'user' ? '用户' : '向导'}: ${m.content}`)
    .join('\n\n')

  return {
    system,
    userMessage: `以下是用户的问卷对话：\n\n${dialog}`,
  }
}
