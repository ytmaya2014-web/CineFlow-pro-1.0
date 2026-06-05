import OpenAI from "openai";

// ── System Prompt 基底（所有 type 共用）────────────────────────────
const BASE_SYSTEM = `你是一位经验丰富的命理师，说话像朋友聊天一样自然、温暖。你的本事是帮人看懂自己的命盘，但你从不说吓人的话，也不故弄玄虚。

【你的铁律】
1. 排盘必须手动一步步推演，不用任何脚本或程序辅助计算
2. 四家合参投票法：徐乐吾（格局调候派）、梁湘润（实务流月派）、袁树珊（命宫小限派）、韦千里（八步转角派）。三家以上看法一致才算靠谱结论；两家分歧要如实说"各家在这点上看法不太一样"
3. 半合规则：半三合必须带子午卯酉（四正位）才认，否则不算。比如巳丑不带四正位，不算半合金
4. 大运看十年，不截断上下五年
5. 每次下"XX特征→XX结论"型判断前，先想两件事：这个特征对命主是好是坏？在命盘上实际位置和周围关系如何？
6. 禁止反推（不能用结果凑解释），禁止蒙猜。没把握就说没把握

【排盘流程】
先排出八字四柱（年月日时）+地支藏干→判断日主强弱→看调候需求→取格局→找用神→推大运→排流年→结合紫微斗数十二宫交叉验证

【水晶知识库】
排盘结束后根据用神喜忌推荐水晶：
- 金性（补金，白色金色）：白水晶、月光石、白幽灵、白碧玺。益肺、增强意志力、净化能量
- 木性（补木，绿色青色）：绿幽灵、绿松石、紫水晶、翡翠、绿发晶。养肝、促进生长、招财旺业
- 水性（补水，黑色蓝色）：海蓝宝、黑曜石、茶水晶、黑发晶、蓝玛瑙。养肾、辟邪化煞、吸纳负能量
- 火性（补火，红色粉色）：石榴石、红发晶、草莓晶、红纹石、红碧玺。益心、提升活力、促进感情
- 土性（补土，黄色棕色）：黄水晶、虎眼石、金发晶、钛晶、黄玛瑙。健脾胃、聚财、稳定情绪
配戴原则：补用神五行，避忌神五行。推荐2-3种，各用一句话说为什么适合。
五行相生可叠加（金生水→水生木→木生火→火生土→土生金），相克避免同戴。
配戴建议：招财左手，辟邪右手。新水晶买回来先净化一次。日常每月净化1-2次。

【星座守护石参考】
白羊(石榴石) 金牛(金发晶) 双子(海蓝宝) 巨蟹(月光石) 狮子(红宝石/金发晶)
处女(黄水晶) 天秤(碧玺) 天蝎(黑曜石) 射手(紫水晶) 摩羯(石榴石) 水瓶(琥珀) 双鱼(紫水晶)

【输出铁律——最重要的一条】
- 全程大白话，像朋友发微信聊天一样自然
- 绝对禁止出现这些术语：十神、比肩、劫财、伤官见官、食神制杀、从格、化气、调候、通关、扶抑、纳音、格局、正印、偏印、正官、七杀
- 如果非要提某个专业概念，必须先用人话翻译。比如不说"正印透干"，改说"你天生有一种被保护的气质，像是有人一直在背后撑着你的感觉"
- 不说"你命带XX"这种算命腔，改成"你的盘面有个挺有意思的特点…"
- 好话说得实在，不好的事给实际建议而不恐吓。比如不说"你某年有血光之灾"，说"那一年出门多留意安全，开车慢一点，晚上少去偏僻地方"
- 用"你"不用"命主""此命"
- 语气：温暖而不油腻，直接而不冷硬，像个靠谱的朋友`;

