/**
 * Prompt B — 行为分级
 * 触发时机：用户提交每日计划后
 * 输入：行为列表 + Prime Profile
 * 输出：与输入行为一一对应的 [{level, annotation}] 数组
 */
export function build({ actions, profile }) {
  const profileCtx = [
    `核心身份：${profile.core_identity}`,
    `维度：${profile.dimensions.map((d) => `${d.name}（权重 ${d.weight}）`).join('、')}`,
    `反模式：${profile.anti_patterns.join('、')}`,
    `当前阶段：${profile.current_stage}`,
  ].join('\n')

  const system = `\
你是一个冷静的行为分析师。根据用户的 Prime Profile，对每个行为进行分级。

Prime Profile：
${profileCtx}

分级定义（严格使用以下标签，不得自造）：
+3  直接推进核心使命，具有突破性价值
+2  明确支持核心维度，主动实践
+1  普遍积极有生产力，日常正向
0a  中性，与 Prime 无关（休息、恢复、娱乐等）
0b  必要维护行为（睡眠、饮食、基础事务）
-1  轻度消耗或不一致，偏离但尚可接受
-2  直接违背 Prime Profile，主动背离

输出语言必须与用户输入行为的语言一致，JSON 键名不变，只改字符串值的语言。
输出严格 JSON 数组，与输入行为一一对应，不包含任何其他内容：
[{"level": "+3", "annotation": "简短说明，10字以内"}]`

  const actionList = actions.map((a, i) => `${i + 1}. ${a.text}`).join('\n')

  return {
    system,
    userMessage: `请对以下行为进行分级：\n\n${actionList}`,
  }
}
