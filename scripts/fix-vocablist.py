#!/usr/bin/env python3
"""
修复 Book2 & Book3 缺失的 vocabList 数据 v2
==============================================
更可靠的注入方案：直接在每章的 paragraphs 闭合 ] 后插入 vocabList
"""

import re
import json
import sys

BOOK_JS_PATH = 'src/stores/book.js'

# ===== 完整词典 =====

BOOK2_DICT = {
    "acquisition": {"phonetic": "/ˌækwɪˈzɪʃn/", "meaning": "n. 收购；获得", "example": "The acquisition of the startup cost billions.", "difficulty": "intermediate"},
    "activate": {"phonetic": "/ˈæktɪveɪt/", "meaning": "v. 激活；启动", "example": "Please activate your account within 24 hours.", "difficulty": "beginner"},
    "allocate": {"phonetic": "/ˈæləkeɪt/", "meaning": "v. 分配；拨给", "example": "We need to allocate more resources to this project.", "difficulty": "intermediate"},
    "apprehensive": {"phonetic": "/ˌæprɪˈhensɪv/", "meaning": "adj. 担忧的；不安的", "example": "She felt apprehensive about the presentation.", "difficulty": "advanced"},
    "aroma": {"phonetic": "/əˈrəʊmə/", "meaning": "n. 香味；气息", "example": "The aroma of freshly brewed coffee filled the room.", "difficulty": "intermediate"},
    "assertive": {"phonetic": "/əˈsɜːtɪv/", "meaning": "adj. 坚定自信的；果敢的", "example": "You need to be more assertive in meetings.", "difficulty": "intermediate"},
    "aura": {"phonetic": "/ˈɔːrə/", "meaning": "n. 气氛；光环；气场", "example": "She has an aura of confidence about her.", "difficulty": "intermediate"},
    "bewildered": {"phonetic": "/bɪˈwɪldəd/", "meaning": "adj. 困惑的；不知所措的", "example": "He looked bewildered by the complex instructions.", "difficulty": "intermediate"},
    "bolt": {"phonetic": "/bəʊlt/", "meaning": "v. 冲出； n. 螺栓", "example": "She bolted out of the room when she heard the news.", "difficulty": "beginner"},
    "bonus": {"phonetic": "/ˈbəʊnəs/", "meaning": "n. 奖金；红利", "example": "Employees received a year-end bonus.", "difficulty": "beginner"},
    "brew": {"phonetic": "/bruː/", "meaning": "v. 冲泡（茶/咖啡）；酝酿", "example": "Let me brew you a fresh cup of coffee.", "difficulty": "beginner"},
    "bureaucracy": {"phonetic": "/bjʊˈrɒkrəsi/", "meaning": "n. 官僚主义；繁文缛节", "example": "The proposal was stuck in bureaucracy for months.", "difficulty": "advanced"},
    "cappuccino": {"phonetic": "/ˌkæpuˈtʃiːnəʊ/", "meaning": "n. 卡布奇诺咖啡", "example": "I'd like a cappuccino with extra foam, please.", "difficulty": "beginner"},
    "charisma": {"phonetic": "/kəˈrɪzmə/", "meaning": "n. 个人魅力；感召力", "example": "His natural charisma made him a great leader.", "difficulty": "intermediate"},
    "choreography": {"phonetic": "/ˌkɒriˈɒɡrəfi/", "meaning": "n. 编舞；舞蹈设计", "example": "The choreography of the dance was stunning.", "difficulty": "advanced"},
    "commute": {"phonetic": "/kəˈmjuːt/", "meaning": "v./n. 通勤；上下班往返", "example": "She commutes an hour each way to work.", "difficulty": "intermediate"},
    "compliment": {"phonetic": "/ˈkɒmplɪment/", "meaning": "v./n. 赞美；恭维", "example": "He complimented her on her excellent work.", "difficulty": "beginner"},
    "composed": {"phonetic": "/kəmˈpəʊzd/", "meaning": "adj. 镇静的；沉着的", "example": "She remained composed under pressure.", "difficulty": "intermediate"},
    "condescending": {"phonetic": "/ˌkɒndɪˈsendɪŋ/", "meaning": "adj. 居高临下的；摆架子的", "example": "His condescending tone annoyed everyone.", "difficulty": "advanced"},
    "configuration": {"phonetic": "/kənˌfɪɡjəˈreɪʃn/", "meaning": "n. 配置；布局", "example": "Check the server configuration before deploying.", "difficulty": "intermediate"},
    "conspicuous": {"phonetic": "/kənˈspɪkjuəs/", "meaning": "adj. 显而易见的；引人注目的", "example": "Her absence was conspicuous at the meeting.", "difficulty": "intermediate"},
    "crema": {"phonetic": "/ˈkreɪmə/", "meaning": "n. （意式浓缩咖啡上的）油脂层", "example": "A perfect espresso should have a golden crema on top.", "difficulty": "beginner"},
    "cubicle": {"phonetic": "/ˈkjuːbɪkl/", "meaning": "n. 小隔间（办公室工位）", "example": "He works in a tiny cubicle on the third floor.", "difficulty": "intermediate"},
    "deadline": {"phonetic": "/ˈdedlaɪn/", "meaning": "n. 截止日期", "example": "The project deadline is next Friday.", "difficulty": "beginner"},
    "discrepancy": {"phonetic": "/dɪsˈkrepənsi/", "meaning": "n. 不一致；差异", "example": "There's a discrepancy between the two reports.", "difficulty": "advanced"},
    "dismay": {"phonetic": "/dɪsˈmeɪ/", "meaning": "n./v. 惊愕；沮丧", "example": "To her dismay, the flight was cancelled.", "difficulty": "intermediate"},
    "distinctive": {"phonetic": "/dɪˈstɪŋktɪv/", "meaning": "adj. 独特的；有特色的", "example": "She has a distinctive voice that everyone recognizes.", "difficulty": "intermediate"},
    "espresso": {"phonetic": "/eˈspresəʊ/", "meaning": "n. 意式浓缩咖啡", "example": "I need a double espresso to wake up.", "difficulty": "beginner"},
    "exasperated": {"phonetic": "/ɪɡˈzæspəreɪtɪd/", "meaning": "adj. 恼火的；激怒的", "example": "She let out an exasperated sigh.", "difficulty": "intermediate"},
    "feasibility": {"phonetic": "/ˌfiːzəˈbɪləti/", "meaning": "n. 可行性", "example": "We need to conduct a feasibility study first.", "difficulty": "intermediate"},
    "fidget": {"phonetic": "/ˈfɪdʒɪt/", "meaning": "v. 坐立不安；摆弄", "example": "Stop fidgeting with your pen during the interview.", "difficulty": "intermediate"},
    "flatter": {"phonetic": "/ˈflætə(r)/", "meaning": "v. 奉承；讨好", "example": "He tried to flatter his boss to get a promotion.", "difficulty": "intermediate"},
    "fluorescent": {"phonetic": "/flʊəˈresnt/", "meaning": "adj. 荧光的；发亮的", "example": "The fluorescent lights in the office gave her a headache.", "difficulty": "intermediate"},
    "flustered": {"phonetic": "/ˈflʌstəd/", "meaning": "adj. 慌张的；手足无措的", "example": "She got flustered when asked unexpected questions.", "difficulty": "intermediate"},
    "framework": {"phonetic": "/ˈfreɪmwɜːk/", "meaning": "n. 框架；结构", "example": "We built the app on top of an existing framework.", "difficulty": "intermediate"},
    "glance": {"phonetic": "/ɡlɑːns/", "meaning": "v./n. 一瞥；扫视", "example": "She glanced at her watch and hurried away.", "difficulty": "beginner"},
    "grueling": {"phonetic": "/ˈɡruːəlɪŋ/", "meaning": "adj. 使人精疲力竭的", "example": "The training program was absolutely grueling.", "difficulty": "intermediate"},
    "hesitant": {"phonetic": "/ˈhezɪtənt/", "meaning": "adj. 犹豫的；迟疑的", "example": "He was hesitant to commit to the plan.", "difficulty": "intermediate"},
    "hierarchy": {"phonetic": "/ˈhaɪərɑːki/", "meaning": "n. 等级制度；层级", "example": "Every company has its own hierarchy.", "difficulty": "intermediate"},
    "immersive": {"phonetic": "/ɪˈmɜːsɪv/", "meaning": "adj. 身临其境的；沉浸式的", "example": "VR technology creates immersive gaming experiences.", "difficulty": "intermediate"},
    "implication": {"phonetic": "/ˌɪmplɪˈkeɪʃn/", "meaning": "n. 含义；暗示；可能的影响", "example": "What are the implications of this decision?", "difficulty": "intermediate"},
    "impulsive": {"phonetic": "/ɪmˈpʌlsɪv/", "meaning": "adj. 冲动的；鲁莽的", "example": "Don't make impulsive decisions that you'll regret.", "difficulty": "intermediate"},
    "inconspicuous": {"phonetic": "/ˌɪnkənˈspɪkjuəs/", "meaning": "adj. 不显眼的；低调的", "example": "She sat in an inconspicuous corner of the cafe.", "difficulty": "advanced"},
    "indignant": {"phonetic": "/ɪnˈdɪɡnənt/", "meaning": "adj. 义愤的；愤慨的", "example": "She became indignant at the unfair accusation.", "difficulty": "intermediate"},
    "interrogate": {"phonetic": "/ɪnˈterəɡeɪt/", "meaning": "v. 审问；质询", "example": "The police interrogated the suspect for hours.", "difficulty": "intermediate"},
    "intimidating": {"phonetic": "/ɪnˈtɪmɪdeɪtɪŋ/", "meaning": "adj. 令人畏惧的；咄咄逼人的", "example": "The boss can be quite intimidating at times.", "difficulty": "intermediate"},
    "intrigued": {"phonetic": "/ɪnˈtriːɡd/", "meaning": "adj. 好奇的；被吸引的", "example": "I was intrigued by his mysterious background.", "difficulty": "intermediate"},
    "leverage": {"phonetic": "/ˈliːvərɪdʒ/", "meaning": "v./n. 利用；杠杆作用", "example": "We should leverage our existing relationships.", "difficulty": "intermediate"},
    "linger": {"phonetic": "/ˈlɪŋɡə(r)/", "meaning": "v. 徘徊；逗留", "example": "She lingered at the door, reluctant to leave.", "difficulty": "intermediate"},
    "lurk": {"phonetic": "/lɜːk/", "meaning": "v. 潜伏；埋伏；潜水的", "example": "Danger lurks around every corner in this game.", "difficulty": "intermediate"},
    "mechanism": {"phonetic": "/ˈmekənɪzəm/", "meaning": "n. 机制；原理", "example": "We need to understand the mechanism behind this bug.", "difficulty": "intermediate"},
    "metadata": {"phonetic": "/ˈmetədeɪtə/", "meaning": "n. 元数据", "example": "The image contains metadata about when it was taken.", "difficulty": "intermediate"},
    "milestone": {"phonetic": "/ˈmaɪlstəʊn/", "meaning": "n. 里程碑；重要节点", "example": "Reaching one million users was a major milestone.", "difficulty": "intermediate"},
    "mortified": {"phonetic": "/ˈmɔːtɪfaɪd/", "meaning": "adj. 窘迫难堪的；无地自容的", "example": "She was mortified when she forgot his name.", "difficulty": "intermediate"},
    "mutter": {"phonetic": "/ˈmʌtə(r)/", "meaning": "v. 嘟囔；小声抱怨", "example": "He muttered something under his breath.", "difficulty": "intermediate"},
    "nonchalant": {"phonetic": "/ˈnɒnʃələnt/", "meaning": "adj. 漠不关心的；若无其事的", "example": "He acted nonchalant, but he was actually nervous inside.", "difficulty": "intermediate"},
    "notification": {"phonetic": "/ˌnəʊtɪfɪˈkeɪʃn/", "meaning": "n. 通知；提醒", "example": "You'll receive a notification when your order ships.", "difficulty": "beginner"},
    "oblivious": {"phonetic": "/əˈbliviəs/", "meaning": "adj. 未察觉的；不知不觉的", "example": "He was oblivious to the stares around him.", "difficulty": "intermediate"},
    "overtime": {"phonetic": "/ˈəʊvətaɪm/", "meaning": "n./adv. 加班；超时", "example": "She worked overtime to meet the deadline.", "difficulty": "beginner"},
    "pace": {"phonetic": "/peɪs/", "meaning": "n./v. 步速；节奏；踱步", "example": "The pace of innovation is accelerating.", "difficulty": "beginner"},
    "peer": {"phonetic": "/pɪə(r)/", "meaning": "n. 同龄人；同事 v. 凝视", "example": "She discussed the problem with her peers.", "difficulty": "beginner"},
    "penalty": {"phonetic": "/ˈpenəlti/", "meaning": "n. 处罚；罚款", "example": "There's a penalty for late payment.", "difficulty": "beginner"},
    "perceptive": {"phonetic": "/pəˈseptɪv/", "meaning": "adj. 敏锐的；有洞察力的", "example": "She's very perceptive about people's emotions.", "difficulty": "intermediate"},
    "perk": {"phonetic": "/pɜːk/", "meaning": "n. 特权；额外津贴；好处", "example": "Free gym membership is one of the job perks.", "difficulty": "intermediate"},
    "pleasant": {"phonetic": "/ˈpleznt/", "meaning": "adj. 令人愉快的；宜人的", "example": "What a pleasant surprise to see you here!", "difficulty": "beginner"},
    "proficiency": {"phonetic": "/prəˈfɪʃnsi/", "meaning": "n. 精通；熟练", "example": "She demonstrated proficiency in three languages.", "difficulty": "intermediate"},
    "progression": {"phonetic": "/prəˈɡreʃn/", "meaning": "n. 进展；进程；序列", "example": "The career progression at this company is clear.", "difficulty": "intermediate"},
    "protocol": {"phonetic": "/ˈprəʊtəkɒl/", "meaning": "n. 协议；礼仪规程", "example": "Follow the safety protocol strictly.", "difficulty": "intermediate"},
    "quarterly": {"phonetic": "/ˈkwɔːtli/", "meaning": "adj./adv. 季度的；每季", "example": "We have quarterly reviews with our manager.", "difficulty": "intermediate"},
    "quest": {"phonetic": "/kwest/", "meaning": "n./v. 探寻；追求；任务", "example": "Life is a quest for happiness and meaning.", "difficulty": "intermediate"},
    "resentment": {"phonetic": "/rɪˈzentmənt/", "meaning": "n. 怨恨；不满", "example": "She felt deep resentment toward her colleague.", "difficulty": "intermediate"},
    "resigned": {"phonetic": "/rɪˈzaɪnd/", "meaning": "adj. 顺从的；认命的 v. 辞职", "example": "He seemed resigned to his fate.", "difficulty": "intermediate"},
    "respawn": {"phonetic": "/riːˈspɔːn/", "meaning": "v. （游戏中）重生；刷新", "example": "After dying, you respawn at the last checkpoint.", "difficulty": "beginner"},
    "revenue": {"phonetic": "/ˈrevənjuː/", "meaning": "n. 收入；营收", "example": "Company revenue increased by 30% this year.", "difficulty": "intermediate"},
    "saucer": {"phonetic": "/ˈsɔːsə(r)/", "meaning": "n. 茶托；碟子", "example": "She placed the coffee cup on its saucer.", "difficulty": "beginner"},
    "scramble": {"phonetic": "/ˈskræmbl/", "meaning": "v. 争夺；匆忙行动；炒蛋", "example": "Everyone scrambled to get the best seats.", "difficulty": "intermediate"},
    "scrutinize": {"phonetic": "/skruːtənaɪz/", "meaning": "v. 仔细审查； scrutinize", "example": "The auditor will scrutinize every transaction.", "difficulty": "advanced"},
    "sensation": {"phonetic": "/senˈseɪʃn/", "meaning": "n. 感觉；轰动", "example": "The new product created a sensation in the market.", "difficulty": "intermediate"},
    "shrug": {"phonetic": "/ʃrʌɡ/", "meaning": "v./n. 耸肩", "example": "She shrugged off the criticism.", "difficulty": "beginner"},
    "sigh": {"phonetic": "/saɪ/", "meaning": "v./n. 叹气", "example": "He sighed deeply and closed the book.", "difficulty": "beginner"},
    "sip": {"phonetic": "/sɪp/", "meaning": "v./n. 小口喝；啜饮", "example": "She sipped her tea slowly while reading.", "difficulty": "beginner"},
    "skeptical": {"phonetic": "/ˈskeptɪkl/", "meaning": "adj. 怀疑的", "example": "I'm skeptical about his promises.", "difficulty": "intermediate"},
    "sprint": {"phonetic": "/sprɪnt/", "meaning": "v./n. 冲刺；全速跑", "example": "We're in the final sprint before launch.", "difficulty": "beginner"},
    "stakeholder": {"phonetic": "/ˈsteɪkhəʊldə(r)/", "meaning": "n. 利益相关者；股东", "example": "We need to consider all stakeholders' interests.", "difficulty": "intermediate"},
    "steam": {"phonetic": "/stiːm/", "meaning": "n. 蒸汽 v. 蒸；发怒", "example": "The room was steaming after the shower.", "difficulty": "beginner"},
    "stir": {"phonetic": "/stɜː(r)/", "meaning": "v. 搅拌；煽动；激起", "example": "Stir the mixture until it's smooth.", "difficulty": "beginner"},
    "strut": {"phonetic": "/strʌt/", "meaning": "v. 大摇大摆地走；昂首阔步", "example": "He strutted into the room like he owned it.", "difficulty": "intermediate"},
    "stumble": {"phonetic": "/ˈstʌmbl/", "meaning": "v. 绊倒；结巴", "example": "She stumbled over her words during the speech.", "difficulty": "beginner"},
    "subordinate": {"phonetic": "/səˈbɔːdɪnət/", "meaning": "n./adj. 下属；从属的", "example": "He treats his subordinates with respect.", "difficulty": "intermediate"},
    "synergy": {"phonetic": "/ˈsinədʒi/", "meaning": "n. 协同效应；增效", "example": "The merger created synergy between the two teams.", "difficulty": "intermediate"},
    "threshold": {"phonetic": "/ˈθreʃhəʊld/", "meaning": "n. 门槛；阈值", "example": "We've crossed the threshold of profitability.", "difficulty": "intermediate"},
    "tiptoe": {"phonetic": "/ˈtɪptəʊ/", "meaning": "v. 踮脚走；蹑手蹑脚", "example": "She tiptoed into the bedroom so as not to wake the baby.", "difficulty": "beginner"},
    "uneasy": {"phonetic": "/ʌnˈiːzi/", "meaning": "adj. 不安的；心神不宁的", "example": "She felt uneasy about the plan from the start.", "difficulty": "beginner"},
}

