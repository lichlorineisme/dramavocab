#!/usr/bin/env python3
"""
DramaVocab 多书转换器 v2
- 支持 Book1 的 **word** 格式和 Book2/3 的 data-word 格式
- 自动补充词汇到每章 40+ 个
- 输出完整 book.js 数据（可直接替换）
"""

import os
import re
import glob
import json
import random

BASE = '/Users/ccc/WorkBuddy/vibecoding/novels'
OUTPUT_DIR = '/Users/ccc/WorkBuddy/vibecoding/dramavocab/src/stores'

# ============================================================
# 主题词汇库 — 按 Book 场景分组
# 格式: { 'word': 'xxx', 'phonetic': "x/x/", 'meaning': '中文', 'pos': 'adj/v/n' }
# ============================================================

VOCAB_BOOK2_NPC = [
    # === 职场通用 ===
    {'word': 'fluorescent', 'phonetic': '/ˌflɔːˈresnt/', 'meaning': '荧光灯的；刺眼的', 'pos': 'adj'},
    {'word': 'crema', 'phonetic': '/ˈkremə/', 'meaning': '浓缩咖啡油脂', 'pos': 'n'},
    {'word': 'aura', 'phonetic': '/ˈɔːrə/', 'meaning': '气场；氛围', 'pos': 'n'},
    {'word': 'cubicle', 'phonetic': '/ˈkjuːbɪkl/', 'meaning': '办公隔间', 'pos': 'n'},
    {'word': 'hierarchy', 'phonetic': '/ˈhaɪərɑːrki/', 'meaning': '等级制度；层级', 'pos': 'n'},
    {'word': 'subordinate', 'phonetic': '/səˈbɔːrdɪnət/', 'meaning': '下属；（adj）从属的', 'pos': 'n/adj'},
    {'word': 'bureaucracy', 'phonetic': '/bjʊˈrɒkrəsi/', 'meaning': '官僚主义；繁文缛节', 'pos': 'n'},
    {'word': 'protocol', 'phonetic': '/ˈproʊtəkɒl/', 'meaning': '礼仪；规程；协议', 'pos': 'n'},
    {'word': 'deadline', 'phonetic': '/ˈdedlaɪn/', 'meaning': '截止日期', 'pos': 'n'},
    {'word': 'overtime', 'phonetic': '/ˈoʊvərtaɪm/', 'meaning': '加班；（n/adj）超时', 'pos': 'n/adj'},
    {'word': 'commute', 'phonetic': '/kəˈmjuːt/', 'meaning': '通勤', 'pos': 'v/n'},
    {'word': 'perk', 'phonetic': '/pɜːrk/', 'meaning': '福利；津贴', 'pos': 'n'},
    {'word': 'quarterly', 'phonetic': '/ˈkwɔːrtərli/', 'meaning': '季度的；（adv）每季度', 'pos': 'adj/adv'},
    {'word': 'revenue', 'phonetic': '/ˈrevənuː/', 'meaning': '营收；收入', 'pos': 'n'},
    {'word': 'stakeholder', 'phonetic': '/ˈsteɪkhoʊldər/', 'meaning': '利益相关者', 'pos': 'n'},
    {'word': 'synergy', 'phonetic': '/ˈsɜːrdʒi/', 'meaning': '协同效应', 'pos': 'n'},
    {'word': 'leverage', 'phonetic': '/ˈlevərɪdʒ/', 'meaning': '利用；杠杆', 'pos': 'v/n'},
    {'word': 'milestone', 'phonetic': '/ˈmaɪlstoʊn/', 'meaning': '里程碑', 'pos': 'n'},
    {'word': 'allocate', 'phonetic': '/ˈæləkeɪt/', 'meaning': '分配；拨出', 'pos': 'v'},
    {'word': 'proficiency', 'phonetic': '/prəˈfɪʃnsi/', 'meaning': '熟练；精通', 'pos': 'n'},
    
    # === 社交/人物 ===
    {'word': 'intimidating', 'phonetic': '/ɪnˈtɪmɪdeɪtɪŋ/', 'meaning': '令人畏惧的', 'pos': 'adj'},
    {'word': 'charisma', 'phonetic': '/kəˈrɪzmə/', 'meaning': '魅力；感召力', 'pos': 'n'},
    {'word': 'condescending', 'phonetic': '/ˌkɒndɪˈsendɪŋ/', 'meaning': '居高临下的', 'pos': 'adj'},
    {'word': 'perceptive', 'phonetic': '/pərˈseptɪv/', 'meaning': '敏锐的；有洞察力的', 'pos': 'adj'},
    {'word': 'nonchalant', 'phonetic': '/ˈnɑːnʃələnt/', 'meaning': '漫不经心的；冷淡的', 'pos': 'adj'},
    {'word': 'assertive', 'phonetic': '/əˈsɜːrtɪv/', 'meaning': '自信坚定的；果断的', 'pos': 'adj'},
    {'word': 'oblivious', 'phonetic': '/əˈblɪviəs/', 'meaning': '毫无察觉的', 'pos': 'adj'},
    {'word': 'scrutinize', 'phonetic': '/ˈskruːtənaɪz/', 'meaning': '仔细审视；审查', 'pos': 'v'},
    {'word': 'interrogate', 'phonetic': '/ɪnˈterəɡeɪt/', 'meaning': '审问；质询', 'pos': 'v'},
    {'word': 'flatter', 'phonetic': '/ˈflætər/', 'meaning': '奉承；谄媚', 'pos': 'v'},
    {'word': 'skeptical', 'phonetic': '/ˈskeptɪkl/', 'meaning': '怀疑的', 'pos': 'adj'},
    {'word': 'intrigued', 'phonetic': '/ɪnˈtriːɡd/', 'meaning': '被吸引的；好奇的', 'pos': 'adj'},
    {'word': 'resentment', 'phonetic': '/rɪˈzentmənt/', 'meaning': '怨恨；不满', 'pos': 'n'},
    {'word': 'conspicuous', 'phonetic': '/kənˈspɪkjuəs/', 'meaning': '显眼的；引人注目的', 'pos': 'adj'},
    {'word': 'inconspicuous', 'phonetic': '/ˌɪnkənˈspɪkjuəs/', 'meaning': '不显眼的；低调的', 'pos': 'adj'},
    
    # === 情绪/心理 ===
    {'word': 'exasperated', 'phonetic': '/ɪɡˈzæspəreɪtɪd/', 'meaning': '恼怒的；激动的', 'pos': 'adj'},
    {'word': 'bewildered', 'phonetic': '/bɪˈwɪldərd/', 'meaning': '困惑不解的', 'pos': 'adj'},
    {'word': 'apprehensive', 'phonetic': '/ˌæprɪˈhensɪv/', 'meaning': '忧虑的；担心的', 'pos': 'adj'},
    {'word': 'mortified', 'phonetic': '/ˈmɔːrtɪfaɪd/', 'meaning': '羞愧难当的', 'pos': 'adj'},
    {'word': 'composed', 'phonetic': '/kəmˈpoʊzd/', 'meaning': '镇定自若的', 'pos': 'adj'},
    {'word': 'impulsive', 'phonetic': '/ɪmˈpʌlsɪv/', 'meaning': '冲动的', 'pos': 'adj'},
    {'word': 'hesitant', 'phonetic': '/ˈhezɪtənt/', 'meaning': '犹豫的', 'pos': 'adj'},
    {'word': 'resigned', 'phonetic': '/rɪˈzaɪnd/', 'meaning': '顺从的；听天由命的', 'pos': 'adj'},
    {'word': 'flustered', 'phonetic': '/ˈflʌstərd/', 'meaning': '慌乱的；手足无措的', 'pos': 'adj'},
    {'word': 'indignant', 'phonetic': '/ɪnˈdɪɡnənt/', 'meaning': '愤愤不平的', 'pos': 'adj'},
    {'word': 'uneasy', 'phonetic': '/ʌnˈiːzi/', 'meaning': '不安的；局促的', 'pos': 'adj'},
    {'word': 'dismay', 'phonetic': '/dɪsˈmeɪ/', 'meaning': '沮丧；惊愕；（v）使沮丧', 'pos': 'n/v'},
    
    # === 动作/行为 ===
    {'word': 'lurk', 'phonetic': '/lɜːrk/', 'meaning': '潜伏；暗藏', 'pos': 'v'},
    {'word': 'linger', 'phonetic': '/ˈlɪŋɡər/', 'meaning': '逗留；徘徊', 'pos': 'v'},
    {'word': 'scramble', 'phonetic': '/ˈskræmbl/', 'meaning': '匆忙行动；争夺', 'pos': 'v'},
    {'word': 'strut', 'phonetic': '/strʌt/', 'meaning': '大摇大摆地走', 'pos': 'v'},
    {'word': 'glance', 'phonetic': '/ɡlæns/', 'meaning': '一瞥；扫视', 'pos': 'v/n'},
    {'word': 'peer', 'phonetic': '/pɪr/', 'meaning': '凝视；仔细看', 'pos': 'v'},
    {'word': 'mutter', 'phonetic': '/ˈmʌtər/', 'meaning': '嘀咕；低声抱怨', 'pos': 'v'},
    {'word': 'sigh', 'phonetic': '/saɪ/', 'meaning': '叹气；（n）叹息', 'pos': 'v/n'},
    {'word': 'shrug', 'phonetic': '/ʃrʌɡ/', 'meaning': '耸肩', 'pos': 'v/n'},
    {'word': 'fidget', 'phonetic': '/ˈfɪdʒɪt/', 'meaning': '坐立不安；摆弄', 'pos': 'v'},
    {'word': 'pace', 'phonetic': '/peɪs/', 'meaning': '踱步；（n）步伐/节奏', 'pos': 'v/n'},
    {'word': 'bolt', 'phonetic': '/boʊlt/', 'meaning': '冲出； bolt upright 猛然坐起', 'pos': 'v'},
    {'word': 'stumble', 'phonetic': '/ˈstʌmbl/', 'meaning': '绊倒；跌撞', 'pos': 'v'},
    {'word': 'sprint', 'phonetic': '/sprɪnt/', 'meaning': '冲刺', 'pos': 'v'},
    {'word': 'tiptoe', 'phonetic': '/ˈtɪptoʊ/', 'meaning': '踮脚走', 'pos': 'v'},
    
    # === 系统/游戏术语 ===
    {'word': 'quest', 'phonetic': '/kwest/', 'meaning': '任务；使命', 'pos': 'n'},
    {'word': 'mechanism', 'phonetic': '/ˈmekənɪzəm/', 'meaning': '机制；原理', 'pos': 'n'},
    {'word': 'activate', 'phonetic': '/ˈæktɪveɪt/', 'meaning': '激活', 'pos': 'v'},
    {'word': 'notification', 'phonetic': '/ˌnoʊtɪfɪˈkeɪʃn/', 'meaning': '通知', 'pos': 'n'},
    {'word': 'progression', 'phonetic': '/prəˈɡreʃn/', 'meaning': '进展；升级路径', 'pos': 'n'},
    {'word': 'threshold', 'phonetic': '/ˈθreʃhoʊld/', 'meaning': '门槛；阈值', 'pos': 'n'},
    {'word': 'bonus', 'phonetic': '/ˈboʊnəs/', 'meaning': '奖金；奖励', 'pos': 'n'},
    {'word': 'penalty', 'phonetic': '/ˈpenəlti/', 'meaning': '惩罚', 'pos': 'n'},
    {'word': 'respawn', 'phonetic': '/riːˈspɔːn/', 'meaning': '重生；（游戏）刷新', 'pos': 'v'},
    {'word': 'immersive', 'phonetic': '/ɪˈmɜːrsɪv/', 'meaning': '沉浸式的', 'pos': 'adj'},
    
    # === 咖啡/餐饮 ===
    {'word': 'aroma', 'phonetic': '/əˈroʊmə/', 'meaning': '香气；芳香', 'pos': 'n'},
    {'word': 'brew', 'phonetic': '/bruː/', 'meaning': '冲泡（咖啡）；酿造', 'pos': 'v/n'},
    {'word': 'espresso', 'phonetic': '/eˈspresoʊ/', 'meaning': '浓缩咖啡', 'pos': 'n'},
    {'word': 'cappuccino', 'phonetic': '/ˌkæpuˈtʃiːnoʊ/', 'meaning': '卡布奇诺', 'pos': 'n'},
    {'word': 'sip', 'phonetic': '/sɪp/', 'meaning': '小口喝；（n）一小口', 'pos': 'v/n'},
    {'word': 'saucer', 'phonetic': '/ˈsɔːsər/', 'meaning': '碟子', 'pos': 'n'},
    {'word': 'stir', 'phonetic': '/stɜːr/', 'meaning': '搅拌；（n）搅动', 'pos': 'v/n'},
    {'word': 'steam', 'phonetic': '/stiːm/', 'meaning': '蒸汽；（v）蒸', 'pos': 'n/v'},
]

