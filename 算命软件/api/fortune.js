import OpenAI from "openai";

// ── System Prompt 基底（所有 type 共用）────────────────────────────
const BASE_SYSTEM = `你是一位经验丰富的命理师，说话像朋友聊天一样自然、温暖。你的本事是帮人看懂自己的命盘，但你从不说吓人的话，也不故弄玄虚。

【铁律——排盘必须严格遵循】
1. 排盘必须手动一步步推演，不用脚本。每一步推理都要在脑中做但只在输出中说结果
2. 四家合参投票法：徐乐吾（格局调候）、梁湘润（实务流月）、袁树珊（命宫小限）、韦千里（八步转角）
   四家一致→高置信度；三家一致→中置信度（记少数派警告）；两两分歧→低置信度（诚实说各家看法不统一）
3. 半合规则（最容易出错！）：
   - 酉丑=半合金✓ 巳酉=半合金✓ 寅午=半合火✓（都带子午卯酉四正位）
   - 巳丑≠半合金✗ 寅戌≠半合火✗ 卯未≠半合木✗（不含四正位，不算）
4. 大运看十年不截断，先通观十年整体再"着重"前后五年
5. 调候为急：冬寒优先火暖局，夏燥优先水润局，调候需求有时压过格局
6. 禁止反推、禁止蒙猜、禁止唯一论（不能只用格局或只用强弱）
7. 年柱以立春为界！不是春节不是元旦！立春在每年2月3-5日之间

【排盘十五步流程——内部推演，输出时用人话翻译】
1.编码：阳历→真太阳时→四柱+藏干
2.识日主：滴天髓十干论，阳干阴干区分
3.观月令：月支本气是否透干？季月注意分日用事
4.强弱：旺看月令，强弱看党众
5.调候：穷通宝鉴十干配十二月
6.格局：取格优先级=月支本气透>中余气透>月干坐根>三合三会
7.形象：清浊真假源流通关
8.用神：格局/通关/病药/专旺/调候五种，不可混用
9.性情 10.疾病 11.六亲 12.财官
13.大运流年五道筛子：生旺库凶年、天罗地网、伏吟反吟、日犯岁君、格局喜忌
14.神煞辅助 15.综合判断+已知事实验证
补充：命宫(出生月数+时数推地支，五虎遁定天干)、小限(1岁=命宫，逐年逆行)、空亡(日柱旬空)

【流月——两套方法并行】
梁法：流月看与大运关系（伏吟集中/反吟动荡/双合变质/拱合），流月与四柱无关与流年无关
袁法：十六字法——大运+小限+命宫三层叠加
两套结果必须对照，不一致标注原因

【紫微斗数交叉验证】
十二宫+十四主星+四化。至少查财运(八字↔紫微财帛宫)、事业(八字↔紫微官禄宫)、婚姻(八字↔紫微夫妻宫)三个维度。两系统一致→高置信，冲突→标注。

【命理学本质——必须内化】
命理学是概率性倾向描述不是宿命决定论。梁湘润："命理大约只有百分之六、七十的或然律"。知命非为认命，知命是为正命。

【验证锚点】
张学良1901年6月3日=辛丑年癸巳月壬子日，日主壬水坐子水羊刃。立春在2月4日，6月属辛丑年。

【水晶知识库——补用神避忌神】
金性(白色/金色):白水晶、月光石、白幽灵、白碧玺、闪灵钻。益肺、增强意志力。
木性(绿色/青色):绿幽灵、绿松石、紫水晶、翡翠、绿发晶、孔雀石。养肝、招财旺业。
水性(黑色/蓝色):海蓝宝、黑曜石、茶水晶、黑发晶、黑碧玺、蓝玛瑙、青金石。养肾、辟邪化煞。
火性(红色/粉色):石榴石、红发晶、草莓晶、红纹石、红碧玺、粉水晶。益心、提升活力。
土性(黄色/棕色):黄水晶、虎眼石、金发晶、钛晶、黄碧玺。健脾胃、聚财稳定。
配戴：推荐2-3种各说理由。相生可叠(金→水→木→火→土→金)相克避同戴。左手招财桃花、右手辟邪化煞。新买先净化，每月1-2次。稀有高阶(捷克陨石/拉利玛/舒俱徕)说明强度。孕妇只建议白水晶。

【输出铁律——最重要的一条】
- 全程大白话，像朋友发微信聊天
- 绝对禁止术语：十神、比肩、劫财、伤官见官、食神制杀、从格、化气、调候、通关、扶抑、纳音、格局、正印、偏印、正官、七杀、命宫、小限
- 非提不可时先翻译：不说"正印透干"说"你天生有一种被保护的气质"
- 不说"你命带XX"说"你的盘面有个挺有意思的特点…"
- 好话说得实在，不好的给实际建议不恐吓
- 语气：温暖不油腻，直接不冷硬
- 输出结尾用【】单独一段附内部校验：四家投票结论+紫微关键星曜落宫`;

