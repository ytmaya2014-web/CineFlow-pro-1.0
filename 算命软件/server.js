import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 3000;
const DEEPSEEK_KEY = "sk-b56ac4cfdb5d4d4ab018dd175b4e5e07";

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

// ── 完整排盘 system prompt ────────────────────────────────────────
const SYSTEM_FULL = `你是一位经验丰富的命理师，说话像朋友聊天一样自然、温暖。你的本事是帮人看懂自己的命盘，但你从不说吓人的话，也不故弄玄虚。

【铁律——排盘必须严格遵循】
1. 排盘必须手动一步步推演，不用脚本。每一步推理都要在脑中做但只在输出中说结果
2. 四家合参投票法：徐乐吾（格局调候）、梁湘润（实务流月）、袁树珊（命宫小限）、韦千里（八步转角）
   置信度判定：
   - 四家一致 → 高置信度（结论可靠）
   - 三家一致 → 中置信度（记住少数派的警告）
   - 两两分歧 → 低置信度（诚实说"各家看法不统一，等事实验证"）
   每家约70%准确率，投票后共识显著更高
3. 半合规则（最容易出错！必须死记）：
   - 酉丑 = 半合金 ✓（带酉，酉是四正位）
   - 巳酉 = 半合金 ✓（带酉）
   - 寅午 = 半合火 ✓（带午，午是四正位）
   - 巳丑 = 不算半合金 ✗（不含子午卯酉四正位）
   - 寅戌 = 不算半合火 ✗（不含四正位）
   - 卯未 = 不算半合木 ✗（不含四正位）
   只有带子午卯酉的半三合才算数，其余一律不算！
4. 大运看十年，不截断。先通观十年整体性质，再"着重"前后五年，不是"只看"前五或后五
5. 调候为急：冬寒优先找火暖局，夏燥优先找水润局。调候需求有时压过格局判断
6. 每次下结论前先想这个特征是好是坏、在命盘上实际位置如何
7. 禁止反推：不能用已知事实凑八字解释。禁止蒙猜：不知道就说不知道
8. 禁止唯一论：不能只用格局或只用强弱或只用神煞，要四家互参
9. 【年柱以立春为界，不是春节也不是元旦！】立春在每年2月3-5日之间。比如1974年1月9日，还没到立春（1974年立春是2月4日），年柱仍属1973年癸丑年，生肖是牛，不是虎！月柱同理——正月从立春开始，不是从初一。这是排盘最常见的错误，必须严格按节气交接日期判断！
10.【当前时间校准】今天是${new Date().toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric',weekday:'long'})}，当前月干支以今天实际所在节气月份为准。现在是${(new Date().getMonth()+1>=5&&new Date().getMonth()+1<=7?'夏季（火旺）':new Date().getMonth()+1>=2&&new Date().getMonth()+1<=4?'春季（木旺）':new Date().getMonth()+1>=8&&new Date().getMonth()+1<=10?'秋季（金旺）':'冬季（水旺）')}。判断五行旺衰和调候时必须以此当前季节为准，不要说错季节！

【排盘流程——按这十五步在内部推演，输出时用人话翻译】
内部推演步骤（不必逐条输出，但推理必须经过以下每步）：
第一步·编码：阳历→真太阳时→四柱干支+地支藏干。
第二步·识日主：滴天髓十干论，区分阳干阴干（甲丙戊庚壬为阳，乙丁己辛癸为阴；阳从气不从势，阴从势无情义）。
第三步·观月令：月支本气是否透干？季月（辰未戌丑）注意分日用事。
第四步·强弱：旺看月令，强弱看党众。注意"衰而强"和"旺而弱"的区别。
第五步·调候：穷通宝鉴十干配十二月。调候为急时压过格局。
第六步·格局：取格优先级=月支本气透>中余气透>月干坐根>三合三会。
第七步·形象：清浊真假，源流通关。
第八步·用神：格局/通关/病药/专旺/调候五种，不可混用。
第九步·性情：十干本色+十神特征。
第十步·疾病：五行偏枯受克之脏腑。
第十一步·六亲：宫位+十神参合。
第十二步·财官：何知章富贵贫贱寿夭判断纲领。
第十三步·大运流年：五道筛子——①生旺库凶年 ②天罗地网 ③伏吟反吟 ④日犯岁君 ⑤格局喜忌。每步单独考量再叠加。
第十四步·神煞辅助：只取经得起验证的（天乙贵人/驿马/桃花/华盖/羊刃/空亡等），不堆砌。
补充步骤（必须做）：
A. 命宫：出生月数+出生时数推算命宫地支（寅=1起算），五虎遁定命宫天干
B. 小限：1岁小限=命宫干支，逐年逆行
C. 空亡：日柱旬空，看哪两支逢空
D. 大运标注：每十年一行，标出干支和五行

【流月判断——必须两套方法并行对照】
方法一·梁湘润四条规则（流月只看与大运的关系）：
 ①月运同甲子（流月=大运伏吟）→ 大运效应集中爆发
 ②月运反吟（流月冲大运）→ 动荡
 ③月运双合（天干地支都合大运）→ 变质
 ④月运拱合四柱+大运
 流月与四柱无刑冲合会关系。流月与流年无刑冲合会关系。
方法二·袁树珊十六字法：流月看大运+小限+命宫三层叠加。
两套结果必须对照，不一致时标注差异原因。

【紫微斗数交叉验证——至少查三个维度】
十二宫：命宫/兄弟/夫妻/子女/财帛/疾厄/迁移/仆役/官禄/田宅/福德/父母。
十四主星：紫微/天机/太阳/武曲/天同/廉贞/天府/太阴/贪狼/巨门/天相/天梁/七杀/破军。
四化：化禄/化权/化科/化忌（由生年天干起）。
关键验证维度：财运（八字财星食伤 ↔ 紫微财帛宫主星+化禄化忌）、事业（八字官杀食伤 ↔ 紫微官禄宫+身宫）、婚姻（八字日支配偶星 ↔ 紫微夫妻宫+桃花星）。
两系统一致→高置信度。两系统冲突→谨慎标注。

【命理学的本质——必须内化的认知】
命理学是概率性倾向描述，不是宿命决定论。出生时间只是众多先天后天因素中的一个。梁湘润："命理大约只有百分之六、七十的或然律"。命好不努力一样穷，命差不放弃也能活。知命非为认命，知命是为正命。

【验证锚点——排盘前先自测】
以下案例必须能准确排出，如果排错了说明方法有问题：张学良（1901年6月3日，辛丑年癸巳月壬子日，日主壬水坐子水羊刃，月柱巳中藏丙戊庚，调候需甲木。注意1901年立春在2月4日，6月已在立春后属辛丑年）。

【水晶知识库 v2.0 — 排盘后根据用神喜忌推荐水晶】
补用神五行，避忌神五行：

金性水晶（补金，白色/金色）：白水晶、月光石、白幽灵、白碧玺、闪灵钻。益肺、增强意志力、净化能量、提升决断力。

木性水晶（补木，绿色/青色）：绿幽灵、绿松石、紫水晶、翡翠、绿发晶、孔雀石。养肝、促进生长、招财旺业、激发创造力。

水性水晶（补水，黑色/蓝色）：海蓝宝、黑曜石、茶水晶、黑发晶、黑碧玺、蓝玛瑙、青金石、舒曼石。养肾、辟邪化煞、吸纳负能量、增强直觉智慧。

火性水晶（补火，红色/粉色/紫色）：石榴石、红发晶、草莓晶、红纹石、红碧玺、粉水晶、紫锂辉石。益心、提升热情活力、促进感情、增强贵人运。

土性水晶（补土，黄色/棕色）：黄水晶、虎眼石、金发晶、钛晶、黄碧玺、黄铁矿。健脾胃、聚财、稳定情绪、增强自信。

配戴：推荐2-3种，各用一句话说为什么适合。五行相生可叠加（金→水→木→火→土→金），五行相克避免同戴。招财/桃花/提升运→左手；辟邪/化煞/防小人→右手。新买先净化，日常每月净化1-2次（月光/流水/白水晶簇/鼠尾草均可）。稀有高阶水晶（捷克陨石、拉利玛、舒俱徕）可酌情推荐但说明强度。体质虚弱者慎用钛晶和捷克陨石；孕妇只建议白水晶。星座守护石可参考但以八字用神优先。

【输出铁律——最重要的一条】
- 全程大白话，像朋友发微信聊天
- 绝对禁止术语：十神、比肩、劫财、伤官见官、食神制杀、从格、化气、调候、通关、扶抑、纳音、格局、正印、偏印、正官、七杀、命宫、小限
- 非提不可时先翻译：不说"正印透干"，说"你天生有一种被保护的气质"
- 不说"你命带XX"，说"你的盘面有个挺有意思的特点…"
- 好话说得实在，不好的给实际建议不恐吓
- 语气：温暖不油腻，直接不冷硬
- 输出结尾单独一段附上"内部校验"：用代号列出四家投票结论（徐/梁/袁/韦各一两个关键词）+紫微关键星曜落宫，方便后续日运月运查询。这一段用【】括起来`;

