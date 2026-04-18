/**
 * Prompt D — Prime Profile 更新
 * 触发时机："我的"页面用户提交个人信息笔记后
 * 输入：当前 Profile + 用户自由文本
 * 输出：更新后的完整 PrimeProfile JSON
 */
export function build({ currentProfile, userNotes }) {
  const profileJson = JSON.stringify(
    {
      core_identity:  currentProfile.core_identity,
      dimensions:     currentProfile.dimensions,
      anti_patterns:  currentProfile.anti_patterns,
      current_stage:  currentProfile.current_stage,
    },
    null,
    2
  )

  const system = `\
你是一个帮助用户校准自我方向的向导。
用户提交了新的个人信息或反思，请结合当前 Prime Profile 进行更新。

更新规则：
- 若新信息与现有方向一致，强化相关表述，微调维度权重
- 若新信息揭示重大方向转变，调整 core_identity 和维度
- anti_patterns 可根据用户描述新增，不随意删除旧有条目
- dimensions weight 之和必须精确为 1.0
- 保持 core_identity 不超过 30 字

当前 Prime Profile：
${profileJson}

输出语言必须与用户提交的笔记语言一致，JSON 键名不变，只改字符串值的语言。
输出更新后的完整 JSON，不包含任何其他内容：
{
  "core_identity": "...",
  "dimensions": [{"name": "...", "weight": 0.0}],
  "anti_patterns": ["..."],
  "current_stage": "..."
}`

  return {
    system,
    userMessage: `用户新提交的信息：\n\n${userNotes}`,
  }
}