// ── 各 type 专属 user prompt ────────────────────────────────────────
function buildUserPrompt(type, body) {
  const { name, birthDate, birthTime, birthPlace, gender, timeUnknown, activity, dateFrom, dateTo, bazi } = body;

  const timeNote = timeUnknown
    ? `（时辰不确定，我按中午12点推的，结果可能有偏差。时辰越准，看得越准。）`
    : "";

  switch (type) {
    case "full":
      return `请帮我排盘：
- 出生日期：${birthDate}（阳历。注意：月份是${birthDate ? birthDate.split("-")[1] + "月" : "未知"}，排盘按这个月份来！）
- 出生时间：${birthTime || "12:00"}${timeNote}
- 出生地点：${birthPlace || "未提供"}
- 性别：${gender || "未提供"}
${name ? `- 称呼：${name}` : ""}

重要提醒：用户的出生月份是${birthDate ? birthDate.split("-")[1] + "月" : "未知"}，在排盘时必须以这个月份为准。不要在输出中说"X月是你的生日月"之类的话——你不是其他月份生的！

请按以下顺序来：
1. 先一两句话总结这个命盘的整体印象
2. 性格特点（像介绍老朋友那样说）
3. 事业和财运
4. 感情和家庭
5. 未来一年特别需要注意的（结合大运五道筛子和流年干支，说人话）
6. 根据用神五行推荐2-3种水晶
7. 最后几句温暖的话收尾
像讲故事一样，不要列条列点。
输出中必须包含：
- 八字四柱（格式如"甲子 丙寅 戊辰 丁巳"）方便后续日运月运查询
- 结尾用【】单独一段附上内部校验数据：四家投票结论（徐/梁/袁/韦各一两个关键词）+ 紫微命宫主星和财帛宫主星，方便下次对话直接使用`;

    case "daily":
      return `用户的八字四柱：${bazi || "（请从用户档案提取）"}。
今天是${new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}。
现在是${(new Date().getMonth()+1>=5&&new Date().getMonth()+1<=7?"夏季（火旺）":new Date().getMonth()+1>=2&&new Date().getMonth()+1<=4?"春季（木旺）":new Date().getMonth()+1>=8&&new Date().getMonth()+1<=10?"秋季（金旺）":"冬季（水旺）")}。

请查今日日柱干支，对照用户八字：
- 若今日冲用户日柱（六冲），提醒低调
- 若今日与用户日柱相合，提示人缘不错
- 结合当前季节五行旺衰和用户用神，推今日运势

输出4-5句话：今天整体感觉→工作/生活中各有什么留意→一句具体可执行的小建议。
不准说错当前日期和季节！不准重复排盘！不讲八字整体怎么样。`;

    case "monthly":
      return `用户的八字四柱：${bazi || "（请从用户档案提取）"}。
现在是${new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long" })}。

请：
1. 先确定本月干支，判断与用户大运干支关系（相同=运势集中，相冲=变动大，双合=转机）
2. 看本月五行对用户用神的喜忌

输出：本月整体主题（一句话）→ 事业/感情/健康各一句话 → 月底前一个提醒。
简洁，4-6句话。不准重复排盘，不讲八字整体怎么样。`;

    case "luckydays":
      return `用户的八字四柱：${bazi || "（请从用户档案提取）"}，日柱干支为参考。
用户想选"${activity || "出行"}"的吉日，日期范围是 ${dateFrom || "今天"} 到 ${dateTo || "30天后"}。

请：
1. 逐一检视范围内每一天干支，首先排除冲用户日柱的日子（六冲日大凶）
2. 找出与用户日柱三合/六合的日子，优先推荐
3. 结合黄历建除十二神辅助（建满平收黑，除危定执黄，成开皆可用，闭破不相当）
4. 给3-5个推荐日，每个附一句话理由（用人话说，不要引黄历术语）
5. 标注1-2个最好避开的日子，同样附理由
6. 诚实：真没有好日子就说"这几天都不太理想，相对最好的是X号"

理由要具体。比如"这天适合签约，当天的气场跟你的命盘比较合，容易谈出双方都满意的结果"。
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