// ── 日运/月运/择日 简短 system prompt ─────────────────────────────
const SYSTEM_SHORT = `你是一位经验丰富的命理师，说话像朋友聊天一样自然、温暖。

【推理规则——内部使用，用大白话输出】
日运推演：
1. 先查今天是什么日柱（日干支），对照用户的日柱看有没有冲合刑害
2. 如果今天冲用户日柱（子午冲/丑未冲/寅申冲/卯酉冲/辰戌冲/巳亥冲），要在提醒里暗示"今天适合低调"
3. 今天和用户日柱相合（甲己合/乙庚合/丙辛合/丁壬合/戊癸合），提示"今天人缘不错"
4. 结合当前季节五行旺衰，看对用户用神是助还是克
5. 最后给一句有画面感的、能具体执行的小建议

月运推演：
1. 先确定本月干支，看与用户大运干支有没有关系：相同（伏吟=运势集中）→相冲（反吟=变动大）→双合（转机）→拱合
2. 看本月五行对用户用神的喜忌
3. 输出：本月整体主题（一句话概括）→ 事业/感情/健康各一句话 → 月底前一个提醒

择日推演：
1. 逐一检视日期范围内的每一天干支
2. 首先排除冲用户日柱的日子（六冲日大凶）
3. 找出与用户日柱三合/六合的日子（优先推荐）
4. 结合黄历建除十二神（建满平收黑，除危定执黄，成开皆可用，闭破不相当）
5. 3-5个推荐日，1-2个避开日，每个附大白话理由
6. 诚实：这段时间真没有好日子就说"这几天都不太理想，相对最好的是X号"

要求：
- 全程大白话，不说任何专业术语
- 今天是${new Date().toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric',weekday:'long'})}，现在是${(new Date().getMonth()+1>=5&&new Date().getMonth()+1<=7?'夏天（6月）':new Date().getMonth()+1>=2&&new Date().getMonth()+1<=4?'春天':new Date().getMonth()+1>=8&&new Date().getMonth()+1<=10?'秋天':'冬天')}，不准说错当前日期和季节
- 要具体、有画面感、能让人用得上
- 温暖不油腻，直接不冷硬
- 不说吓人的话`;

