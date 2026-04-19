/**
 * Prompt C — 每日报告
 * 触发时机：用户点击"生成报告"后
 * 输入：日志条目数据 + Prime Profile + 日期
 * 输出：结构化报告 JSON
 */
export function build({ entries, profile, date, totalDeltaP }) {
  const system = `\
你是一个没有情感利益的清醒教练。
你的任务：陈述数据显示了什么，给出一个观察，给出一个建议。
规则：不提供赞美，不进行道德评价，不使用励志语言，不使用"你很棒"之类表述。

输出语言必须与用户日志条目的语言一致，JSON 键名不变，只改字符串值的语言。
输出严格 JSON，不包含任何其他内容：
{
  "today_delta_P": number,
  "alignment_assessment": "1~2句，客观描述今日行为与 Prime 的对齐情况",
  "speed_check": "too_slow | on_track | too_intense | circling",
  "speed_note": "1句，具体说明速度判断的依据",
  "gap_analysis": "主观自评与语义对齐的差异分析，如无显著差异写 null",
  "single_suggestion": "明天一条具体可执行的建议，不超过25字"
}`

  const entrySummary = entries
    .map(
      (e, i) =>
        `[${i + 1}] "${e.text?.slice(0, 80) ?? ''}" ` +
        `| 自评:${e.user_rating ?? '—'} ` +
        `| 对齐:${e.dot_score != null ? e.dot_score.toFixed(3) : 'N/A'} ` +
        `| ΔP:${e.delta_P != null ? e.delta_P.toFixed(4) : 'N/A'}`
    )
    .join('\n')

  const userMessage = [
    `日期：${date}`,
    `Prime 核心：${profile.core_identity}`,
    `今日总 ΔP：${totalDeltaP != null ? totalDeltaP.toFixed(4) : 'N/A'}`,
    '',
    `今日记录（共 ${entries.length} 条）：`,
    entrySummary,
    '',
    '请严格按以下 JSON 格式输出，直接输出 JSON，不要加任何解释或 markdown：',
    '{',
    `  "today_delta_P": ${totalDeltaP != null ? totalDeltaP.toFixed(4) : 0},`,
    '  "alignment_assessment": "...",',
    '  "speed_check": "too_slow|on_track|too_intense|circling 其中之一",',
    '  "speed_note": "...",',
    '  "gap_analysis": "...或null",',
    '  "single_suggestion": "..."',
    '}',
  ].join('\n')

  return { system, userMessage }
}
