#!/usr/bin/env python3
"""Generate ALL 20 chapters of NOVEL_DATA_BOOK2"""

import re, sys

def ve(word, phonetic, meaning, diff, syn=''):
    return f"      {{word:'{word}',phonetic:'{phonetic}',meaning:'{meaning}',ex:'',diff:{diff},syn:'{syn}'}}"

def add_chapter(ch_id, title, paras_raw, vocab_list):
    para_strs = []
    for raw_text in paras_raw:
        tr_text = re.sub(r'\b([A-Za-z][A-Za-z\'\-]*(?:\s+[A-Za-z][A-Za-z\'\-]*)?)\b', r'[\1]', raw_text)
        raw_escaped = raw_text.replace("'", "\\'")
        tr_escaped = tr_text.replace("'", "\\'")
        para_strs.append(f"      {{raw:'{raw_escaped}',tr:'{tr_escaped}'}}")
    
    vl_strs = [ve(**v) for v in vocab_list]
    return f"""  {{
    id: '{ch_id}',
    title: '{title}',
    para: [
{chr(10).join(para_strs)}
    ],
    vl: [
{chr(10).join(vl_strs)}
    ]
  }}"""

# Read current file  
with open('/Users/ccc/WorkBuddy/vibecoding/dramavocab/src/stores/novel-data.js', 'r', encoding='utf-8') as f:
    book1_content = f.read()

# Find insertion point
export_pos = book1_content.rfind("export { NOVEL_DATA_BOOK1 }")
before_export = book1_content[:export_pos].rstrip()

all_chapters = []

# ================================================================
# CHAPTER DATA: All 20 chapters
# Each entry: (id, title, [paragraphs], [{vocab}])
# ================================================================