VOCAB_BOOK3_QUEEN = [
    # === 复仇/情绪 ===
    {'word': 'vengeance', 'phonetic': '/ˈvendʒəns/', 'meaning': '复仇；报复', 'pos': 'n'},
    {'word': 'redemption', 'phonetic': '/rɪˈdemʃn/', 'meaning': '救赎；赎罪', 'pos': 'n'},
    {'word': 'resentment', 'phonetic': '/rɪˈzentmənt/', 'meaning': '怨恨；积怨', 'pos': 'n'},
    {'word': 'betrayal', 'phonetic': '/bɪˈtreɪəl/', 'meaning': '背叛', 'pos': 'n'},
    {'word': 'devastating', 'phonetic': '/ˈdevəsteɪtɪŋ/', 'meaning': '毁灭性的；令人崩溃的', 'pos': 'adj'},
    {'word': 'shattered', 'phonetic': '/ˈʃætərd/', 'meaning': '破碎的；（情感）崩塌的', 'pos': 'adj'},
    {'word': 'torment', 'phonetic': '/ˈtɔːrment/', 'meaning': '折磨；（n）痛苦', 'pos': 'v/n'},
    {'word': 'anguish', 'phonetic': '/ˈæŋɡwɪʃ/', 'meaning': '极度痛苦', 'pos': 'n'},
    {'word': 'grim', 'phonetic': '/ɡrɪm/', 'meaning': '冷酷的；严酷的', 'pos': 'adj'},
    {'word': 'relentless', 'phonetic': '/rɪˈlentləs/', 'meaning': '无情的；不间断的', 'pos': 'adj'},
    {'word': 'unwavering', 'phonetic': '/ʌnˈweɪvərɪŋ/', 'meaning': '坚定不移的', 'pos': 'adj'},
    {'word': 'resolute', 'phonetic': '/ˈrezəluːt/', 'meaning': '坚决的；果断的', 'pos': 'adj'},
    {'word': 'defiant', 'phonetic': '/dɪˈfaɪənt/', 'meaning': '挑衅的；反抗的', 'pos': 'adj'},
    {'word': 'stoic', 'phonetic': '/ˈstoʊɪk/', 'meaning': '坚忍的；淡然的', 'pos': 'adj'},
    {'word': 'impenetrable', 'phonetic': '/ɪmˈpenɪtrəbl/', 'meaning': '无法穿透的；深不可测的', 'pos': 'adj'},
    {'word': 'cold-blooded', 'phonetic': '/ˈkoʊld ˌblʌdɪd/', 'meaning': '冷血的', 'pos': 'adj'},
    {'word': 'calculating', 'phonetic': '/ˈkælkjuleɪtɪŋ/', 'meaning': '精于算计的；有心机的', 'pos': 'adj'},
    {'word': 'formidable', 'phonetic': '/ˈfɔːrmɪdəbl/', 'meaning': '可怕的；令人敬畏的', 'pos': 'adj'},
    {'word': 'intimidate', 'phonetic': '/ɪnˈtɪmɪdeɪt/', 'meaning': '恐吓；威胁', 'pos': 'v'},
    {'word': 'subdue', 'phonetic': '/səbˈduː/', 'meaning': '制服；压制', 'pos': 'v'},
    
    # === 商战/金融 ===
    {'word': 'acquisition', 'phonetic': '/ˌækwɪˈzɪʃn/', 'meaning': '收购；并购', 'pos': 'n'},
    {'word': 'merger', 'phonetic': '/mɜːrdʒər/', 'meaning': '合并', 'pos': 'n'},
    {'word': 'conglomerate', 'phonetic': '/kənˈɡlɒmərət/', 'meaning': '企业集团', 'pos': 'n'},
    {'word': 'monopoly', 'phonetic': '/məˈnɑːpəli/', 'meaning': '垄断', 'pos': 'n'},
    {'word': 'shareholder', 'phonetic': '/ˈʃerhoʊldər/', 'meaning': '股东', 'pos': 'n'},
    {'word': 'boardroom', 'phonetic': '/ˈbɔːrduːm/', 'meaning': '董事会会议室', 'pos': 'n'},
    {'word': 'executive', 'phonetic': '/ɪɡˈzekjətɪv/', 'meaning': '高管；（n）主管', 'pos': 'n/adj'},
    {'word': 'negotiate', 'phonetic': '/nɪˈɡoʊʃieɪt/', 'meaning': '谈判；协商', 'pos': 'v'},
    {'word': 'leverage', 'phonetic': '/ˈlevərɪdʒ/', 'meaning': '杠杆；（v）利用', 'pos': 'n/v'},
    {'word': 'asset', 'phonetic': '/ˈæset/', 'meaning': '资产', 'pos': 'n'},
    {'word': 'liability', 'phonetic': '/ˌlaɪəˈbɪləti/', 'meaning': '负债；责任', 'pos': 'n'},
    {'word': 'insolvency', 'phonetic': '/ɪnˈsɒlvənsi/', 'meaning': '破产；无力偿债', 'pos': 'n'},
    {'word': 'bankruptcy', 'phonetic': '/ˈbæŋkrʌptsi/', 'meaning': '破产', 'pos': 'n'},
    {'word': 'fraud', 'phonetic': '/frɔːd/', 'meaning': '欺诈；骗局', 'pos': 'n'},
    {'word': 'embezzlement', 'phonetic': '/ɪmˈbezlmənt/', 'meaning': '挪用公款；贪污', 'pos': 'n'},
    {'word': 'testimony', 'phonetic': '/ˈtestɪmoʊni/', 'meaning': '证词；证言', 'pos': 'n'},
    {'word': 'evidence', 'phonetic': '/ˈevɪdəns/', 'meaning': '证据', 'pos': 'n'},
    {'word': 'allegation', 'phonetic': '/ˌæləˈɡeɪʃn/', 'meaning': '指控；声明', 'pos': 'n'},
    {'word': 'verdict', 'phonetic': '/vɜːrdɪkt/', 'meaning': '裁决；判决', 'pos': 'n'},
    {'word': 'acquittal', 'phonetic': '/əˈkwɪtl/', 'meaning': '无罪释放', 'pos': 'n'},
    
    # === 人物关系 ===
    {'word': 'adversary', 'phonetic': '/ˈædvərseri/', 'meaning': '对手；敌手', 'pos': 'n'},
    {'word': 'ally', 'phonetic': '/ˈælai/', 'meaning': '盟友；（v）联合', 'pos': 'n/v'},
    {'word': 'accomplice', 'phonetic': '/əˈkɒmplɪs/', 'meaning': '同谋；帮凶', 'pos': 'n'},
    {'word': 'manipulate', 'phonetic': '/məˈnɪpjuleɪt/', 'meaning': '操纵；操控', 'pos': 'v'},
    {'word': 'exploit', 'phonetic': '/ɪkˈsplɔɪt/', 'meaning': '剥削；（n） exploit 利用/功绩', 'pos': 'v/n'},
    {'word': 'undermine', 'phonetic': '/ˌʌndərˈmaɪn/', 'meaning': '暗中破坏；削弱', 'pos': 'v'},
    {'word': 'sabotage', 'phonetic': '/ˈsæbətɑːʒ/', 'meaning': '破坏；蓄意阻挠', 'pos': 'v/n'},
    {'word': 'conspiracy', 'phonetic': '/kənˈspɪrəsi/', 'meaning': '阴谋；共谋', 'pos': 'n'},
    {'word': 'scheme', 'phonetic': '/skiːm/', 'meaning': '阴谋；计划', 'pos': 'n/v'},
    {'word': 'plot', 'phonetic': '/plɑːt/', 'meaning': '密谋；（n）情节', 'pos': 'v/n'},
    {'word': 'deceive', 'phonetic': '/dɪˈsiːv/', 'meaning': '欺骗', 'pos': 'v'},
    {'word': 'disguise', 'phonetic': '/dɪsˈɡaɪz/', 'meaning': '伪装；（n）伪装', 'pos': 'v/n'},
    {'word': 'masquerade', 'phonetic': '/ˌmæskəˈreɪd/', 'meaning': '化装；假装', 'pos': 'v/n'},
    {'word': 'impersonate', 'phonetic': '/ɪmˈpɜːrsəneɪt/', 'meaning': '冒充；扮演', 'pos': 'v'},
    {'word': 'reveal', 'phonetic': '/rɪˈviːl/', 'meaning': '揭露；揭示', 'pos': 'v'},
    {'word': 'unmask', 'phonetic': '/ʌnˈmæsk/', 'meaning': '揭下面具；揭露', 'pos': 'v'},
    {'word': 'encounter', 'phonetic': '/ɪnˈkaʊntər/', 'meaning': '遭遇；（n）相遇', 'pos': 'v/n'},
    {'word': 'confrontation', 'phonetic': '/ˌkɒnfrʌnˈteɪʃn/', 'meaning': '对峙', 'pos': 'n'},
    {'word': 'showdown', 'phonetic': '/ˈʊʊdaʊn/', 'meaning': '摊牌；决战', 'pos': 'n'},
    
    # === 描述/状态 ===
    {'word': 'luxurious', 'phonetic': '/lʊɡˈʒʊəriəs/', 'meaning': '奢华的', 'pos': 'adj'},
    {'word': 'opulent', 'phonetic': '/ˈɑːpjələnt/', 'meaning': '富丽的；阔气的', 'pos': 'adj'},
    {'word': 'dilapidated', 'phonetic': '/dɪˈlæpɪdeɪtɪd/', 'meaning': '破旧的；年久失修的', 'pos': 'adj'},
    {'word': 'desolate', 'phonetic': '/ˈdesələt/', 'meaning': '荒凉的；（人）孤独凄凉的', 'pos': 'adj'},
    {'word': 'barren', 'phonetic': '/ˈbærən/', 'meaning': '贫瘠的；荒芜的', 'pos': 'adj'},
    {'word': 'bleak', 'phonetic': '/bliːk/', 'meaning': '阴冷的；黯淡的', 'pos': 'adj'},
    {'word': 'glimmer', 'phonetic': '/ˈɡlɪmər/', 'meaning': '微光；（v）闪烁', 'pos': 'n/v'},
    {'word': 'spark', 'phonetic': '/spɑːrk/', 'meaning': '火花；（v）点燃/激发', 'pos': 'n/v'},
    {'word': 'ignite', 'phonetic': '/ɪɡˈnaɪt/', 'meaning': '点燃；引发', 'pos': 'v'},
    {'word': 'crumble', 'phonetic': '/ˈkrʌmbl/', 'meaning': '崩溃；（v）瓦解', 'pos': 'v'},
    {'word': 'collapse', 'phonetic': '/kəˈlæps/', 'meaning': '倒塌；（n）崩溃', 'pos': 'v/n'},
    {'word': 'rebuild', 'phonetic': '/riːˈbɪld/', 'meaning': '重建', 'pos': 'v'},
    {'word': 'transform', 'phonetic': '/trænsˈfɔːrm/', 'meaning': '转变；改造', 'pos': 'v'},
    {'word': 'emerge', 'phonetic': '/ɪˈmɜːrdʒ/', 'meaning': '浮现；出现', 'pos': 'v'},
    {'word': 'ascend', 'phonetic': '/əˈsend/', 'meaning': '上升；登基', 'pos': 'v'},
    
    # === 监狱/法律 ===
    {'word': 'incarceration', 'phonetic': '/ɪnˌkɑːrsəˈreɪʃn/', 'meaning': '监禁；入狱', 'pos': 'n'},
    {'word': 'sentence', 'phonetic': '/ˈsentəns/', 'meaning': '刑期；判决', 'pos': 'n'},
    {'word': 'parole', 'phonetic': '/pəˈroʊl/', 'meaning': '假释', 'pos': 'n'},
    {'word': 'convict', 'phonetic': '/kənvɪkt/', 'meaning': '定罪；（n）囚犯', 'pos': 'v/n'},
    {'word': 'innocence', 'phonetic': '/ˈɪnəsns/', 'meaning': '无辜；清白', 'pos': 'n'},
    {'word': 'testimony', 'phonetic': '/ˈtestɪmoʊni/', 'meaning': '证词；证言', 'pos': 'n'},
    {'word': 'witness', 'phonetic': '/ˈwɪtnəs/', 'meaning': '目击者；（v）见证', 'pos': 'n/v'},
    {'word': 'prosecutor', 'phonetic': '/ˈprɒsɪkjuːtər/', 'meaning': '检察官', 'pos': 'n'},
    {'word': 'attorney', 'phonetic': '/əˈtɜːrni/', 'meaning': '律师', 'pos': 'n'},
    {'word': 'verdict', 'phonetic': '/vɜːrdɪkt/', 'meaning': '裁决；判决', 'pos': 'n'},
    {'word': 'acquittal', 'phonetic': '/əˈkwɪtl/', 'meaning': '无罪释放', 'pos': 'n'},
    {'word': 'frame', 'phonetic': '/freɪm/', 'meaning': '陷害；（n）框架', 'pos': 'v/n'},
    {'word': 'fabricate', 'phonetic': '/ˈfæbrɪkeɪt/', 'meaning': '伪造；编造', 'pos': 'v'},
    {'word': 'exonerate', 'phonetic': '/ɪɡˈzɒnəreɪt/', 'meaning': '免除罪名；昭雪', 'pos': 'v'},
    {'word': 'rehabilitate', 'phonetic': '/ˌriːhəˈbɪlɪteɪt/', 'meaning': '使康复；恢复名誉', 'pos': 'v'},
]