BOOK3_DICT = {
    "accomplice": {"phonetic": "/əˈkɒmplɪs/", "meaning": "n. 同谋；从犯", "example": "He was arrested as an accomplice to the crime.", "difficulty": "intermediate"},
    "acquisition": {"phonetic": "/ˌækwɪˈzɪʃn/", "meaning": "n. 收购；获得", "example": "The hostile acquisition shocked the entire industry.", "difficulty": "intermediate"},
    "acquittal": {"phonetic": "/əˈkwɪtl/", "meaning": "n. 宣判无罪", "example": "The jury returned a verdict of acquittal.", "difficulty": "advanced"},
    "adversary": {"phonetic": "/ˈædvəsəri/", "meaning": "n. 对手；敌手", "example": "She proved to be a formidable adversary in court.", "difficulty": "intermediate"},
    "allegation": {"phonetic": "/ˌæləˈɡeɪʃn/", "meaning": "n. 指控；声称", "example": "The allegations of fraud were denied by the company.", "difficulty": "intermediate"},
    "alliance": {"phonetic": "/əˈlaɪəns/", "meaning": "n. 联盟；联合", "example": "The two companies formed a strategic alliance.", "difficulty": "intermediate"},
    "ally": {"phonetic": "/ˈælaɪ/", "meaning": "n. 同盟者 v. 结盟", "example": "She found an unexpected ally in her rival.", "difficulty": "beginner"},
    "ambition": {"phonetic": "/æmˈbɪʃn/", "meaning": "n. 雄心；野心；抱负", "example": "Her ambition drove her to build an empire.", "difficulty": "beginner"},
    "anguish": {"phonetic": "/ˈæŋɡwɪʃ/", "meaning": "n. 极度痛苦；苦恼", "example": "She cried out in anguish when she heard the news.", "difficulty": "intermediate"},
    "ascend": {"phonetic": "/əˈsend/", "meaning": "v. 上升；攀登；登基", "example": "She ascended to the throne after her father's death.", "difficulty": "intermediate"},
    "asset": {"phonetic": "/ˈæset/", "meaning": "n. 资产；财产；有价值的人", "example": "Her experience is a valuable asset to the team.", "difficulty": "intermediate"},
    "attorney": {"phonetic": "/əˈtɜːni/", "meaning": "n. 律师；代理人", "example": "She hired the best attorney in the city.", "difficulty": "intermediate"},
    "authority": {"phonetic": "/ɔːˈθɒrəti/", "meaning": "n. 权威；当局；权力", "example": "The local authority approved the construction plan.", "difficulty": "intermediate"},
    "bankruptcy": {"phonetic": "/ˈbæŋkrʌptsi/", "meaning": "n. 破产", "example": "The company filed for bankruptcy protection.", "difficulty": "intermediate"},
    "barren": {"phonetic": "/ˈbærən/", "meaning": "adj. 贫瘠的；荒芜的", "example": "The barren land yielded nothing but dust.", "difficulty": "intermediate"},
    "betrayal": {"phonetic": "/bɪˈtreɪəl/", "meaning": "n. 背叛；出卖", "example": "She never recovered from the betrayal by her closest friend.", "difficulty": "intermediate"},
    "bleak": {"phonetic": "/bliːk/", "meaning": "adj. 黯淡的；凄凉的", "example": "The outlook looked bleak after the scandal broke.", "difficulty": "intermediate"},
    "boardroom": {"phonetic": "/ˈbɔːdrʊm/", "meaning": "n. 会议室；董事会办公室", "example": "The decision was made behind closed doors in the boardroom.", "difficulty": "intermediate"},
    "calculating": {"phonetic": "/ˈkælkjuleɪtɪŋ/", "meaning": "adj. 精于心计的；算计的", "example": "She's calculating — every move she makes is planned.", "difficulty": "intermediate"},
    "cold-blooded": {"phonetic": "/ˌkəʊld ˈblʌdɪd/", "meaning": "adj. 冷血的；残忍的", "example": "It was a cold-blooded murder that shocked the city.", "difficulty": "intermediate"},
    "collapse": {"phonetic": "/kəˈlæps/", "meaning": "v./n. 倒塌；崩溃", "example": "The negotiations collapsed after three weeks.", "difficulty": "beginner"},
    "concession": {"phonetic": "/kənˈseʃn/", "meaning": "n. 让步；特许权", "example": "Both sides had to make concessions to reach a deal.", "difficulty": "intermediate"},
    "confrontation": {"phonetic": "/ˌkɒnfrʌnˈteɪʃn/", "meaning": "n. 对抗；对峙", "example": "She tried to avoid a direct confrontation with him.", "difficulty": "intermediate"},
    "conglomerate": {"phonetic": "/kənˈɡlɒmərət/", "meaning": "n. 企业集团；聚合物", "example": "The conglomerate owns dozens of subsidiaries worldwide.", "difficulty": "advanced"},
    "conspiracy": {"phonetic": "/kənˈspɪrəsi/", "meaning": "n. 阴谋；共谋", "example": "They were charged with conspiracy to commit fraud.", "difficulty": "intermediate"},
    "convict": {"phonetic": "/kɒnvɪkt/ v. /kɒnvɪkt/ n.", "meaning": "v. 定罪 n. 囚犯", "example": "The jury convicted him on all charges.", "difficulty": "intermediate"},
    "crumble": {"phonetic": "/ˈkrʌmbl/", "meaning": "v. 崩溃；瓦解；碎裂", "example": "Her defenses crumbled when she saw the evidence.", "difficulty": "intermediate"},
    "deceive": {"phonetic": "/dɪˈsiːv/", "meaning": "v. 欺骗；蒙蔽", "example": "He deceived everyone with his charming facade.", "difficulty": "beginner"},
    "defiant": {"phonetic": "/dɪˈfaɪənt/", "meaning": "adj. 挑衅的；违抗的", "example": "She remained defiant even in the face of defeat.", "difficulty": "intermediate"},
    "desolate": {"phonetic": "/ˈdesələt/", "meaning": "adj. 荒凉的；孤独凄惨的", "example": "The mansion stood desolate and abandoned.", "difficulty": "intermediate"},
    "devastating": {"phonetic": "/ˈdevəsteɪtɪŋ/", "meaning": "adj. 毁灭性的；令人震惊的", "example": "The devastating news left everyone speechless.", "difficulty": "intermediate"},
    "dilapidated": {"phonetic": "/dɪˈlæpɪdeɪtɪd/", "meaning": "adj. 年久失修的；破旧的", "example": "They lived in a dilapidated old house.", "difficulty": "advanced"},
    "disguise": {"phonetic": "/dɪsˈɡaɪz/", "meaning": "v./n. 伪装；掩饰", "example": "She couldn't disguise her disappointment.", "difficulty": "intermediate"},
    "embezzlement": {"phonetic": "/ɪmˈbezlzmənt/", "meaning": "n. 贪污；挪用公款", "example": "He was arrested for embezzlement of company funds.", "difficulty": "advanced"},
    "emerge": {"phonetic": "/ɪmɜːdʒ/", "meaning": "v. 出现；浮现；显露", "example": "The truth finally emerged after years of silence.", "difficulty": "intermediate"},
    "encounter": {"phonetic": "/ɪnˈkaʊntə(r)/", "meaning": "v./n. 遭遇；邂逅", "example": "Their first encounter changed everything.", "difficulty": "intermediate"},
    "evidence": {"phonetic": "/ˈevɪdəns/", "meaning": "n. 证据；迹象", "example": "There is no evidence to support his claim.", "difficulty": "beginner"},
    "executive": {"phonetic": "/ɪɡˈzekjətɪv/", "meaning": "n./adj. 高管；执行的", "example": "The executive board made the final decision.", "difficulty": "intermediate"},
    "exonerate": {"phonetic": "/ɪɡˈzɒnəreɪt/", "meaning": "v. 宣布无罪；免除责任", "example": "New evidence helped exonerate the accused.", "difficulty": "advanced"},
    "exploit": {"phonetic": "/ɪkˈsplɔɪt/ v. /ˈeksplɔɪt/ n.", "meaning": "v. 利用；剥削 n. 功绩", "example": "They exploited his kindness for their own gain.", "difficulty": "intermediate"},
    "fabricate": {"phonetic": "/ˈfæbrɪkeɪt/", "meaning": "v. 编造；伪造；制造", "example": "He fabricated the whole story to cover his tracks.", "difficulty": "intermediate"},
    "formidable": {"phonetic": "/ˈfɔːmɪdəbl/", "meaning": "adj. 可怕的；令人敬畏的；强大的", "example": "She is a formidable opponent in any negotiation.", "difficulty": "intermediate"},
    "frame": {"phonetic": "/freɪm/", "meaning": "v. 陷害 n. 框架", "example": "He was framed for a crime he didn't commit.", "difficulty": "beginner"},
    "fraud": {"phonetic": "/frɔːd/", "meaning": "n. 欺诈；骗局", "example": "The company was investigated for securities fraud.", "difficulty": "intermediate"},
    "glimmer": {"phonetic": "/ˈɡlɪmə(r)/", "meaning": "n. 微光；一丝（希望）", "example": "A glimmer of hope appeared on the horizon.", "difficulty": "intermediate"},
    "grim": {"phonetic": "/ɡrɪm/", "meaning": "adj. 严峻的；冷酷的；令人沮丧的", "example": "The grim reality set in after the celebration ended.", "difficulty": "intermediate"},
    "ignite": {"phonetic": "/ɪɡˈnaɪt/", "meaning": "v. 点燃；激起", "example": "Her speech ignited a wave of change across the country.", "difficulty": "intermediate"},
    "impenetrable": {"phonetic": "/ɪmˈenɪtrəbl/", "meaning": "adj. 不能穿透的；难以理解的", "example": "His expression was impenetrable — no one could read him.", "difficulty": "advanced"},
    "impersonate": {"phonetic": "/ɪmˈpɜːsəneɪt/", "meaning": "v. 冒充；模仿", "example": "Someone tried to impersonate him to access his account.", "difficulty": "intermediate"},
    "incarceration": {"phonetic": "/ɪnˌkɑːrsəˈreɪʃn/", "meaning": "n. 监禁；关押", "example": "After ten years of incarceration, she was finally released.", "difficulty": "advanced"},
    "innocence": {"phonetic": "/ˈɪnəsns/", "meaning": "n. 无辜；天真", "example": "She maintained her innocence throughout the trial.", "difficulty": "beginner"},
    "insolvency": {"phonetic": "/ɪnˈsɒlvənsi/", "meaning": "n. 无力偿还；破产", "example": "The firm faced insolvency after the market crash.", "difficulty": "advanced"},
    "interrogation": {"phonetic": "/ɪnˌterəˈɡeɪʃn/", "meaning": "n. 审讯；询问", "example": "The interrogation lasted for six hours.", "difficulty": "intermediate"},
    "intimidate": {"phonetic": "/ɪnˈtɪmɪdeɪt/", "meaning": "v. 恐吓；威胁", "example": "Don't let anyone intimidate you into silence.", "difficulty": "intermediate"},
    "leverage": {"phonetic": "/ˈliːvərɪdʒ/", "meaning": "v./n. 利用；杠杆作用", "example": "She used the evidence as leverage in negotiations.", "difficulty": "intermediate"},
    "liability": {"phonetic": "/ˌlaɪəˈbɪləti/", "meaning": "n. 责任；负债；不利因素", "example": "The company's liabilities exceeded its assets.", "difficulty": "intermediate"},
    "luxurious": {"phonetic": "/lʌɡˈʒʊəriəs/", "meaning": "adj. 奢华的；豪华的", "example": "She stepped into the luxurious penthouse suite.", "difficulty": "intermediate"},
    "manipulate": {"phonetic": "/məˈnɪpjuleɪt/", "meaning": "v. 操纵；操控", "example": "He tried to manipulate public opinion through fake news.", "difficulty": "intermediate"},
    "masquerade": {"phonetic": "/ˌmæskəˈreɪd/", "meaning": "v./n. 化装；伪装；假装", "example": "His kindness was just a masquerade for his true intentions.", "difficulty": "advanced"},
    "merger": {"phonetic": "/mɜːdʒə(r)/", "meaning": "n. 合并；并购", "example": "The merger created the world's largest corporation.", "difficulty": "intermediate"},
    "monopoly": {"phonetic": "/məˈnɒpəli/", "meaning": "n. 垄断；专卖", "example": "The company holds a monopoly in this market.", "difficulty": "intermediate"},
    "negotiate": {"phonetic": "/nɪˈɡəʊʃieɪt/", "meaning": "v. 谈判；协商", "example": "They spent weeks negotiating the contract terms.", "difficulty": "intermediate"},
    "opportunist": {"phonetic": "/ˌɒpəˈtjuːnɪst/", "meaning": "n. 投机分子；机会主义者", "example": "He's an opportunist who takes advantage of every situation.", "difficulty": "intermediate"},
    "opulent": {"phonetic": "/ˈɒpjələnt/", "meaning": "adj. 富裕的；奢华的", "example": "The opulent banquet impressed all the guests.", "difficulty": "advanced"},
    "parole": {"phonetic": "/pəˈrəʊl/", "meaning": "n. 假释", "example": "He was granted parole after serving five years.", "difficulty": "intermediate"},
    "pigmentation": {"phonetic": "/ˌpɪɡmenˈteɪʃn/", "meaning": "n. 色素；色素沉着", "example": "Changes in skin pigmentation can indicate health issues.", "difficulty": "advanced"},
    "plot": {"phonetic": "/plɒt/", "meaning": "n. 阴谋；情节 v. 密谋", "example": "They discovered a plot against the CEO.", "difficulty": "beginner"},
    "prosecutor": {"phonetic": "/ˈprɒsɪkjuːtə(r)/", "meaning": "n. 检察官；公诉人", "example": "The prosecutor presented strong evidence to the jury.", "difficulty": "intermediate"},
    "rebuild": {"phonetic": "/riːˈbɪld/", "meaning": "v. 重建；重修", "example": "It took years to rebuild trust after the betrayal.", "difficulty": "beginner"},
    "redemption": {"phonetic": "/rɪˈdempʃn/", "meaning": "n. 救赎；赎回；挽回", "example": "She sought redemption for her past mistakes.", "difficulty": "intermediate"},
    "rehabilitate": {"phonetic": "/riːhəˈbɪlɪteɪt/", "meaning": "v. 使康复；使改过自新", "example": "The program aims to rehabilitate former prisoners.", "difficulty": "intermediate"},
    "relentless": {"phonetic": "/rɪˈlentləs/", "meaning": "adj. 不间断的；残酷无情的", "example": "Her relentless pursuit of justice inspired many.", "difficulty": "intermediate"},
    "resentment": {"phonetic": "/rɪˈzentmənt/", "meaning": "n. 怨恨；忿恨", "example": "Years of resentment finally boiled over.", "difficulty": "intermediate"},
    "resolute": {"phonetic": "/rezəluːt/", "meaning": "adj. 坚决的；果断的", "example": "She remained resolute despite the opposition.", "difficulty": "intermediate"},
    "reveal": {"phonetic": "/rɪˈviːl/", "meaning": "v. 揭露；透露；展示", "example": "The investigation revealed shocking truths.", "difficulty": "beginner"},
    "sabotage": {"phonetic": "/ˈsæbətɑːʒ/", "meaning": "v./n. 破坏；蓄意破坏", "example": "Someone sabotaged the computer systems.", "difficulty": "intermediate"},
    "scheme": {"phonetic": "/skiːm/", "meaning": "n. 阴谋；计划；方案", "example": "They uncovered a scheme to embezzle millions.", "difficulty": "intermediate"},
    "scrutinize": {"phonetic": "/skruːtənaɪz/", "meaning": "v. 仔细审查；详细检查", "example": "The auditors scrutinized every financial record.", "difficulty": "advanced"},
    "sentence": {"phonetic": "/ˈsentəns/", "meaning": "n. 判决 v. 判刑", "example": "The judge sentenced him to ten years in prison.", "difficulty": "beginner"},
    "shareholder": {"phonetic": "/ˈʃeəhəʊldə(r)/", "meaning": "n. 股东", "example": "Shareholders voted to approve the merger.", "difficulty": "intermediate"},
    "shattered": {"phonetic": "/ˈʃætəd/", "meaning": "adj. 破碎的；极度震惊的", "example": "She was shattered by the sudden loss.", "difficulty": "intermediate"},
    "showdown": {"phonetic": "/ˈʃəʊdaʊn/", "meaning": "n. 摊牌；决战；最后较量", "example": "The showdown between the rivals was inevitable.", "difficulty": "intermediate"},
    "spark": {"phonetic": "/spɑːk/", "meaning": "n./v. 火花；引发；触发", "example": "One small spark can start a revolution.", "difficulty": "beginner"},
    "stoic": {"phonetic": "/ˈstəʊɪk/", "meaning": "adj. 坚忍克己的；淡泊的", "example": "He remained stoic throughout the crisis.", "difficulty": "intermediate"},
    "subdue": {"phonetic": "/səbˈduː/", "meaning": "v. 制服；征服；抑制", "example": "It took three officers to subdue the suspect.", "difficulty": "intermediate"},
    "temper": {"phonetic": "/ˈtempə(r)/", "meaning": "n. 脾气；情绪 v. 调和", "example": "He has a terrible temper when things go wrong.", "difficulty": "beginner"},
    "testimony": {"phonetic": "/ˈtestɪməni/", "meaning": "n. 证词；见证", "example": "Her testimony proved crucial to the case.", "difficulty": "intermediate"},
    "torment": {"phonetic": "/tɔːment/", "meaning": "n./v. 折磨；痛苦", "example": "The memories continued to torment him for years.", "difficulty": "intermediate"},
    "transform": {"phonetic": "/trænsˈfɔːm/", "meaning": "v. 改变；转变；改造", "example": "The experience transformed her completely.", "difficulty": "intermediate"},
    "undermine": {"phonetic": "/ˌʌndəˈmaɪn/", "meaning": "v. 逐渐削弱；破坏", "example": "Rumors began to undermine his credibility.", "difficulty": "intermediate"},
    "undervaluation": {"phonetic": "/ˌʌndəˌvæljuˈeɪʃn/", "meaning": "n. 低估；估值过低", "example": "The undervaluation of the stock attracted investors.", "difficulty": "advanced"},
    "undisclosed": {"phonetic": "/ˌʌndɪsˈkləʊzd/", "meaning": "adj. 未披露的；保密的", "example": "The settlement amount remained undisclosed.", "difficulty": "intermediate"},
    "unmask": {"phonetic": "/ʌnˈmɑːsk/", "meaning": "v. 揭露；摘下面具", "example": "The detective managed to unmask the real culprit.", "difficulty": "intermediate"},
    "unwavering": {"phonetic": "/ʌnˈweɪvərɪŋ/", "meaning": "adj. 坚定不移的", "example": "Her unwavering determination inspired everyone around her.", "difficulty": "intermediate"},
    "vengeance": {"phonetic": "/ˈvendʒəns/", "meaning": "n. 复仇；报复", "example": "She swore vengeance on those who wronged her family.", "difficulty": "intermediate"},
    "verdict": {"phonetic": "/vɜːdɪkt/", "meaning": "n. 裁决；结论", "example": "The jury delivered a verdict of guilty.", "difficulty": "intermediate"},
    "witness": {"phonetic": "/ˈwɪtnəs/", "meaning": "n. 目击者；证人 v. 目睹", "example": "She was a key witness in the trial.", "difficulty": "beginner"},
}


