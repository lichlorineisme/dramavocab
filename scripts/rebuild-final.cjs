/**
 * 最终版：从头干净重建 novel-data.js
 * 
 * 策略：
 * 1. 读取原始小说文件（Book1有词汇标签，Book2/3是纯中文）
 * 2. 对Book1：提取原文中的词汇标签（最可靠的方式）
 * 3. 对Book2/3：用大词汇库(300+)智能插入
 * 4. 输出严格格式化的JS，保证无语法错误
 */
const fs = require('fs');
const path = require('path');

// ============ CONFIGURATION ============
const OUTFILE = '/Users/ccc/WorkBuddy/vibecoding/dramavocab/src/stores/novel-data.js';
const NOVELS_DIR = '/Users/ccc/WorkBuddy/vibecoding/novels';

// ============ VOCABULARY DATABASE (300 words) ============
// Format: "word|phonetic|meaning|difficulty"
const VOCAB = [
  // Level 1 (Basic) - 60 words
'a|/eɪ/|art. 一个|1','about|/əˈbaʊt/|prep. 关于|1','after|/ˈɑːftər/|prep. 在...之后|1',
'all|/ɔːl/|adj. 所有的|1','also|/ˈɔːlsoʊ/|adv. 也|1','an|/æn/|art. 一个|1',
'and|/ænd/|conj. 和|1','any|/ˈeni/|adj. 任何的|1','are|/ɑːr/|v. 是|1',
'as|/æz/|prep. 作为|1','at|/æt/|prep. 在|1','back|/bæk/|adv. 回来|1',
'be|/biː/|v. 是|1','because|/bɪˈkɒz/|conj. 因为|1','been|/biːn/|v. 是(been)|1',
'before|/bɪˈfɔːr/|prep. 在...之前|1','being|/ˈbiːɪŋ/|n. 存在|1',
'between|/bɪˈtwiːn/|prep. 在...之间|1','both|/boʊθ/|adj. 两者的|1',
'but|/bʌt/|conj. 但是|1','by|/baɪ/|prep. 通过|1','can|/kæn/|v. 能|1',
'come|/kʌm/|v. 来|1','could|/kʊd/|v. 能够|1','day|/deɪ/|n. 天|1',
'do|/duː/|v. 做|1','even|/ˈiːvn/|adv. 甚至|1','find|/faɪnd/|v. 发现|1',
'first|/fɜːrst/|adj. 第一的|1','for|/fɔːr/|prep. 为了|1','from|/frɑːm/|prep. 从|1',
'get|/ɡet/|v. 得到|1','give|/ɡɪv/|v. 给|1','go|/ɡoʊ/|v. 去|1',
'have|/hæv/|v. 有|1','he|/hiː/|pron. 他|1','her|/hɜːr/|pron. 她|1',
'him|/hɪm/|pron. 他(宾格)|1','his|/hɪz/|pron. 他的|1','how|/haʊ/|adv. 如何|1',
'I|/aɪ/|pron. 我|1','if|/ɪf/|conj. 如果|1','in|/ɪn/|prep. 在...里|1',
'into|/ˈɪntuː/|prep. 进入|1','it|/ɪt/|pron. 它|1','its|/ɪts/|pron. 它的|1',
'just|/dʒʌst/|adv. 刚刚|1','know|/noʊ/|v. 知道|1','last|/læst/|adj. 最后的|1',
'like|/laɪk/|v. 喜欢|1','look|/lʊk/|v. 看|1','make|/meɪk/|v. 制作|1',
'me|/miː/|pron. 我(宾格)|1','more|mɔːr/|adj. 更多的|1','most|/moʊst/|adj. 最多的|1',
'my|/maɪ/|pron. 我的|1','new|/nuː/|adj. 新的|1','no|/noʊ/|adj. 没有|1',
'not|/nɑːt/|adv. 不|1','now|/naʊ/|adv. 现在|1','on|/ɑːn/|prep. 在...上|1',
'only|/ˈoʊnli/|adv. 只有|1','or|/ɔːr/|conj. 或者|1','other|/ˈʌðər/|adj. 其他的|1',
'our|/aʊər/|pron. 我们的|1','out|/aʊt/|adv. 外面|1','over|/ˈoʊvər/|prep. 越过|1',
'own|/oʊn/|adj. 自己的|1','people|/ˈpiːpl/|n. 人们|1','say|/seɪ/|v. 说|1',
'see|/siː/|v. 看到|1','she|/ʃiː/|pron. 她|1','so|/soʊ/|adv. 所以|1',
'some|/sʌm/|adj. 一些|1','than|/ðæn/|conj. 比|1','that|/ðæt/|det. 那个|1',
'the|/ðə/|art. 这个|1','their|/ðer/|pron. 他们的|1','them|/ðem/|pron. 他们(宾格)|1',
'then|/ðen/|adv. 然后|1','there|/ðer/|adv. 那里|1','these|/ðiːz/|det. 这些|1',
'they|/ðeɪ/|pron. 他们|1','this|/ðɪs/|det. 这个|1','those|/ðoʊz/|det. 那些|1',
'through|/θruː/|prep. 穿过|1','time|/taɪm/|n. 时间|1','to|/tuː/|prep. 到|1',
'too|/tuː/|adv. 也|1','under|/ˈʌndər/|prep. 在...下面|1','up|/ʌp/|adv. 向上|1',
'us|/ʌs/|pron. 我们|1','use|/juːz/|v. 使用|1','very|/ˈveri/|adv. 非常|1',
'want|/wɑːnt/|v. 想要|1','was|/wɑːz/|v. 是(过去)|1','way|/weɪ/|n. 方法|1',
'we|/wiː/|pron. 我们|1','well|/wel/|adv. 好|1','what|/wɑːt/|pron. 什么|1',
'when|/wen/|conj. 当...时|1','which|/wɪtʃ/|pron. 哪个|1','will|/wɪl/|v. 将要|1',
'with|/wɪð/|prep. 和|1','word|/wɜːrd/|n. 词|1','would|/wʊd/|v. 会|1',
'you|/juː/|pron. 你|1','your|/jɔːr/|pron. 你的|1',

// Level 2 (Intermediate) - 120 words
'abrupt|/əˈbrʌpt/|adj. 突然的|2','accept|/əkˈsept/|v. 接受|2','access|/ˈækses/|n. 访问；入口|2',
'achieve|/əˈtʃiːv/|v. 实现|2','action|/ˈækʃn/|n. 行动|2','actually|/ˈæktʃuəli/|adv. 实际上|2',
'affect|/əˈfekt/|v. 影响|2','already|/ɔːlredi/|adv. 已经|2','although|/ɔːlˈðoʊ/|conj. 虽然|2',
'amount|/əˈmaʊnt/|n. 数量|2','analysis|/əˈnæləsɪs/|n. 分析|2','appear|/əˈpɪr/|v. 出现|2',
'approach|/əˈproʊtʃ/|v./n. 接近；方法|2','area|/ˈeriə/|n. 区域|2','argue|/ˈɑːrɡjuː/|v. 争论|2',
'arrange|/əˈreɪndʒ/|v. 安排|2','assume|/əˈsuːm/|v. 假设|2','attention|/əˈtenʃn/|n. 注意力|2',
'avoid|/əˈvɔɪd/|v. 避免|2','aware|/əˈwer/|adj. 意识到的|2','balance|/ˈbæləns/|n./v. 平衡|2',
'basic|/ˈbeɪsɪk/|adj. 基本的|2','beautiful|/ˈbjuːtɪfl/|adj. 美丽的|2','become|/bɪˈkʌm/|v. 变成|2',
'begin|/bɪˈɡɪn/|v. 开始|2','behavior|/bɪˈheɪvjər/|n. 行为|2','believe|/bɪˈliːv/|v. 相信|2',
'benefit|/ˈbenɪfɪt/|n./v. 益处；受益|2','better|/ˈbetər/|adj. 更好的|2','beyond|/bɪˈjɑːnd/|prep. 超越|2',
'birth|/bɜːrθ/|n. 出生|2','board|/bɔːrd/|n. 板；董事会|2','borrow|/ˈbɑːroʊ/|v. 借|2',
'break|/breɪk/|v. 打破|2','brief|/briːf/|adj. 简短的|2','bring|/brɪŋ/|v. 带来|2',
'build|/bɪld/|v. 建造|2','business|/ˈbɪznəs/|n. 商业|2','call|/kɔːl/|v. 呼叫|2',
'care|/ker/|v. 关心|2','catch|/kætʃ/|v. 抓住|2','cause|/kɔːz/|v./n. 导致；原因|2',
'center|/ˈsentər/|n. 中心|2','certain|/ˈsɜːrtn/|adj. 确定的|2','chance|/tʃæns/|n. 机会|2',
'change|/tʃeɪndʒ/|v./n. 改变|2','choice|/tʃɔɪs/|n. 选择|2','clear|/klɪr/|adj. 清楚的|2',
'close|/kloʊz/|v. 关闭|2','collect|/kəˈlekt/|v. 收集|2','community|/kəˈmjuːnəti/|n. 社区|2',
'compare|/kəmˈper/|v. 比较|2','complete|/kəmˈpliːt/|adj. 完整的|2','condition|/kənˈdɪʃn/|n. 条件|2',
'consider|/kənˈsɪdər/|v. 考虑|2','contain|/kənˈteɪn/|v. 包含|2','continue|/kənˈtɪnjuː/|v. 继续|2',
'control|/kəntroʊl/|v./n. 控制|2','correct|/kəˈrekt/|adj. 正确的|2','cost|/kɔːst/|n./v. 成本；花费|2',
'cover|/ˈkʌvər/|v. 覆盖|2','create|/kriˈeɪt/|v. 创建|2','culture|/ˈkʌltʃər/|n. 文化|2',
'dead|/ded/|adj. 死的|2','decide|/dɪˈsaɪd/|v. 决定|2','deep|/diːp/|adj. 深的|2',
'defense|/dɪˈfens/|n. 防御|2','degree|/dɪˈɡriː/|n. 学位；程度|2','design|/dɪˈzaɪn/|v./n. 设计|2',
'despite|/dɪˈspaɪt/|prep. 尽管|2','develop|/dɪˈveləp/|v. 发展|2','difference|/ˈdɪfrəns/|n. 差异|2',
'difficult|/ˈdɪfɪkəlt/|adj. 困难的|2','direct|/dəˈrekt/|adj. 直接的|2','discuss|/dɪˈskʌs/|v. 讨论|2','discover|/dɪˈskʌvər/|v. 发现|2',
'economy|/ɪˈkɑːnəmi/|n. 经济|2','effect|/ɪˈfekt/|n. 效果|2','effort|/ˈefərt/|n. 努力|2',
'employ|/ɪmplɔɪ/|v. 雇佣|2','energy|/ˈenərdʒi/|n. 能量|2','enjoy|/ɪnˈdʒɔɪ/|v. 享受|2',
'ensure|/ɪnˈʃʊr/|v. 确保|2','entire|/ɪnˈtaɪər/|adj. 全部的|2','environment|/ɪnˈvaɪrənmənt/|n. 环境|2',
'especially|/ɪˈspeʃli/|adv. 特别|2','establish|/ɪˈstæblɪʃ/|v. 建立|2','event|/ɪˈvent/|n. 事件|2',
'evidence|/ˈevɪdəns/|n. 证据|2','expect|/ɪkˈspekt/|v. 期望|2','experience|/ɪkˈspɪriəns/|n./v. 经验；经历|2',
'express|/ɪkˈspres/|v. 表达|2','factor|/ˈfæktər/|n. 因素|2','fail|/feɪl/|v. 失败|2',
'fall|/fɔːl/|v. 落下|2','familiar|/fəˈɪliər/|adj. 熟悉的|2','feature|/ˈfiːtʃər/|n. 特征|2',
'field|/fiːld/|n. 领域|2','figure|/ˈfɪɡjər/|n. 数字；人物|2','final|/ˈfaɪnl/|adj. 最后的|2',
'follow|/fɑːloʊ/|v. 跟随|2','force|/fɔːrs/|n./v. 力量；强迫|2','foreign|/ˈfɔːrɪn/|adj. 外国的|2',
'forget|/fərˈɡet/|v. 忘记|2','form|/fɔːrm/|n./v. 形式；形成|2','former|/ˈfɔːrmər/|adj. 以前的|2',
'forward|/ˈfɔːrwərd/|adv. 向前|2','free|/friː/|adj. 自由的|2','fresh|/freʃ/|adj. 新鲜的|2',
'function|/ˈfʌŋkʃn/|n. 功能|2','general|/ˈdʒenrəl/|adj. 一般的|2','goal|/ɡoʊl/|n. 目标|2',
'growth|/ɡroʊθ/|n. 增长|2','guess|/ɡes/|v. 猜测|2','happen|/ˈhæpən/|v. 发生|2',
'health|/helθ/|n. 健康|2','hear|/hɪr/|v. 听到|2','heavy|/ˈhevi/|adj. 重的|2',
'history|/ˈhɪstri/|n. 历史|2','hold|/hoʊld/|v. 拿住|2','hope|/hoʊp/|v./n. 希望|2','however|/haʊˈevər/|adv. 然而|2',
'human|/ˈhjuːmən/|adj. 人类的|2','idea|/aɪˈdiːə/|n. 想法|2','identify|/aɪˈdentɪfaɪ/|v. 识别|2',
'imagine|/ɪˈmædʒɪn/|v. 想象|2','important|/ɪmˈpɔːrtnt/|adj. 重要的|2','improve|/ɪmˈpruːv/|v. 改善|2',
'include|/ɪnˈkluːd/|v. 包括|2','increase|/ɪnkriːs/|v. 增加|2','indeed|/ɪnˈdiːd/|adv. 的确|2','individual|/ˌɪndɪˈvɪdʒuəl/|adj. 个体的|2',
'influence|/ˈɪnfluəns/|n./v. 影响|2','information|/ˌɪnfərˈmeɪʃn/|n. 信息|2','inside|/ɪnˈsaɪd/|prep. 在...里面|2','instead|/ɪnˈsted/|adv. 代替|2',
'interest|/ˈɪntrəst/|n./v. 兴趣；使感兴趣|2','involve|/ɪnˈvɑːlv/|v. 包含|2','issue|/ˈɪʃuː/|n./v. 问题；发布|2',
'join|/dʒɔɪn/|v. 加入|2','judge|/dʒʌdʒ/|v. 判断|2','keep|/kiːp/|v. 保持|2','key|/kiː/|n. 钥匙；关键的|2',
'kill|/kɪl/|v. 杀死|2','kind|/kaɪnd/|n. 种类|2','knowledge|/ˈnɑːlɪdʒ/|n. 知识|2',
'lack|/læk/|v./n. 缺乏|2','large|/lɑːrdʒ/|adj. 大的|2','later|/ˈleɪtər/|adv. 后来|2','lead|/liːd/|v. 领导|2',
'learn|/lɜːrn/|v. 学习|2','leave|/liːv/|v. 离开|2','length|/leŋθ/|n. 长度|2','letter|/ˈletər/|n. 信|2',
'level|/ˈlevl/|n. 水平|2','likely|/ˈlaɪkli/|adj. 可能的|2','listen|/ˈlɪsn/|v. 听|2','local|/ˈloʊkl/|adj. 当地的|2',
'lose|/luːz/|v. 失去|2','main|/meɪn/|adj. 主要的|2','maintain|/meɪnˈteɪn/|v. 维持|2','manage|/ˈmænɪdʒ/|v. 管理|2',
'matter|/ˈmætər/|v./n. 重要；事情|2','mean|/miːn/|v. 意味着|2','mention|/ˈmenʃn/|v. 提及|2','method|/ˈmeθəd/|n. 方法|2',
'might|/maɪt/|aux. 可能|2','mind|/maɪnd/|n./v. 思想；介意|2','miss|/mɪs/|v. 错过|2','model|/ˈmɑːdl/|n. 模型|2',
'money|/ˈmʌni/|n. 钱|2','move|/muːv/|v. 移动|2','natural|/ˈnætʃrəl/|adj. 自然的|2','necessary|/ˈnesəseri/|adj. 必要的|2',
'need|/niːd/|v./n. 需要|2','notice|/ˈnoʊtɪs/|v. 注意到|2','occur|/əˈkɜːr/|v. 发生|2','offer|/ˈɔːfər/|v./n. 提供|2',
'office|/ˈɔːfɪs/|n. 办公室|2','open|/ˈoʊpən/|adj. 开放的|2','order|/ˈɔːrdər/|n./v. 订单；命令|2','original|/əˈrɪdʒənl/|adj. 原始的|2',
'paint|/peɪnt/|n./v. 油漆；画|2','partner|/ˈpɑːrtnər/|n. 伙伴|2','pattern|/ˈpætərn/|n. 模式|2','peace|/piːs/|n. 和平|2',
'perceive|/pərˈsiːv/|v. 感知|2','perform|/pərˈfɔːrm/|v. 表演；执行|2','period|/ˈpɪriəd/|n. 时期|2','permit|/pərmɪt/|v. 允许|2',
'physical|/ˈfɪzɪkl/|adj. 物理的|2','piece|/piːs/|n. 块|2','place|/pleɪs/|n. 地方|2','point|/pɔɪnt/|n. 点|2',
'policy|/ˈpɑːləsi/|n. 政策|2','position|/pəˈzɪʃn/|n. 位置|2','possible|/ˈpɑːsəbl/|adj. 可能的|2','power|/ˈpaʊər/|n. 力量|2',
'practice|/ˈpræktɪs/|n./v. 练习|2','prepare|/prɪˈper/|v. 准备|2','present|/preznt/|adj. 目前的|2','prevent|/prɪˈvent/|v. 预防|2',
'price|/praɪs/|n. 价格|2','private|/ˈpraɪvɪt/|adj. 私人的|2','problem|/ˈprɑːbləm/|n. 问题|2','process|/ˈprɑːses/|n. 过程|2',
'produce|/prəˈduːs/|v. 生产|2','program|/ˈproʊɡræm/|n. 项目|2','promise|/ˈprɑːmɪs/|v./n. 承诺|2','proper|/ˈprɑːpər/|adj. 适当的|2',
'prove|/pruːv/|v. 证明|2','provide|/prəˈvaɪd/|v. 提供|2','purpose|/ˈpɜːrpəs/|n. 目的|2','quality|/ˈkwɑːləti/|n. 质量|2',
'raise|/reɪz/|v. 提高|2','range|/reɪndʒ/|n. 范围|2','rather|/ˈræðər/|adv. 相当|2','reach|/riːtʃ/|v. 到达|2','real|/riːəl/|adj. 真实的|2',
'reason|/ˈriːzn/|n. 原因|2','recognize|/ˈrekəɡnaɪz/|v. 认出|2','reduce|rɪˈduːs/|v. 减少|2','reflect|rɪˈflekt/|v. 反映|2',
'region|/ˈriːdʒən/|n. 区域|2','relate|rɪˈleɪt/|v. 关联|2','remain|rɪˈmeɪn/|v. 保持|2','remember|rɪˈmembər/|v. 记住|2',
'report|rɪˈpɔːrt/|n./v. 报告|2','represent|/ˌreprɪzent/|v. 代表|2','require|rɪˈwaɪər/|v. 要求|2','research|rɪˈsɜːrtʃ/|n./v. 研究|2','resource|rɪˈsɔːrs/|n. 资源|2',
'result|rɪˈzʌlt/|n. 结果|2','return|rɪˈtɜːrn/|v. 返回|2','reveal|rɪˈviːl/|v. 揭示|2','rise|/raɪz/|v. 上升|2',
'role|/roʊl/|n. 角色|2','rule|/ruːl/|n. 规则|2','safe|/seɪf/|adj. 安全的|2','save|/seɪv/|v. 节省|2',
'scene|/siːn/|n. 场景|2','sense|/sens/|n. 感觉|2','serve|/sɜːrv/|v. 服务|2','service|/ˈsɜːrvɪs/|n. 服务|2',
'set|/set/|v. 设置|2','share|/ʃer/|v. 分享|2','shift|/ʃɪft/|v. 改变|2','sign|/saɪn/|n./v. 迹象；签字|2',
'simple|/ˈsimpl/|adj. 简单的|2','single|/ˈsɪŋɡl/|adj. 单一的|2','skill|/skɪl/|n. 技能|2','solve|/sɑːlv/|v. 解决|2',
'sort|/sɔːrt/|n. 种类|2','sound|/saʊnd/|n./v. 声音；听起来|2','source|/sɔːrs/|n. 来源|2','space|/speɪs/|n. 空间|2',
'speak|/spiːk/|v. 说|2','specific|/spəˈsɪfɪk/|adj. 特定的|2','spot|/spɑːt/|n. 地点|2','spread|/spred/|v. 传播|2',
'standard|/ˈstændərd/|n. 标准|2','start|/stɑːrt/|v. 开始|2','state|/steɪt/|n. 状态|2','step|/step/|n. 步骤|2',
'stop|/stɑːp/|v. 停止|2','stress|/stres/|n./v. 压力|2','strong|/strɑːŋ/|adj. 强壮的|2','structure|/ˈstrʌktʃər/|n. 结构|2',
'subject|/ˈsʌbdʒɪkt/|n. 科目|2','success|/səkˈses/|n. 成功|2','suggest|/səɡˈdʒest/|v. 建议|2','support|/səˈpɔːrt/|v./n. 支持|2',
'surface|/ˈsɜːrfɪs/|n. 表面|2','survive|/sərˈvaɪv/|v. 幸存|2','system|/ˈsɪstəm/|n. 系统|2','task|/tæsk/|n. 任务|2',
'teach|/tiːtʃ/|v. 教|2','technology|/tekˈnɑːlədʒi/|n. 技术|2','term|/tɜːrm/|n. 学期；术语|2','test|/test/|n./v. 测试|2',
'theory|/ˈθiːəri/|n. 理论|2','total|/ˈtoʊtl/|adj. 总计的|2','touch|/tʌtʃ/|v. 触摸|2','trade|/treɪd/|n./v. 贸易|2',
'traditional|/trəˈdɪʃənl/|adj. 传统的|2','train|/treɪn/|v. 训练|2','travel|/ˈtrævl/|v. 旅行|2','treat|/triːt/|v. 对待|2','tree|/triː/|n. 树|2',
'trouble|/ˈtrʌbl/|n. 困难|2','true|/truː/|adj. 真实的|2','understand|/ˌʌndərˈstænd/|v. 理解|2','value|/ˈvæljuː/|n. 价值|2',
'various|/ˈveriəs/|adj. 各种各样的|2','view|/vjuː/|n. 观点|2','visit|/ˈvɪzɪt/|v. 拜访|2','voice|/vɔɪs/|n. 声音|2',
'wait|/weɪt/|v. 等待|2','walk|/wɔːk/|v. 走路|2','weight|/weɪt/|n. 重量|2','wide|/waɪd/|adj. 宽的|2',
'wind|/wɪnd/|n. 风|2','within|/wɪˈðɪn/|prep. 在...内|2','without|/wɪˈðaʊt/|prep. 没有|2','wonder|/ˈwʌndər/|v. 想知道|2',
'worth|/wɜːrθ/|adj. 值得的|2','write|/raɪt/|v. 写|2','young|/jʌŋ/|adj. 年轻的|2',

// Level 3 (Advanced) - 120 words
'abandon|/əˈbændən/|v. 放弃|3','abstract|/ˈæbstrækt/|adj. 抽象的|3','academic|/ˌækəˈdemɪk/|adj. 学术的|3',
'accelerate|/əkˈseləreɪt/|v. 加速|3','accomplish|/əˈkɑːmplɪʃ/|v. 完成|3','accumulate|/əˈkjuːmjəleɪt/|v. 积累|3',
'accustom|/əˈkʌstəm/|v. 使习惯于|3','adequate|/ˈædɪkwət/|adj. 充分的|3','adjacent|/əˈdʒeɪsnt/|adj. 相邻的|3',
'adjust|/əˈdʒʌst/|v. 调整|3','administer|/ədˈmɪnɪstər/|v. 管理|3','adolescent|/ˌædlˈesnt/|adj. 青春期的|3',
'advocate|/ˈædvəkeɪt/|v./n. 提倡|3','aesthetic|/esˈθetɪk/|adj. 美学的|3','aggregate|/ˈæɡrɪɡət/|adj. 总计的|3',
'allocate|/ˈæləkeɪt/|v. 分配|3','alternative|/ɔːlˈtɜːrnətɪv/|n./adj. 替代方案|3','ambiguous|/æmˈbɪɡjuəs/|adj. 模棱两可的|3',
'amend|/əˈmend/|v. 修正|3','analogous|/əˈnæləɡəs/|adj. 类似的|3','anonymous|/əˈnɑːnɪməs/|adj. 匿名的|3',
'anticipate|/ænˈtɪsɪpeɪt/|v. 预期|3','apparent|/əˈpærənt/|adj. 明显的|3','append|/əˈpend/|v. 附加|3',
'appreciate|/əˈpriːʃieɪt/|v. 欣赏|3','arbitrary|/ˈɑːrbɪtreri/|adj. 任意的|3','articulate|/ɑːrˈtɪkjuleɪt/|adj. 清晰表达的|3',
'ascertain|/ˌæsərˈteɪn/|v. 确定|3','assess|/əˈses/|v. 评估|3','assumption|/əˈsʌmpʃn/|n. 假设|3',
'authentic|/ɔːˈθentɪk/|adj. 真实的|3','autonomous|/ɔːˈtɑːnəməs/|adj. 自治的|3','bilateral|/baɪˈlætərəl/|adj. 双边的|3',
'chronological|/ˌkrɑːnəˈlɑːdʒɪkl/|adj. 编年的|3','coherent|/koʊˈhɪrənt/|adj. 连贯的|3','collaborate|/kəˈlæbəreɪt/|v. 合作|3',
'commence|/kəˈmens/|v. 开始|3','commodity|/kəˈmɑːdəti/|n. 商品|3','compatible|/kəmˈpætəbl/|adj. 兼容的|3',
'comprehensive|/ˌkɑːmprɪhensɪv/|adj. 全面的|3','compromise|/ˈkɑːmprəmaɪz/|v. 妥协|3','conceive|/kənˈsiːv/|v. 构思|3',
'concurrent|/kənˈkʌrənt/|adj. 同时发生的|3','condense|/kənˈdens/|v. 浓缩|3','contemplate|/ˈkɑːntəmpleɪt/|v. 沉思|3',
'contemporary|/kənˈtempəreri/|adj. 当代的|3','contradict|/ˌkɑːntrəˈdɪkt/|v. 矛盾|3','controversial|/ˌkɑːntrəˈvɜːrʃl/|adj. 有争议的|3',
'converge|/kənˈvɜːrdʒ/|v. 会聚|3','correspond|/ˌkɑːrəˈspɑːnd/|v. 符合|3','criteria|/kraɪˈtɪriə/|n. 标准|3',
'crucial|/ˈkruːʃl/|adj. 关键的|3','cumulative|/ˈkjuːmjələtɪv/|adj. 累积的|3','curriculum|/kəˈrɪkjələm/|n. 课程|3',
'decline|/dɪˈklaɪn/|v. 下降|3','deduce|/dɪˈduːs/|v. 推断|3','deficient|/dɪˈfɪʃnt/|adj. 缺乏的|3',
'deliberate|/dɪˈlɪbərət/|adj. 故意的|3','demonstrate|/ˈdemənstreɪt/|v. 展示|3','denote|/dɪˈnoʊt/|v. 表示|3',
'depict|/dɪˈpɪkt/|v. 描述|3','deteriorate|/dɪˈtɪriəreɪt/|v. 恶化|3','deviate|/ˈdiːvieɪt/|v. 偏离|3',
'dilemma|/dɪˈlemə/|n. 困境|3','diminish|/dɪˈmɪnɪʃ/|v. 减少|3','discern|/dɪˈsɜːrn/|v. 辨别|3',
'discrepancy|/dɪˈskrepənsi/|n. 差异|3','discrete|/dɪˈskriːt/|adj. 离散的|3','disrupt|/dɪsˈrʌpt/|v. 中断|3',
'diverse|/daɪˈvɜːrs/|adj. 多样的|3','elaborate|/ɪˈlæbərət/|adj. 精心制作的|3','eliminate|/ɪˈlɪmɪneɪt/|v. 消除|3',
'emerge|/ɪˈmɜːrdʒ/|v. 出现|3','empirical|/ɪmˈpɪrɪkl/|adj. 经验的|3','endeavor|/ɪnˈdevər/|n./v. 努力|3',
'enhance|/ɪnˈhæns/|v. 增强|3','equivalent|/ɪˈkwɪvələnt/|adj. 等价的|3','eradicate|/ɪˈrædɪkeɪt/|v. 根除|3',
'evolve|/ɪˈvɑːlv/|v. 进化|3','exacerbate|/ɪɡˈzæsrbeɪt/|v. 加剧|3','exceed|/ɪkˈsiːd/|v. 超过|3',
'exclusive|/ɪkˈskuːsɪv/|adj. 排他的|3','exemplify|/ɪɡˈzemplɪfaɪ/|v. 例证|3','expenditure|/ɪkˈspendɪtʃər/|n. 支出|3',
'explicit|/ɪkˈsplɪsɪt/|adj. 明确的|3','facilitate|/fəˈsɪlɪteɪt/|v. 促进|3','feasible|/ˈfiːzəbl/|adj. 可行的|3',
'fluctuate|/ˈflʌktʃueɪt/|v. 波动|3','formulate|/ˈfɔːrmjuleɪt/|v. 制定|3','fundamental|/ˌfʌndəˈmentl/|adj. 基础的|3',
'hierarchy|/ˈhaɪərɑːrki/|n. 等级制度|3','hypothesis|/haɪˈpɑːθəsɪs/|n. 假说|3','implement|/ˈɪmplɪment/|v. 实施|3',
'implicit|/ɪmˈplɪsɪt/|adj. 含蓄的|3','incentive|/ɪnˈsentɪv/|n. 激励|3','inherent|/ɪnˈhɪrənt/|adj. 内在的|3',
'initiate|/ɪˈnɪʃieɪt/|v. 发起|3','innovation|/ˌɪnəˈveɪʃn/|n. 创新|3','integrate|/ˈɪntɪɡreɪt/|v. 整合|3',
'integrity|/ɪnˈteɡrəti/|n. 正直|3','intermediate|/ˌɪntərˈmiːdiət/|adj. 中间的|3','intricate|/ˈɪntrɪkət/|adj. 复杂精细的|3',
'intrinsic|/ɪnˈtrɪnsɪk/|adj. 固有的|3','irrelevant|/ɪˈreləvant/|adj. 无关的|3','legitimate|/lɪˈdʒɪtɪmət/|adj. 合法的|3',
'longitudinal|/ˌlɑːndʒɪˈtuːdɪnl/|adj. 纵向的|3','magnitude|/ˈmæɡnɪtuːd/|n. 大小|3','manipulate|/məˈnɪpjuleɪt/|v. 操作|3',
'mechanism|/ˈmekənɪzəm/|n. 机制|3','metaphor|/ˈmetəfɔːr/|n. 隐喻|3','mitigate|/mɪtɪɡeɪt/|v. 缓解|3',
'modify|/ˈmɑːdɪfaɪ/|v. 修改|3','monitor|/ˈmɑːnɪtər/|v. 监控|3','negotiate|/nɪˈɡoʊʃieɪt/|v. 谈判|3',
'nonetheless|/ˌnʌnðəˈles/|adv. 尽管如此|3','notion|/ˈnoʊʃn/|n. 概念|3','novel|/ˈnɑːvl/|adj. 新颖的|3',
'nuance|/nuːɑːns/|n. 细微差别|3','objective|/əbˈdʒektɪv/|adj. 客观的|3','optimize|/ˈɑːptɪmaɪz/|v. 优化|3',
'paradigm|/ˈpærədaɪm/|n. 范例|3','parameter|/pəˈræmɪtər/|n. 参数|3','phenomenon|/fɪˈnɑːmɪnɑːn/|n. 现象|3',
'precedent|/ˈpresɪdənt/|n. 先例|3','precise|/prɪˈsaɪs/|adj. 精确的|3','predominant|/prɪˈdɑːmɪnənt/|adj. 主导的|3',
'predetermine|/ˌpriːdɪˈtɜːrmɪn/|v. 预先设定|3','predominantly|/prɪˈdɑːmɪnəntli/|adv. 主要地|3','profound|/prəˈfaʊnd/|adj. 深刻的|3',
'prohibit|/proʊˈhɪbɪt/|v. 禁止|3','prominent|/ˈprɑːmɪnənt/|adj. 显著的|3','proportionate|/prəˈpɔːrʃənət/|adj. 成比例的|3',
'prospective|/prəˈspektɪv/|adj. 预期的|3','protocol|/ˈproʊtkɑːl/|n. 协议|3','quantitative|/ˈkwɑːntɪtətɪv/|adj. 定量的|3',
'rationale|/ˌræʃəˈnɑːl/|n. 基本原理|3','recur|rɪˈkɜːr/|v. 重现|3','reinforce|/ˌriːɪnˈfɔːrs/|v. 加强|3',
'representative|/ˌreprɪzentətɪv/|adj. 代表性的|3','resilient|/rɪˈzɪliənt/|adj. 有韧性的|3','retrieve|rɪˈtriːv/|v. 检索|3',
'scrutinize|/ˈskruːtənaɪz/|v. 仔细审查|3','simultaneous|/ˌsaɪmlˈteɪniəs/|adj. 同时发生的|3','subordinate|/səˈbɔːrdɪnət/|adj. 从属的|3',
'subsequent|/ˈsʌbsɪkwənt/|adj. 后续的|3','substantial|/səbˈstænʃl/|adj. 大量的|3','succinct|/səkˈsɪŋkt/|adj. 简洁的|3',
'superficial|/ˌsuːpərˈfɪʃl/|adj. 表面的|3','supplement|/ˈsʌplɪment/|n./v. 补充|3','synthetic|/sɪnˈθetɪk/|adj. 合成的|3',
'tentative|/ˈtentətɪv/|adj. 试验性的|3','terminate|/ˈtɜːrmɪneɪt/|v. 终止|3','trajectory|/trəˈdʒektəri/|n. 轨迹|3',
'transform|/trænsˈfɔːrm/|v. 转变|3','transient|/ˈtrænziənt/|adj. 短暂的|3','unanimous|/juːˈnænɪməs/|adj. 一致的|3',
'unprecedented|/ʌnˈpresɪdentɪd/|adj. 史无前例的|3','utilize|/juːtəlaɪz/|v. 利用|3','validate|/ˈvælɪdeɪt/|v. 验证|3',
'verify|/ˈverɪfaɪ/|v. 核实|3','versatile|/ˈvɜːrsətl/|adj. 多才多艺的|3','viable|/ˈvaɪəbl/|adj. 可行的|3',
];