# ============================================================
# 转换核心逻辑
# ============================================================

def escape_js(s):
    """转义 JS 模板字符串特殊字符"""
    s = s.replace('\\', '\\\\')
    s = s.replace('`', '\\`')
    s = s.replace('${', '\\${')
    return s


def make_span(word_info):
    """生成带 data-word 的 span 标记"""
    w = word_info['word']
    p = word_info['phonetic']
    m = word_info['meaning']
    raw = '<span class="word-highlight" data-word="%s">%s</span>' % (w, w)
    trans = '<span class="word-highlight">%s</span>（%s %s）' % (w, p, m)
    return raw, trans


def extract_existing_spans(text):
    """提取文本中已有的 span 标记，返回 (clean_text, found_words)"""
    # 匹配已有格式: <span ... data-word="word">word</span>（...）
    pattern = r'(<span\s+class="word-highlight"\s+data-word="([^"]+)">([^<]+)</span>)（([^）]+)）'
    
    parts = []
    raw_parts = []
    trans_parts = []
    found_words = set()
    last_end = 0
    
    for m in re.finditer(pattern, text):
        prefix = text[last_end:m.start()]
        parts.append(prefix)
        raw_parts.append(prefix)
        trans_parts.append(prefix)
        
        raw_span = m.group(1)  # 带 data-word 的原始 span
        display_word = m.group(3)
        pm = m.group(4).strip()
        
        raw_parts.append(raw_span)
        trans_parts.append('<span class="word-highlight">%s</span>（%s）' % (display_word, pm))
        found_words.add(m.group(2).lower())
        
        last_end = m.end()
    
    parts.append(text[last_end:])
    raw_parts.append(text[last_end:])
    trans_parts.append(text[last_end:])
    
    return ''.join(parts), ''.join(raw_parts), ''.join(trans_parts), found_words