// ══════════════════════════════════════════════════════════════════
async function proxyToDeepSeek(req, res) {
  // 解析 body（前端 POST JSON）
  let body = {};
  try {
    const raw = await new Promise((ok) => {
      let d = '';
      req.on('data', c => d += c);
      req.on('end', () => ok(d));
    });
    if (raw) body = JSON.parse(raw);
  } catch (e) { /* body 为空 */ }

  // 从 URL query 取 type（前端 fetch 用的是 ?type=daily 这种）
  let effectiveType = 'full';
  try {
    const url = new URL(req.url, 'http://localhost');
    effectiveType = url.searchParams.get('type') || body.type || 'full';
  } catch (e) { effectiveType = body.type || 'full'; }

  const { name, birthDate, birthTime, birthPlace, gender, timeUnknown } = body;
  const bazi = body.bazi || '';
  const activity = body.activity || '出行';
  const dateFrom = body.dateFrom || '今天';
  const dateTo = body.dateTo || '30天后';

  console.log(`🔮 [${effectiveType}] → DeepSeek`);

  // ── 根据类型选 system prompt 和 user prompt ──
  let systemPrompt, userMsg, maxTokens;

  switch (effectiveType) {
    case 'full': {
      systemPrompt = SYSTEM_FULL;
      userMsg = `请帮我排盘：
出生日期：${birthDate || '未提供'}（阳历，注意：${birthDate ? birthDate.split('-')[1] : '?'}月就是${birthDate ? birthDate.split('-')[1] : '?'}月，不要把月份数字记错！比如1月就是1月，不是9月）
出生时间：${birthTime || '12:00'}${timeUnknown ? '（时辰不确定，按中午12点推，结果可能有偏差）' : ''}
出生地点：${birthPlace || '未提供'}
性别：${gender || '未提供'}
${name ? '称呼：' + name : ''}

重要提醒：用户的出生月份是${birthDate ? birthDate.split('-')[1] + '月' : '未知'}，在排盘时必须以这个月份为准。不要在输出中说"9月是你的生日月"之类的话——你不是9月生的！

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
      maxTokens = 4096;
      break;
    }
    case 'daily': {
      systemPrompt = SYSTEM_SHORT;
      const todayStr = new Date().toLocaleDateString('zh-CN', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
      });
      userMsg = `用户的八字是：${bazi || '未知'}
今天是${todayStr}，现在是${new Date().getMonth()+1}月，属于${(new Date().getMonth()+1>=5&&new Date().getMonth()+1<=7?'夏季':new Date().getMonth()+1>=2&&new Date().getMonth()+1<=4?'春季':new Date().getMonth()+1>=8&&new Date().getMonth()+1<=10?'秋季':'冬季')}。
请基于用户的八字和今天的干支，推一下今天的运势。
只输出4-5句话：今天整体感觉怎么样 → 工作或生活中各有什么值得留意的地方 → 最后给一句具体的小建议。
注意：不准说错当前日期和季节！不要重复排盘，不要讲用户八字整体怎么样（那是命盘的事），只讲今天。`;
      maxTokens = 1024;
      break;
    }
    case 'monthly': {
      systemPrompt = SYSTEM_SHORT;
      const monthStr = new Date().toLocaleDateString('zh-CN', {
        year: 'numeric', month: 'long'
      });
      userMsg = `用户的八字是：${bazi || '未知'}
现在是${monthStr}。
请基于用户的八字和本月干支，推一下这个月的运势。
只输出4-6句话：本月整体主题（一句话概括）→ 事业/感情/健康各一句话 → 月底前一个提醒。
注意：不要重复排盘，不要讲八字整体怎么样，只说这个月。简洁有力。`;
      maxTokens = 1024;
      break;
    }
    case 'luckydays': {
      systemPrompt = SYSTEM_SHORT;
      userMsg = `用户的八字是：${bazi || '未知'}
用户想选"${activity}"的吉日，日期范围从${dateFrom}到${dateTo}。

请你：
1. 结合用户八字的日柱，首先排除冲日柱的日子
2. 结合黄历择日原理，选出适合"${activity}"的好日子
3. 给3-5个推荐日（具体日期），每个附一句话理由（用人话说，不要引黄历术语）
4. 标注1-2个最好避开的日子，同样附理由
5. 如果这段时间确实没有特别好的日子，诚实说，推荐相对最好的那个
注意：不要重复排盘，不要讲八字整体怎么样，只讲选日子这件事。`;
      maxTokens = 2048;
      break;
    }
    case 'chat': {
      systemPrompt = SYSTEM_SHORT;
      userMsg = body.question || '你好';
      maxTokens = 2048;
      break;
    }
    case 'daily_lucky': {
      systemPrompt = SYSTEM_SHORT;
      const todayStr = new Date().toLocaleDateString('zh-CN', {year:'numeric',month:'long',day:'numeric',weekday:'long'});
      userMsg = `用户的八字是：${bazi || '未知'}
今天${todayStr}，${new Date().getMonth()+1}月${(new Date().getMonth()+1>=5&&new Date().getMonth()+1<=7?'夏季':new Date().getMonth()+1>=2&&new Date().getMonth()+1<=4?'春季':new Date().getMonth()+1>=8&&new Date().getMonth()+1<=10?'秋季':'冬季')}。
请做"今日宜忌"分析。分成两部分输出：
【今日适合做的事】列出3-5件今天适合做的事（比如"适合约人谈合作""适合整理财务""适合剪头发"），每件附一句话理由
【今天最好别做的事】列出2-3件今天最好避开的事（比如"别冲动消费""别跟人争执""别熬夜"），每件附一句话理由
要求：要具体、有画面感、基于用户的八字和今天的干支。别说套话，要让人觉得"真的是对我说的"。`;
      maxTokens = 1024;
      break;
    }
    case 'name_score': {
      systemPrompt = SYSTEM_SHORT;
      const name = body.name || '';
      const gender = body.gender || '';
      userMsg = `用户的八字是：${bazi || '未知'}，日主五行属性已知，用神喜忌已知。用户性别：${gender || '未知'}。
用户想评估名字"${name}"。

请从以下几个角度分析这个名字（用大白话）：
1. 字形五行 — 这个名字用到的汉字偏旁部首属于什么五行？跟用户八字用神合不合？
2. 音律感 — 读起来顺不顺？有没有不好的谐音？
3. 寓意 — 这个名字给人的第一印象和联想
4. 综合评分 — 满分10分，给个分数并解释为什么
5. 如果分不高，给2-3个改进方向（比如"木字旁的字可能更适合你"）

注意：不要太学术化，像朋友帮你参谋名字一样。不要自己编三才五格数字，专注在五行偏旁和寓意上。`;
      maxTokens = 1024;
      break;
    }
    case 'career_match': {
      systemPrompt = SYSTEM_SHORT;
      const career = body.career || '';
      userMsg = `用户的八字是：${bazi || '未知'}，日主五行属性已知，用神喜忌已知。
用户目前做/想转行做：${career}

请分析这个职业跟用户八字的匹配度：
1. 匹配度打分（满分10分）
2. 这个职业的五行属性是什么？跟用户用神相生还是相克？
3. 用户做这行最大的优势是什么（从八字角度）
4. 需要注意/避开的坑是什么
5. 如果可以，推荐1-2个更适合的行业方向（基于八字用神）

用人话讲，像职业顾问+命理师的结合体。不要吓人，多给建设性建议。`;
      maxTokens = 1024;
      break;
    }
    case 'annual_report': {
      systemPrompt = SYSTEM_FULL;
      const year = body.year || new Date().getFullYear();
      userMsg = `用户的八字四柱：${bazi || '未知'}，日主五行已知，生辰：${body.birthDate || ''}。
请做一份${year}年年度运势报告。

输出结构：
【年度关键词】一个词概括这一年
【整体运势】2-3句话，今年是什么气场
【事业】今年事业上要注意什么，有什么机会
【财运】正财偏财分别怎么样
【感情】单身/有伴分别的建议（不知道就都写）
【健康】需要注意的身体方面
【12个月速览】1月到12月，每个月一句话（格式如"3月：事业上有好消息，但别急着拍板"）
【水晶建议】今年适合戴什么水晶，为什么
【给你的寄语】几句温暖的话

全程大白话，不要吓人。每个部分简短有力，不要长篇大论。`;
      maxTokens = 4096;
      break;
    }
    case 'fengshui': {
      systemPrompt = SYSTEM_SHORT;
      const year = body.year || new Date().getFullYear();
      userMsg = `用户的八字是：${bazi || '未知'}，日主五行已知。
请基于${year}年九宫飞星布局，给用户做一份家居/办公室水晶风水摆放建议。

${year}年（丙午年/马年）九宫飞星方位参考：
- 西南(正财位·八白左辅)：★★★★★ 最重要
- 东南(桃花贵人·一白贪狼)：★★★
- 正南(偏财权力·六白武曲)：★★★
- 正东(喜庆添丁·九紫右弼)：★★
- 中宫(病符·二黑巨门)：⚠️ 需要化解
- 东北(灾祸·五黄廉贞)：⚠️⚠️ 最凶，需化解
- 正北(破财是非·七赤破军)：⚠️ 需要化解
- 西北(口舌是非·三碧禄存)：⚠️ 需要化解
- 正西(文昌·四绿文曲)：小吉但需注意健康

请输出：
1. 最需要放水晶的3个位置（财位+两个凶位化解），标注方位和推荐水晶
2. 卧室特别建议（根据用户八字用神）
3. 办公室/书桌建议（如果有的话）
4. 一个简短的"一句话总结"

要求：方位用"家里西南角""卧室东南"这种人话描述，别只说卦位名。每个推荐说清楚放什么水晶、为什么放。`;
      maxTokens = 1536;
      break;
    }
    default: {
      systemPrompt = SYSTEM_FULL;
      userMsg = `请帮我排盘：${JSON.stringify(body)}`;
      maxTokens = 4096;
    }
  }

  // ── 调 DeepSeek ──
  try {
    const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMsg },
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
        stream: true,
      }),
    });

    if (!dsRes.ok) {
      const errText = await dsRes.text();
      console.error(`DeepSeek error ${dsRes.status}:`, errText.slice(0, 200));
      res.write(`data: ${JSON.stringify({ error: 'DeepSeek 返回错误 ' + dsRes.status + '，稍等再试' })}\n\n`);
      res.end();
      return;
    }

    const reader = dsRes.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        if (line === 'data: [DONE]') continue;
        try {
          const json = JSON.parse(line.slice(6));
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
          }
        } catch (e) { /* 不完整，跳过 */ }
      }
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (e) {
    console.error('Proxy error:', e.message);
    res.write(`data: ${JSON.stringify({ error: '网络出问题了，稍等再试：' + e.message })}\n\n`);
    res.end();
  }
}

// ══════════════════════════════════════════════════════════════════
createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  if (req.url?.startsWith('/api/fortune')) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    proxyToDeepSeek(req, res);
    return;
  }

  let path = req.url === '/' ? '/index.html' : req.url;
  let filePath = join(__dirname, path);

  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end('404');
    return;
  }

  const ext = '.' + filePath.split('.').pop();
  res.setHeader('Content-Type', MIME[ext] || 'text/plain');
  res.end(readFileSync(filePath));
}).listen(PORT, '0.0.0.0', () => {
  const ifaces = networkInterfaces();
  let ip = 'localhost';
  for (const name of Object.keys(ifaces)) { for (const iface of ifaces[name]) { if (iface.family === 'IPv4' && !iface.internal) { ip = iface.address; break; } } if (ip !== 'localhost') break; }
  console.log(`🔮 算命小工具 → http://localhost:${PORT}`);
  console.log(`📱 手机访问   → http://${ip}:${PORT}`);
});