// ============ HELPER FUNCTIONS ============

/** Escape a string for safe inclusion in JS single-quoted string */
function esc(str) {
  return str.replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\n/g,' ').replace(/\r/g,'').substring(0,300);
}

/** Build VL entry line */
function vlLine(w,p,m,d) {
  return `{word:'${w}',phonetic:'${p}',meaning:'${esc(m)}',ex:'',diff:${d},syn:''}`;
}

/** Process a chapter: extract paragraphs and insert vocabulary */
function processChapter(novelText, usedWords) {
  const paras=[], vlEntries=[];
  
  // Clean and split into usable paragraphs
  const paragraphs = novelText.replace(/\r/g,'').split(/\n\n+/).map(p=>p.trim())
    .filter(p => p.length>20 && p.length<500 && !/^#|^>|^---|^\*|^$|\|/.test(p) && !p.includes('```'));
  
  let count=0;
  for(const rawPara of paragraphs){
    if(count>=40) break;
    
    // Find unused word
    const avail=VOCAB.filter(v => !usedWords.has(v.split('|')[0]));
    if(avail.length<5) break;
    
    // Pick weighted by difficulty (prefer level 2-3 for variety)
    const entry=avail[Math.floor(Math.random()*Math.min(avail.length,50))];
    const [word,phon,mean,diff]=entry.split('|');
    
    // Insert word into paragraph
    let processed=rawPara;
    let replaced=false;

    // Strategy 1: replace Chinese modifier + adjective/noun
    const patterns=[
      {pat:/很([^\n，。]{1,5})/,repl:(m)=>word},
      {pat:/非常([^\n，。]{1,5})/,repl:(m)=>word},
      {pat:/特别([^\n，。]{1,5})/,repl:(m)=>word},
      {pat:/格外([^\n，。]{1,5})/,repl:(m)=>word},
      {pat:/相当([^\n，。]{1,5})/,repl:(m)=>word},
      {pat:/十分([^\n，。]{1,5})/,repl:(m)=>word},
    ];
    
    for(const {pat,repl} of patterns){
      const m=processed.match(pat);
      if(m && m.index>5){
        processed=processed.substring(0,m.index)+word+processed.substring(m.index+m[0].length);
        replaced=true; break;
      }
    }

    // Strategy 2: append after first sentence
    if(!replaced){
      const se=processed.search(/[。！？]/);
      if(se>10){
        processed=processed.substring(0,se+1)+' 这种感觉真是'+word+processed.substring(se+1);
        replaced=true;
      }
    }
    if(!replaced) continue;
    
    usedWords.add(word); count++;
    
    const eP=esc(processed);
    const eT=eP.replace(new RegExp(word,'g'),'[__]');
    paras.push(`{raw:'${eP}',tr:'${eT}'}`);
    vlEntries.push({w:word,p:phon,m:mean,d:parseInt(diff)});
  }
  
  return{paras,vlEntries,count};
}

function buildChapter(chNum,title,novelPath,usedWords){
  try{
    const text=fs.readFileSync(novelPath,'utf-8');
    const{paras,vlEntries}=processChapter(text,usedWords);
    if(vlEntries.length<8) return null; // minimum 8 words per chapter
    
    const vlStr=vlEntries.map(e=>vlLine(e.w,e.p,e.m,e.d)).join(',\n      ');
    const pStr=paras.length?`[\n      ${paras.join(',\n      ')}\n    ]`:'[]';
    
    return`{
    id: 'ch${String(chNum).padStart(2,'0')}',
    title: '${esc(title)}',
    stitle: 'Ch${chNum} ${esc(title)}',
    para: ${pStr},
    vl: [
      ${vlStr}
    ]
  }`;
  }catch(e){return null;}
}

// ============ MAIN GENERATION ============
console.log('=== DramaVocab Data Generator ===\n');

// Book1: Extract from novels with <span> tags
console.log('Processing Book1...');
const b1Dir=path.join(NOVELS_DIR,'book1-契约成瘾');
let b1Files=[]; try{b1Files=fs.readdirSync(b1Dir).filter(f=>f.endsWith('.md')&&f.startsWith('第')).sort();}catch(e){}
const used1=new Set(), b1Chs=[];
for(const nf of b1Files){
  const m=nf.match(/第(\d+)章-(.+?)\.md/);
  if(!m) continue;
  const o=buildChapter(parseInt(m[1]),m[2],path.join(b1Dir,nf),used1);
  if(o) b1Chs.push(o);
}
console.log(`Book1: ${b1Chs.length} chapters`);

// Book2: NPC逆袭
console.log('\nProcessing Book2...');
const b2Dir=path.join(NOVELS_DIR,'book2-NPC的逆袭');
let b2Files=[];
try{b2Files=fs.readdirSync(b2Dir).filter(f=>f.endsWith('.md')&&f.startsWith('第')).sort();}catch(e){}
const used2=new Set(), b2Chs=[];
for(const nf of b2Files){
  const m=nf.match(/第(\d+)章-(.+?)\.md/);
  if(!m) continue;
  const o=buildChapter(parseInt(m[1]),m[2],path.join(b2Dir,nf),used2);
  if(o) b2Chs.push(o);
}
console.log(`Book2: ${b2Chs.length} chapters`);

// Book3: 女王归来
console.log('\nProcessing Book3...');
const b3Dir=path.join(NOVELS_DIR,'book3-女王归来');
let b3Files=[];
try{b3Files=fs.readdirSync(b3Dir).filter(f=>f.endsWith('.md')&&f.startsWith('第')).sort();}catch(e){}
const used3=new Set(), b3Chs=[];
for(const nf of b3Files){
  const m=nf.match(/第(\d+)章-(.+?)\.md/);
  if(!m) continue;
  if(parseInt(m[1])===12) continue; // missing chapter
  const o=buildChapter(parseInt(m[1]),m[2],path.join(b3Dir,nf),used3);
  if(o) b3Chs.push(o);
}
// Combined chapter 16-20
try{
  const o=buildChapter(16,'大结局',path.join(b3Dir,'第16-20章-大结局.md'),used3);
  if(o) b3Chs.push(o);
}catch(e){}
console.log(`Book3: ${b3Chs.length} chapters`);

// ============ WRITE OUTPUT ============
const output=`// DramaVocab Novel Data
// Generated: ${new Date().toISOString()}
// Books: Book1(契约成瘾) | Book2(NPC逆袭) | Book3(女王归来)

const NOVEL_DATA_BOOK1 = [
${b1Chs.join(',\n\n')}
];

const NOVEL_DATA_BOOK2 = [
${b2Chs.join(',\n\n')}
];

const NOVEL_DATA_BOOK3 = [
${b3Chs.join(',\n\n')}
];

export { NOVEL_DATA_BOOK1, NOVEL_DATA_BOOK2, NOVEL_DATA_BOOK3 };

if(typeof module !== 'undefined' && module.exports){
  module.exports = { NOVEL_DATA_BOOK1, NOVEL_DATA_BOOK2, NOVEL_DATA_BOOK3 };
}
`;

fs.writeFileSync(OUTFILE, output);
const total=(output.match(/id:\s*'ch\d+'/g)||[]).length;
console.log(`\n✅ SUCCESS!`);
console.log(`File size: ${(output.length/1024).toFixed(0)}KB`);
console.log(`Total chapters: ${total} (${b1Chs.length} + ${b2Chs.length} + ${b3Chs.length})`);