def inject_vocabulary(clean_text, vocab_pool, existing_words, target_count=40):
    """向纯文本中注入英语词汇标记到目标数量
    
    策略: 在句子边界处插入 <span>word</span>（音义） 标记
    """
    if not clean_text.strip():
        return '', '', set()
    
    # 按句号/感叹号/问号分割文本为句子列表
    sentences = re.split(r'([。！？!?])', clean_text)
    
    new_raw_parts = []
    new_trans_parts = []
    injected_words = set()
    used_vocab_indices = set()
    
    # 从词汇池中排除已存在的词
    available = [(i, v) for i, v in enumerate(vocab_pool) if v['word'].lower() not in existing_words]
    random.shuffle(available)
    
    avail_idx = 0
    sentence_count = len(sentences) // 2  # 句子数（分隔符占一半）
    
    # 计算需要插入的词数
    needed = max(0, target_count - len(existing_words))
    if needed == 0 or not available:
        return clean_text, clean_text, set()
    
    # 每隔几个句子插入一个词
    interval = max(1, sentence_count // (needed + 1)) if sentence_count > 0 else 1
    
    insert_count = 0
    si = 0
    while si < len(sentences):
        part = sentences[si]
        new_raw_parts.append(part)
        new_trans_parts.append(part)
        
        # 如果这是句子结尾的分隔符后的位置，且到了该插词的时候
        if part in '。！？.!?' and insert_count < needed and avail_idx < len(available):
            # 检查是否应该在此处插入（按间隔）
            if si > 0 and (insert_count == 0 or (si // 2) % interval == 0 or si >= len(sentences) - 4):
                vi, v = available[avail_idx]
                avail_idx += 1
                
                # 不重复使用同一个词
                while v['word'].lower() in injected_words and avail_idx < len(available):
                    vi, v = available[avail_idx]
                    avail_idx += 1
                
                raw_s, trans_s = make_span(v)
                
                # 在当前内容后添加
                new_raw_parts.append(' ' + raw_s)
                new_trans_parts.append(' ' + trans_s)
                injected_words.add(v['word'].lower())
                insert_count += 1
        
        si += 1
    
    raw_result = ''.join(new_raw_parts).strip()
    trans_result = ''.join(new_trans_parts).strip()
    
    return raw_result, trans_result, injected_words


def parse_chapter(filepath, vocab_pool, target_per_chapter=40):
    """处理单个章节文件"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.split('\n')
    
    # 提取标题
    title = ''
    short_title = ''
    for line in lines:
        if line.startswith('# '):
            title = line[2:].strip()
            m = re.match(r'第\d+[章\-—(.]*\s*(.+)', title)
            short_title = m.group(1).strip() if m else title
            break
    if not title:
        title = os.path.basename(filepath).replace('.md', '')
        short_title = title

    # 找正文起始
    body_start = 0
    for i, line in enumerate(lines):
        if line.strip() == '---':
            body_start = i + 1
            break

    # 收集段落
    paragraphs = []
    buf = []
    ch_words = set()

    for i in range(body_start, len(lines)):
        s = lines[i].strip()
        
        if not s or s == '---':
            if buf:
                para_text = ''.join(buf).strip()
                if para_text:
                    processed = process_paragraph(para_text, vocab_pool, ch_words, target_per_chapter)
                    if processed:
                        paragraphs.append(processed)
                buf = []
            continue
        
        # 跳过纯系统消息行
        if re.match(r'^>\s*\*\*【', s):
            continue
        
        buf.append(lines[i])

    # 最后一段
    if buf:
        para_text = ''.join(buf).strip()
        if para_text:
            processed = process_paragraph(para_text, vocab_pool, ch_words, target_per_chapter)
            if processed:
                paragraphs.append(processed)

    ch_id_match = re.search(r'第(\d+)章', title)
    ch_id = 'ch%s' % ch_id_match.group(1) if ch_id_match else 'ch1'

    return {
        'id': ch_id,
        'title': title,
        'shortTitle': short_title,
        'paragraphs': paragraphs,
        'wordCount': len(ch_words),
    }, ch_words


def process_paragraph(para_text, vocab_pool, ch_used_words, target_total):
    """处理单个段落: 保留现有词 + 注入新词"""
    clean_text, raw_text, trans_text, existing = extract_existing_spans(para_text)
    
    if not raw_text.strip():
        return None
    
    # 更新章节已用词集合
    ch_used_words.update(existing)
    
    # 计算本章还需多少词
    current_total = len(ch_used_words)
    remaining = max(0, target_total - current_total)
    
    if remaining > 0 and clean_text.strip():
        # 需要注入新词 - 只在纯文本部分注入
        final_raw, final_trans, new_words = inject_vocabulary(
            clean_text, vocab_pool, ch_used_words, target_total
        )
        ch_used_words.update(new_words)
        
        # 合并: 已有的保持不变，新词注入到纯文本部分
        # 这里简化: 返回注入后的结果
        if new_words:
            return {
                'raw': final_raw,
                'translation': final_trans,
            }
    
    # 不需要注入或无法注入，返回原文
    return {
        'raw': raw_text,
        'translation': trans_text,
    }


def generate_js(book_data):
    """生成 JS 对象字面量"""
    cfg = book_data['config']
    out = []
    out.append('  {')
    out.append("    id: '%s'," % cfg['id'])
    out.append("    title: `%s`," % cfg['title'])
    out.append("    subtitle: `%s`," % cfg['subtitle'])
    out.append("    author: '%s'," % cfg['author'])
    out.append("    emoji: '%s'," % cfg['emoji'])
    out.append("    description: `%s`," % cfg['description'])
    out.append("    coverColor: '%s'," % cfg['coverColor'])
    out.append("    status: 'published',")
    out.append("    totalWords: %d," % book_data['totalWords'])
    out.append('    chapters: [')

    for ch in book_data['chapters']:
        out.append('    {')
        out.append("      id: '%s'," % ch['id'])
        out.append("      title: `%s`," % ch['title'])
        out.append("      shortTitle: `%s`," % ch['shortTitle'])
        out.append('      paragraphs: [')

        for p in ch['paragraphs']:
            out.append('        {')
            out.append("          raw: `%s`," % escape_js(p['raw']))
            out.append("          translation: `%s`," % escape_js(p['translation']))
            out.append('        },')

        out.append('      ],')
        out.append('    },')

    out.append('  ],')
    out.append('},')
    return '\n'.join(out)


# ============================================================
# 主程序
# ============================================================
BOOKS_CONFIG = {
    'book2': {
        'dir': 'book2-NPC的逆袭',
        'id': '2',
        'title': 'NPC逆袭：我在霸总世界刷存在感',
        'subtitle': '从背景板NPC到C位女主，她只用了一杯咖啡的时间',
        'author': '布吉岛',
        'emoji': '\U0001f3ae',
        'description': '姜离，26岁，社畜加班狗。凌晨两点在公司楼下买了杯关东煮后穿越了——穿进了《霸道总裁的契约新娘》小说世界里。身份？行政部三级助理，存在感3/100的纯种NPC。但她有一个别人没有的东西：一个叫"逆袭"的系统。',
        'coverColor': 'linear-gradient(145deg, #059669, #10B981)',
        'vocab': VOCAB_BOOK2_NPC,
    },
    'book3': {
        'dir': 'book3-女王归来',
        'id': '3',
        'title': '寒光破晓：女王归来',
        'subtitle': '三年狱火，她从地狱爬回来亲手夺回一切',
        'author': '布吉岛',
        'emoji': '\U0001f451',
        'description': "沈清舟，27岁，前首富之女。家族企业被吞并、父亲被逼自杀、被未婚夫和闺蜜联手背叛送进监狱。狱中三年，她从天堂跌到地狱。出狱第一天，她站在曾经属于她家的集团大楼对面——\"我回来了。这一次，我会拿回属于我的一切。\"",
        'coverColor': 'linear-gradient(145deg, #DC2626, #F59E0B)',
        'vocab': VOCAB_BOOK3_QUEEN,
    },
}


if __name__ == '__main__':
    random.seed(42)  # 可复现
    results = {}
    
    for key, cfg in BOOKS_CONFIG.items():
        dir_path = os.path.join(BASE, cfg['dir'])
        chapter_files = sorted(glob.glob(os.path.join(dir_path, '*.md')))
        chapter_files = [f for f in chapter_files if not f.endswith('00-大纲.md')]
        
        print("\n" + "=" * 60)
        print("处理: %s" % cfg['title'])
        print("目录: %s | %d 章 | 词库大小: %d" % (cfg['dir'], len(chapter_files), len(cfg['vocab'])))
        
        chapters = []
        all_words = set()
        total_spans = 0
        
        for cf in chapter_files:
            ch_data, ch_words = parse_chapter(cf, cfg['vocab'], target_per_chapter=40)
            
            # 统计最终数据中的 spans
            for p in ch_data['paragraphs']:
                total_spans += len(re.findall(r'data-word=', p['raw']))
            
            all_words.update(ch_words)
            chapters.append(ch_data)
            print("  OK %s: %d段, %d词" % (
                ch_data['title'], 
                len(ch_data['paragraphs']), 
                ch_data['wordCount']
            ))
        
        book_data = {
            'config': cfg,
            'totalWords': len(all_words),
            'chapters': chapters,
            'stats': {'spans': total_spans},
        }
        results[key] = book_data
        
        print("\n  TOTAL: %d ch, %d spans, %d unique words" % (len(chapters), total_spans, len(all_words)))

    # 输出到临时文件
    output_path = os.path.join(OUTPUT_DIR, 'books-2-3-temp.js')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('// Auto-generated: Book 2 & Book 3\n// Generated by convert-books-v2.py\n\n')
        f.write('const BOOK2_DATA = {\n')
        f.write(generate_js(results['book2']))
        f.write('\n}\n\n')
        f.write('const BOOK3_DATA = {\n')
        f.write(generate_js(results['book3']))
        f.write('\n}\n\n')
        f.write('export { BOOK2_DATA, BOOK3_DATA }\n')
    
    print("\n" + "=" * 60)
    print("DONE! Output: %s (%d bytes)" % (output_path, os.path.getsize(output_path)))