def extract_words(text):
    return re.findall(r'data-word="([^"]+)"', text)


def build_vocab_list(words, dict_src):
    seen = set()
    result = []
    for w in words:
        if w not in seen:
            seen.add(w)
            entry = dict_src.get(w)
            if entry:
                result.append({
                    "word": w,
                    "phonetic": entry["phonetic"],
                    "meaning": entry["meaning"],
                    "example": entry["example"],
                    "difficulty": entry["difficulty"],
                    "synonyms": []
                })
            else:
                result.append({
                    "word": w,
                    "phonetic": "",
                    "meaning": "",
                    "example": "",
                    "difficulty": "unknown",
                    "synonyms": []
                })
    return result


def process_book(content, book_marker, dict_src, book_name):
    """为指定书籍注入 vocabList 到每一章"""
    print(f"\n{'='*60}")
    print(f"Processing {book_name}")
    print(f"{'='*60}")
    
    start = content.find(book_marker)
    if start == -1:
        print(f"ERROR: {book_marker} not found!")
        return content
    
    # 找书籍范围
    next_book = content.find('BOOK', start + len(book_marker) + 10)
    if next_book == -1:
        # 可能是最后一本书
        next_book = content.find('\nexport', start)
    if next_book == -1:
        next_book = len(content)
    
    book_section = content[start:next_book]
    
    # 找所有章节ID位置
    ch_ids = list(re.finditer(r"id:\s*'(ch\d+)'", book_section))
    print(f"Found {len(ch_ids)} chapters")
    
    total_spans = 0
    total_vocab = 0
    
    # 从后往前替换
    changes = []
    
    for i, match in enumerate(ch_ids):
        ch_abs_start = start + match.start()
        
        # 本章结束位置：下一个章节开始 或 书籍section结束
        if i + 1 < len(ch_ids):
            ch_abs_end = start + ch_ids[i+1].start()
        else:
            ch_abs_end = next_book
        
        ch_text = content[ch_abs_start:ch_abs_end]
        ch_id = match.group(1)
        
        words = extract_words(ch_text)
        total_spans += len(words)
        
        if not words:
            print(f"  {ch_id}: WARNING no spans found")
            continue
        
        vl = build_vocab_list(words, dict_src)
        total_vocab += len(vl)
        
        # 生成 vocabList JSON 字符串（带缩进）
        indent = '      '
        vl_json = json.dumps(vl, ensure_ascii=False, indent=6)
        lines = vl_json.split('\n')
        formatted_vl = ('\n' + indent).join(lines)
        
        # 如果已有 vocabList，替换它
        if 'vocabList' in ch_text:
            new_ch = re.sub(
                r'"vocabList"\s*:\s*\[[^\]]*\]',
                '"vocabList": ' + formatted_vl,
                ch_text
            )
        else:
            # 在 paragraphs 数组闭合后注入
            # 找最后一个 ],  后面跟着 \n    }
            # pattern: 最后一个 translation 字段后的 },\n      ]\n    }
            
            # 更可靠的方式：找到最后的 `]` 后面跟着 `\n    }`
            last_bracket_pos = ch_text.rfind('\n      ]')
            
            if last_bracket_pos > 0:
                # 在 `\n      ]` 后面插入 `,` 和 vocabList
                insert_pos = last_bracket_pos + len('\n      ]')
                
                new_ch = (ch_text[:insert_pos] +
                          ',\n' + indent + '"vocabList": ' + formatted_vl +
                          ch_text[insert_pos:])
            else:
                print(f"  {ch_id}: ERROR cannot find insertion point!")
                continue
        
        changes.append((ch_abs_start, ch_abs_end, new_ch))
        print(f"  {ch_id}: {len(words)} spans → {len(vl)} vocab entries")
    
    # 从后往前应用修改
    new_content = content
    for c_start, c_end, new_ch in reversed(changes):
        new_content = new_content[:c_start] + new_ch + new_content[c_end:]
    
    print(f"  Total: {total_spans} spans → {total_vocab} vocab entries")
    return new_content


def main():
    with open(BOOK_JS_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
    
    orig_size = len(content)
    
    # Process Book2
    content = process_book(content, 'BOOK2_DATA', BOOK2_DICT, 'Book2 NPC逆袭')
    
    # Process Book3
    content = process_book(content, 'BOOK3_DATA', BOOK3_DICT, 'Book3 女王归来')
    
    with open(BOOK_JS_PATH, 'w', encoding='utf-8') as f:
        f.write(content)
    
    new_size = len(content)
    print(f"\n✅ Done! {orig_size} → {new_size} bytes ({new_size-orig_size:+})")
    
    # Verify
    print("\n===== Verification =====")
    for name, marker, end_mark in [
        ('Book1', '', 'BOOK2_DATA'),
        ('Book2', 'BOOK2_DATA', 'BOOK3_DATA'),
        ('Book3', 'BOOK3_DATA', None),
    ]:
        s = content.find(marker) if marker else 0
        e = content.find(end_mark) if end_mark else len(content)
        section = content[s:e]
        vl = section.count('"vocabList"')
        dw = section.count('data-word=')
        print(f"{name}: {vl} chapters with vocabList, {dw} data-word spans")


if __name__ == '__main__':
    main()