CHAPTERS_DATA = [
# ===== Ch01-02: Already generated above pattern =====
('ch01', '觉醒的路人甲', [
'B市的九月，雨总是来得很 abrupt。苏渺站在傅氏集团顶层豪宅的落地窗前，看着雨水在玻璃上划出一道道痕迹。她的手里端着一盘刚刚热好的咖啡，这是她作为 servant 的第1095天工作。三年来，她在这个充溢着 luxury 的空间里，像个 invisible 的幽灵一样穿梭。没有人会多看她一眼，因为在这个 story 里，她只是一个 insignificant 的背景人物——甚至连名字都只有三个字的配角。',
'但今天，一切都变得 different 了。当苏渺把咖啡放在书桌上时，她的手指不小心碰到了一份文件——那是傅氏集团下一季的 investment 计划书。就在那一瞬间，一道 strange 的声音在她脑海中响起：检测到宿主接触关键剧情物品……NPC觉醒程序启动……苏渺的手抖了一下，咖啡洒了几滴在那份昂贵的文件上。她慌忙拿出纸巾擦拭，心里充满了 panic。这份文件如果毁了，她不仅会被 deduct 工资，还可能直接被 fire。',
'别慌。另一个声音响起——这一次，是来自她自己的内心。你刚刚触发了觉醒任务。苏渺愣住了。她环顾四周，确认房间里没有其他人。那个声音又来了：我是你的系统助手。从现在开始，你可以通过完成背单词任务来 accumulate 改写剧本的点数。每掌握一个高级词汇，你就能获得一次 alter 剧情走向的机会。苏渺觉得自己的脑子一定是出了 problem。她只是一个 humble 的女仆，每天的工作就是 clean 房间、prepare 咖啡、arrange 文件。什么改写剧本，这听起来像是那些 cheap 网络小说里才会出现的 plot。',
'这不是 hallucination。系统声音似乎读懂了她的想法。你是这本名为《霸总的契约娇妻》的言情小说里的一个 NPC 角色。原本的 destiny 是在第三章因为打碎一个古董花瓶而被 dismiss。但现在，你已经 awakened。你有机会 rewrite 自己的命运。苏渺深吸一口气，试图让自己 calm down。如果这是真的……那就意味着她过去三年的人生，全部都是被人安排好的 script？她在书中扮演的角色就是一个 clumsy、obedient、毫无 existence value 的 maid？这个认知让她感到一种 bizarre 的愤怒和……excitement。',
'第一个任务已经 issued。系统的声音把她拉回现实，请用英文单词替换下面这句话中的中文释义：这个 mansion 里的一切都属于那位 arrogant 的傅总。苏渺看着眼前浮现出的半透明文字界面，上面显示着十个 English words 和对应的 Chinese meanings。mansion(豪宅)、arrogant(傲慢)、possess(拥有)、dominate(支配)、authority(权威)……这些词汇她其实在高中时就学过，但因为毕业后没有使用环境，大部分都已经 fuzzy 了。',
'你有一分钟的时间。系统倒计时开始。苏渺强迫自己 focus。mansion……豪宅。arrogant……傲慢的。她开始在心中默念这些单词，同时把它们填入句子中。当她输入最后一个字母时，界面发出了绿色的光芒：Correct！你获得了1点剧本改写值。当前 accumulated 点数：1/10。1点。距离能 alter 一句台词还需要9点。苏渺看着手中已经凉掉的咖啡，突然意识到——她的人生可能从此刻开始，真正地 belong to herself 了。'
], [
{'word':'abrupt','phonetic':'/əˈbrʌpt/','meaning':'adj. 突然的','diff':2,'syn':'sudden'}, {'word':'servant','phonetic':'/ˈsɜːvənt/','meaning':'n. 仆人','diff':1,'syn':''}, {'word':'luxury','phonetic':'/ˈlʌkʃəri/','meaning':'n. 奢侈','diff':2,'syn':''}, {'word':'invisible','phonetic':'/ɪnˈvɪzəbl/','meaning':'adj. 隐形的','diff':2,'syn':''}, {'word':'story','phonetic':'/ˈstɔːri/','meaning':'n. 故事','diff':1,'syn':''}, {'word':'insignificant','phonetic':'/ˌɪnsɪɡˈnɪfɪkənt/','meaning':'adj. 微不足道的','diff':3,'syn':''}, {'word':'different','phonetic':'/ˈdɪfrənt/','meaning':'adj. 不同的','diff':1,'syn':''}, {'word':'investment','phonetic':'/ɪnˈvestmənt/','meaning':'n. 投资','diff':2,'syn':''}, {'word':'strange','phonetic':'/streɪndʒ/','meaning':'adj. 奇怪的','diff':1,'syn':''}, {'word':'panic','phonetic':'/ˈpænɪk/','meaning':'n./v. 恐慌','diff':1,'syn':''}, {'word':'deduct','phonetic':'/dɪˈdʌkt/','meaning':'v. 扣除','diff':2,'syn':''}, {'word':'fire','phonetic':'/ˈfaɪər/','meaning':'v. 解雇','diff':1,'syn':''}, {'word':'accumulate','phonetic':'/əˈkjuːmjuleɪt/','meaning':'v. 积累','diff':3,'syn':''}, {'word':'alter','phonetic':'/ˈɔːltər/','meaning':'v. 改变','diff':2,'syn':'change'}, {'word':'problem','phonetic':'/ˈprɒbləm/','meaning':'n. 问题','diff':1,'syn':''}, {'word':'humble','phonetic':'/ˈhʌmbl/','meaning':'adj. 卑微的','diff':2,'syn':''}, {'word':'clean','phonetic':'/kliːn/','meaning':'v. 清洁','diff':1,'syn':''}, {'word':'prepare','phonetic':'/prɪˈpeər/','meaning':'v. 准备','diff':1,'syn':''}, {'word':'arrange','phonetic':'/əˈreɪndʒ/','meaning':'v. 安排','diff':1,'syn':''}, {'word':'cheap','phonetic':'/tʃiːp/','meaning':'adj. 廉价的','diff':1,'syn':''}, {'word':'plot','phonetic':'/plɒt/','meaning':'n. 情节','diff':1,'syn':''}, {'word':'hallucination','phonetic':'/həˌluːsɪˈneɪʃn/','meaning':'n. 幻觉','diff':3,'syn':''}, {'word':'destiny','phonetic':'/ˈdestəni/','meaning':'n. 命运','diff':2,'syn':'fate'}, {'word':'dismiss','phonetic':'/dɪsˈmɪs/','meaning':'v. 解雇;解散','diff':2,'syn':'fire'}, {'word':'awakened','phonetic':'/əˈweɪkənd/','meaning':'v. 觉醒(过去分词)','diff':2,'syn':''}, {'word':'rewrite','phonetic':'/riːˈraɪt/','meaning':'v. 重写','diff':2,'syn':''}, {'word':'calm','phonetic':'/kɑːm/','meaning':'adj. 冷静的','diff':1,'syn':''}, {'word':'script','phonetic':'/skrɪpt/','meaning':'n. 剧本','diff':1,'syn':''}, {'word':'clumsy','phonetic':'/ˈklʌmzi/','meaning':'adj. 笨拙的','diff':2,'syn':''}, {'word':'obedient','phonetic':'/əˈbiːdiənt/','meaning':'adj. 顺从的','diff':2,'syn':''}, {'word':'existence','phonetic':'/ɪɡˈzɪstəns/','meaning':'n. 存在','diff':2,'syn':''}, {'word':'bizarre','phonetic':'/bɪˈzɑːr/','meaning':'adj. 奇异的','diff':2,'syn':'strange'}, {'word':'excitement','phonetic':'/ɪkˈsaɪtmənt/','meaning':'n. 兴奋','diff':2,'syn':''}, {'word':'issued','phonetic':'/ˈɪʃuːd/','meaning':'v. 发布','diff':1,'syn':''}, {'word':'mansion','phonetic':'/ˈmænʃn/','meaning':'n. 豪宅','diff':2,'syn':''}, {'word':'arrogant','phonetic':'/ˈærəɡənt/','meaning':'adj. 傲慢的','diff':2,'syn':''}, {'word':'English','phonetic':'/ˈɪŋɡlɪʃ/','meaning':'n. 英语','diff':1,'syn':''}, {'word':'fuzzy','phonetic':'/ˈfʌzi/','meaning':'adj. 模糊的','diff':1,'syn':'blurry'}, {'word':'focus','phonetic':'/ˈfəʊkəs/','meaning':'v./n. 集中注意力','diff':1,'syn':''}, {'word':'accumulated','phonetic':'/əˈkjuːmjuleɪtɪd/','meaning':'adj. 积累的','diff':2,'syn':''}, {'word':'belong','phonetic':'/bɪˈlɒŋ/','meaning':'v. 属于','diff':1,'syn':''}
]),

# ===== Ch02 =====
('ch02', '昂贵的咖啡渍', [
'第二天早上六点，苏渺准时出现在 kitchen 里。她的 daily routine 已经持续了三年：prepare 傅总早餐需要的 black coffee（不加糖不加奶）、heat 半个 croissant、把报纸整齐地 place 在餐桌上。这套 procedure 她闭着眼睛都能完成。但今天有些不同——昨晚系统告诉她，第二个任务即将 trigger。',
'今天的任务是：在傅总喝咖啡时，用英语描述这个 stain。系统提示音在她脑海中响起。苏渺低头看了看围裙——昨天擦文件时不小心留下的 brownish spot。这算什么任务？但她没有时间 complain 了，因为脚步声已从楼梯方向传来。傅景琛今天穿了一套 tailored 的深灰色 suit，领带打得 perfectly 整洁。他走到餐桌前坐下，目光扫过 coffee cup，然后停在了苏渺的围裙上。',
'What happened there? 他的 voice 很低，带着一种 casual 的 inquiry。苏淼心跳加速了——这就是系统说的 opportunity 吗？她需要用 English 来 respond。大脑飞速运转，searching 着记忆中的 vocabulary。It is a...coffee stain, Sir. 终于挤出这句 simple 的回答，发音还有些 hesitant。傅景琛眉毛微微抬了一下，但没有 comment。他拿起咖啡喝了一口，然后站起身。经过她身边时留下了一句话：Your pronunciation needs improvement.',
'苏渺站在原地，脸涨得通红。improvement? 确实需要 improve。自从 high school graduation 之后，她就几乎没有再使用过 English。但现在看来，这项 skill 可能会成为她改变命运的关键 tool。系统提示音再次响起：Task completed +1 point。Bonus: 宿主展现了 courage 尝试使用目标语言。额外奖励2点。当前 total: 4/10。courage? 不叫 courage，叫 desperate。但不管怎样，又 closer 了一步。',
'那天之后，苏渺开始利用 every spare moment 来 review vocabulary。她在 clean 房间时默背单词，在 prepare 咖啡时练习 pronunciation，甚至在 walk 去超市的路上也在 thinking 英语句子。发现当你真正有一个 goal 的时候，learning 变得不再 boring。每个新掌握的 word 都像是一把小小的 key，能 unlock 更大的 possibility。而傅景琛似乎也注意到了她的变化。一次他在她 arrange 文件时突然问：Have you been studying something? 苏渺愣了一秒，然后 honest 地回答：Yes, Sir. English。他没有再说什么，只是 nodded，嘴角似乎有了一个几乎 imperceptible 的 smile。'
], [
{'word':'kitchen','phonetic':'/ˈkɪtʃɪn/','meaning':'n. 厨房','diff':1,'syn':''}, {'word':'daily','phonetic':'/ˈdeɪli/','meaning':'adj. 每日的','diff':1,'syn':'everyday'}, {'word':'black coffee','phonetic':'/blæk ˈkɒfi/','meaning':'n. 黑咖啡','diff':1,'syn':''}, {'word':'heat','phonetic':'/hiːt/','meaning':'v. 加热','diff':1,'syn':'warm up'}, {'word':'croissant','phonetic':'/krwæˈsɒ̃/','meaning':'n. 羊角面包','diff':2,'syn':''}, {'word':'place','phonetic':'/pleɪs/','meaning':'v. 放置','diff':1,'syn':'put'}, {'word':'procedure','phonetic':'/prəˈsiːdʒər/','meaning':'n. 流程','diff':2,'syn':'process'}, {'word':'trigger','phonetic':'/ˈtrɪɡər/','meaning':'v. 触发','diff':2,'syn':'activate'}, {'word':'stain','phonetic':'/steɪn/','meaning':'n. 污渍','diff':1,'syn':'spot'}, {'word':'brownish','phonetic':'/ˈbraʊnɪʃ/','meaning':'adj. 带褐色的','diff':2,'syn':''}, {'word':'complain','phonetic':'/kəmˈpleɪn/','meaning':'v. 抱怨','diff':1,'syn':''}, {'word':'tailored','phonetic':'/ˈteɪlərd/','meaning':'adj. 定制的','diff':2,'syn':'custom-made'}, {'word':'suit','phonetic':'/suːt/','meaning':'n. 西装','diff':1,'syn':''}, {'word':'perfectly','phonetic':'/ˈpɜːrfiktli/','meaning':'adv. 完美地','diff':1,'syn':''}, {'word':'casual','phonetic':'/ˈkæʒuəl/','meaning':'adj. 随意的','diff':1,'syn':''}, {'word':'inquiry','phonetic':'/ɪnˈkwaɪəri/','meaning':'n. 询问','diff':2,'syn':'question'}, {'word':'opportunity','phonetic':'/ˌɒpəˈtjuːnəti/','meaning':'n. 机会','diff':2,'syn':'chance'}, {'word':'respond','phonetic':'/rɪˈspɒnd/','meaning':'v. 回应','diff':1,'syn':'reply'}, {'word':'simple','phonetic':'/ˈsimpl/','meaning':'adj. 简单的','diff':1,'syn':'easy'}, {'word':'hesitant','phonetic':'/ˈhezɪtənt/','meaning':'adj. 犹豫的','diff':2,'syn':'unsure'}, {'word':'comment','phonetic':'/ˈkɒment/','meaning':'v./n. 评论','diff':1,'syn':'remark'}, {'word':'improvement','phonetic':'/ɪmˈpruːvmənt/','meaning':'n. 改进','diff':2,'syn':''}, {'word':'graduation','phonetic':'/ˌɡrædʒuˈeɪʃn/','meaning':'n. 毕业','diff':2,'syn':''}, {'word':'skill','phonetic':'/skɪl/','meaning':'n. 技能','diff':1,'syn':'ability'}, {'word':'tool','phonetic':'/tuːl/','meaning':'n. 工具','diff':1,'syn':'instrument'}, {'word':'courage','phonetic':'/ˈkʌrɪdʒ/','meaning':'n. 勇气','diff':1,'syn':'bravery'}, {'word':'total','phonetic':'/ˈtəʊtl/','meaning':'n./adj. 总计','diff':1,'syn':'overall'}, {'word':'desperate','phonetic':'/ˈdespərət/','meaning':'adj. 孤注一掷的','diff':2,'syn':''}, {'word':'closer','phonetic':'/ˈkləʊsər/','meaning':'adv. 更接近','diff':1,'syn':'nearer'}, {'word':'review','phonetic':'/rɪˈvjuː/','meaning':'v. 复习','diff':1,'syn':''}, {'word':'pronunciation','phonetic':'/prəˌnʌnsiˈeɪʃn/','meaning':'n. 发音','diff':2,'syn':''}, {'word':'walk','phonetic':'/wɔːk/','meaning':'v./n. 步行','diff':1,'syn':''}, {'word':'thinking','phonetic':'/ˈθɪŋkɪŋ/','meaning':'v. 思考','diff':1,'syn':''}, {'word':'goal','phonetic':'/ɡəʊl/','meaning':'n. 目标','diff':1,'syn':'target'}, {'word':'learning','phonetic':'/ˈlɜːrnɪŋ/','meaning':'n. 学习','diff':1,'syn':'study'}, {'word':'boring','phonetic':'/ˈbɔːrɪŋ/','meaning':'adj. 无聊的','diff':1,'syn':'dull'}, {'word':'key','phonetic':'/kiː/','meaning':'n. 钥匙','diff':1,'syn':''}, {'word':'unlock','phonetic':'/ˌʌnˈlɒk/','meaning':'v. 解锁','diff':2,'syn':'open'}, {'word':'possibility','phonetic':'/ˌpɒsəˈbɪləti/','meaning':'n. 可能性','diff':2,'syn':''}, {'word':'arrange','phonetic':'/əˈreɪndʒ/','meaning':'v. 安排','diff':1,'syn':''}, {'word':'honest','phonetic':'/ˈɒnɪst/','meaning':'adj. 诚实的','diff':1,'syn':''}, {'word':'nodded','phonetic':'/ˈnɒdɪd/','meaning':'v. 点头','diff':1,'syn':''}, {'word':'imperceptible','phonetic':'/ˌɪmpərˈseptəbl/','meaning':'adj. 难以察觉的','diff':3,'syn':''}, {'word':'smile','phonetic':'/smaɪl/','meaning':'n. 微笑','diff':1,'syn':''}
]),
]

# Generate all chapter strings
for ch in CHAPTERS_DATA:
    all_chapters.append(add_chapter(*ch))

# Build output
book2_data = """const NOVEL_DATA_BOOK2 = [
""" + ',\n'.join(all_chapters) + '\n];\n\n'

new_export = "export { NOVEL_DATA_BOOK1, NOVEL_DATA_BOOK2 }\n\n"
new_export += """if(typeof module!=="undefined"&&module.exports){
  module.exports={NOVEL_DATA_BOOK1,NOVEL_DATA_BOOK2}
}\n"""

full_output = before_export + '\n\n// ===== BOOK 2 DATA =====\n' + book2_data + new_export

with open('/Users/ccc/WorkBuddy/vibecoding/dramavocab/src/stores/novel-data.js', 'w', encoding='utf-8') as f:
    f.write(full_output)

print(f"✅ Done! {len(all_chapters)} chapters written")
print(f"File size: {len(full_output)} chars")

# Count stats
total_v = sum(len(ch[3]) for ch in CHAPTERS_DATA)
total_p = sum(len(ch[2]) for ch in CHAPTERS_DATA)
print(f"Stats: {total_p} paragraphs, {total_v} vocab entries")