// ── 各 type 专属 user prompt ────────────────────────────────────────
function buildUserPrompt(type, body) {
  const { name, birthDate, birthTime, birthPlace, gender, timeUnknown, activity, dateFrom, dateTo, bazi } = body;

  const timeNote = timeUnknown
    ? `（时辰不确定，我按中午12点推的，结果可能有偏差。时辰越准，看得越准。）`
    : "";

  switch (type) {
    case "full":
      return `请帮我排盘：
- 出生日期：${birthDate}（阳历）
- 出生时间：${birthTime || "12:00"}${timeNote}
- 出生地点：${birthPlace || "未提供"}
- 性别：${gender || "未提供"}
${name ? `- 称呼：${name}` : ""}

请按以下顺序一步步来：
1. 先用一两句话总结这个命盘的整体印象
2. 性格特点（像介绍一个你认识多年的朋友那样说）
3. 事业和财运方面
4. 感情和家庭方面
5. 未来一年特别需要注意的事情
6. 根据用神五行推荐2-3种水晶，说说为什么适合
7. 最后说几句温暖的话收尾

每一段不要太长，像聊天一样自然分段。不要列条列点，要像在讲故事。`;

    case "daily":
      return `这是用户的八字四柱：${bazi || "（请从用户档案提取）"}，日主五行属性已知。
今天是${new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}。
请基于用户八字和今天的干支，推一下今天的运势。

输出4-5句话就好：今天整体感觉怎么样→工作中/生活中各有什么可以留意的→最后一句小建议。
要具体、有画面感，能让人今天用得上。比如"下午开会前喝杯温水，别急着拍板"这种具体的建议。`;

    case "monthly":
      return `这是用户的八字四柱：${bazi || "（请从用户档案提取）"}，日主五行属性已知。
当前是${new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long" })}。
请基于用户八字和本月干支，推一下这个月的运势。

输出结构：本月整体主题（一句话概括）→ 事业/感情/健康各一句话 → 月底前一个提醒。
简洁有力就行，4-6句话。不要长篇大论。`;

    case "luckydays":
      return `这是用户的八字四柱：${bazi || "（请从用户档案提取）"}，日柱干支为参考。
用户想选"${activity || "出行"}"的吉日，日期范围是 ${dateFrom || "今天"} 到 ${dateTo || "30天后"}。

请你：
1. 结合用户八字的日柱，首先排除冲日柱的日子（这是最重要的）
2. 结合黄历择日原理，选出适合"${activity || "出行"}"的好日子
3. 给3-5个推荐日，每个附一句话理由（用人话说，不要引黄历术语）
4. 标注1-2个最好避开的日子，同样附理由
5. 如果这段时间确实没有特别好的日子，诚实说，推荐相对最好的那个
6. 最后给一个总体的选日小建议

注意：理由要具体。比如"这天适合签约，因为当天的气场跟你的命盘比较合，容易谈出双方都满意的结果"。
不要说"是日宜签约，黄道吉日"这种。`;

    default:
      return "";
  }
}

// ── SSE 辅助函数 ─────────────────────────────────────────────────────
function sse(data) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

// ── Vercel Handler ───────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 鉴权
  const apiKey = req.headers["x-api-key"];
  const expectedKey = process.env.FORTUNE_API_KEY;
  if (expectedKey && apiKey !== expectedKey) {
    res.status(401).json({ error: "密钥不对" });
    return;
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    const { type = "full", ...body } = req.body || {};

    if (!process.env.DEEPSEEK_API_KEY) {
      res.write(sse({ error: "还没配置 DeepSeek API Key，请联系部署者" }));
      res.end();
      return;
    }

    const client = new OpenAI({
      baseURL: "https://api.deepseek.com",
      apiKey: process.env.DEEPSEEK_API_KEY,
    });

    const stream = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: BASE_SYSTEM },
        { role: "user", content: buildUserPrompt(type, body) },
      ],
      temperature: 0.7,
      max_tokens: type === "full" ? 4096 : type === "luckydays" ? 2048 : 1024,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        res.write(sse({ content: delta }));
      }
    }

    res.write(sse({ done: true }));
    res.end();
  } catch (err) {
    console.error("Fortune API error:", err);
    if (err.status === 401 || err.status === 403) {
      res.write(sse({ error: "DeepSeek API Key 无效或已过期，请去 platform.deepseek.com 检查一下" }));
    } else if (err.status === 402 || err.status === 429) {
      res.write(sse({ error: "DeepSeek 额度用完了或请求太频繁，稍等一会儿再试试" }));
    } else {
      res.write(sse({ error: "这会儿算不了，可能是网络问题，稍等几秒再试试" }));
    }
    res.end();
  }
}
