#!/usr/bin/env python3
"""
Parse NPC逆袭 PDF → novel-data.js format (NOVEL_DATA_BOOK2)
Extracts: chapter text + word(meaning) pairs → builds vocabList with real phonetic/meaning/difficulty
"""

import re, json

# Read extracted PDF text
with open('/tmp/npc_novel_raw.txt', 'r', encoding='utf-8') as f:
    full_text = f.read()

# ===== Step 1: Split into chapters =====
ch_pattern = re.compile(
    r'第\s*(\d+)\s*章[：:]\s*(.+?)\n状态：待入库.*?核心词汇数[：:]\s*(\d+).*?模式[：:]\s*(.+?)\n',
    re.DOTALL
)

chapter_matches = list(ch_pattern.finditer(full_text))
print(f"Found {len(chapter_matches)} chapters")

# ===== Step 2: For each chapter, extract body text and vocabList placeholder =====
# The structure per chapter is:
#   [header line]
#   [body text with word(释义) embedded]
#   【底层数据库 vocabList-chXX】
#   [JSON array of placeholder vocab entries]

ch_data = []
for i, m in enumerate(chapter_matches):
    ch_num = m.group(1)
    ch_title = m.group(2).strip()
    vocab_count = int(m.group(3))
    
    # Find where this chapter's content ends and next begins
    start = m.end()
    if i + 1 < len(chapter_matches):
        end = chapter_matches[i + 1].start()
    else:
        end = len(full_text)
    
    ch_body = full_text[start:end].strip()
    
    # Separate body from vocabList JSON
    vl_marker = '【底层数据库'
    if vl_marker in ch_body:
        parts = ch_body.split(vl_marker, 1)
        body_text = parts[0].strip()
        vl_text = vl_marker + parts[1]
    else:
        body_text = ch_body
        vl_text = ''
    
    ch_data.append({
        'num': ch_num,
        'title': ch_title,
        'vocab_count': vocab_count,
        'body': body_text,
        'vl_raw': vl_text
    })
    print(f"  Ch{ch_num}: {ch_title} | declared vocab: {vocab_count} | body chars: {len(body_text)}")

# ===== Step 3: Extract word(释义) pairs from body text =====
# Pattern: word(n./v./adj./adv. 释义) or word(释义)
word_re = re.compile(r'\b([a-zA-Z][a-zA-Z\'\-]*(?:\s+[a-zA-Z][a-zA-Z\'\-]*)?)\((?:[nvadj]\.\s*)?(.+?)\)')

# Comprehensive phonetic dictionary for common vocabulary
PHONETIC_DB = {
    # Ch1-5: Basic workplace/bottom-tier life (CET-4)
    'mansion': '/ˈmænʃn/', 'insignificant': '/ˌɪnsɪɡˈnɪfɪkənt/', 'servant': '/ˈsɜːvənt/',
    'script': '/skrɪpt/', 'collision': '/kəˈlɪʒn/', 'clumsy': '/ˈklʌmzi/',
    'scandal': '/ˈskændl/', 'identity': '/aɪˈdentəti/', 'curious': '/ˈkjʊəriəs/',
    'glance': '/ɡlɑːns/', 'luxury': '/ˈlʌkʃəri/', 'obedient': '/əˈbiːdiənt/',
    'routine': '/ruːˈtiːn/', 'whisper': '/ˈwɪspər/', 'hesitate': '/ˈhezɪteɪt/',
    'panic': '/ˈpænɪk/', 'stumble': '/ˈstʌmbl/', 'embarrassing': '/ɪmˈbærəsɪŋ/',
    'determined': '/dɪˈtɜːmɪnd/', 'courage': '/ˈkʌrɪdʒ/', 'transform': '/trænsˈfɔːrm/',
    'opportunity': '/ˌɒpəˈtjuːnəti/', 'challenge': '/ˈtʃælɪndʒ/', 'overcome': '/ˌəʊvəˈkʌm/',
    'confidence': '/ˈkɒnfɪdəns/', 'potential': '/pəˈtenʃl/', 'invisible': '/ɪnˈvɪzəbl/',
    'observe': '/əbˈzɜːrv/', 'intention': '/ɪnˈtenʃn/', 'genuine': '/ˈdʒenjuɪn/',
    'appreciate': '/əˈpriːʃieɪt/', 'struggle': '/ˈstrʌɡl/', 'patience': '/ˈpeɪʃns/',
    'grateful': '/ˈɡreɪtfl/', 'resilience': '/rɪˈzɪliəns/', 'destiny': '/ˈdestəni/',
    # Ch2-5: More workplace basics
    'spill': '/spɪl/', 'stain': '/steɪn/', 'apologize': '/əˈpɒlədʒaɪz/',
    'compensation': '/ˌkɒmpenˈseɪʃn/', 'arrogant': '/ˈærəɡənt/', 'condescending': '/ˌkɒndɪˈsendɪŋ/',
    'humiliate': '/hjuːˈmilieɪt/', 'composure': '/kəmˈpəʊʒər/', 'dignity': '/ˈdɪɡnəti/',
    'negotiate': '/nɪˈɡəʊʃieɪt/', 'compromise': '/ˈkɒmprəmaɪz/', 'authority': '/ɔːˈθɒrəti/',
    'subordinate': '/səˈbɔːdɪnət/', 'hierarchy': '/ˈhaɪərɑːrki/', 'protocol': '/ˈprəʊtɒkɒl/',
    'procedure': '/prəˈsiːdʒər/', 'deadline': '/ˈdedlaɪn/', 'efficient': '/ɪˈfɪʃnt/',
    'productive': '/prəˈdʌktɪv/', 'initiative': '/ɪˈnɪʃətɪv/', 'responsibility': '/rɪˌspɒnsəˈbɪləti/',
    'accountability': '/əˌkaʊntəˈbɪləti/', 'collaborate': '/kəˈlæbəreɪt/', 'coordinate': '/kəʊˈɔːdɪneɪt/',
    'prioritize': '/praɪˈɒrɪtaɪz/', 'delegate': '/ˈdelɪɡeɪt/', 'supervise': '/ˈsuːpəvaɪz/',
    'evaluate': '/ɪˈvæljueɪt/', 'performance': '/pəˈfɔːrməns/', 'promotion': '/prəˈməʊʃn/',
    'demotion': '/diːˈməʊʃn/', 'resignation': '/ˌrezɪɡˈneɪʃn/', 'termination': '/ˌtɜːmɪˈneɪʃn/',
    # Ch6-12: Social games, crisis, banquet (CET-6/IELTS)
    'manipulate': '/məˈnɪpjuleɪt/', 'scheme': '/skiːm/', 'conspiracy': '/kənˈspɪrəsi/',
    'intrigue': '/ɪnˈtriːɡ/', 'betrayal': '/bɪˈtreɪəl/', 'alliance': '/əˈlaɪəns/',
    'rivalry': '/ˈraɪvlri/', 'dominance': '/ˈdɒmɪnəns/', 'submissive': '/səbˈmɪsɪv/',
    'assertive': '/əˈsɜːtɪv/', 'charismatic': '/ˌkærɪzˈmætɪk/', 'eloquent': '/ˈeləkwənt/',
    'articulate': '/ɑːˈtɪkjuleɪt/', 'persuasive': '/pəˈsweɪsɪv/', 'diplomatic': '/ˌdɪpləˈmætɪk/',
    'tactful': '/ˈtæktfl/', 'discreet': '/dɪˈskriːt/', 'cautious': '/ˈkɔːʃəs/',
    'reckless': '/ˈrekləs/', 'impulsive': '/ɪmˈpʌlsɪv/', 'calculating': '/ˈkælkjuleɪtɪŋ/',
    'cunning': '/ˈkʌnɪŋ/', 'deceitful': '/diːˈsiːtlfl/', 'transparent': '/trænsˈpærənt/',
    'ambiguous': '/æmˈbɪɡjuəs/', 'contradictory': '/ˌkɒntrəˈdɪktəri/', 'hypocritical': '/ˌhɪpəˈkrɪtɪkl/',
    'banquet': '/ˈbaŋkwɪt/', 'ceremony': '/ˈserɪməni/', 'etiquette': '/ˈetɪket/',
    'prestige': '/preˈstiːʒ/', 'reputation': '/ˌrepjuˈteɪʃn/', 'scandalous': '/ˈskændələs/',
    'outrageous': '/aʊtˈreɪdʒəs/', 'unacceptable': '/ˌʌnəkˈseptəbl/', 'intolerable': '/ɪnˈtɒlərəbl/',
    'catastrophic': '/ˌkætəˈstrɒfɪk/', 'devastating': '/ˈdevəsteɪtɪŋ/', 'irrecoverable': '/ˌɪrɪˈkʌvərəbl/',
    # Ch13-20: Power reversal, finance, ultimate showdown (IELTS/TOEFL advanced)
    'leverage': '/ˈliːvərɪdʒ/', 'acquisition': '/ˌækwɪˈzɪʃn/', 'merger': '/mɜːrdʒər/',
    'subsidiary': '/səbˈsɪdiəri/', 'conglomerate': '/kənˈɡlɒmərət/', 'shareholder': '/ˈʃeərhəʊldər/',
    'stakeholder': '/ˈsteɪkhəʊldər/', 'boardroom': '/bɔːdrʊm/', 'executive': '/ɪɡˈzekjətɪv/',
    'chairman': '/ˈtʃeəmən/', 'CEO': '/ˌsiːiːˈoʊ/', 'CFO': '/ˌsiːefˈoʊ/',
    'revenue': '/ˈrevənjuː/', 'profitability': '/ˌprɒfɪtəˈbɪləti/', 'liquidity': '/lɪˈkwɪdəti/',
    'solvent': '/ˈsɒlvənt/', 'bankrupt': '/ˈbæŋkrʌpt/', 'foreclosure': '/fɔːˈkləʊʒər/',
    'portfolio': '/pɔːrtˈfəʊlioʊ/', 'asset': '/ˈæset/', 'liability': '/ˌlaɪəˈbɪləti/',
    'equity': '/ˈekwəti/', 'dividend': '/ˈdɪvɪdend/', 'stockholder': '/ˈstɒkhəʊldər/',
    'investment': '/ɪnˈvestmənt/', 'venture': '/ˈventʃər/', 'capital': '/ˈkæpɪtl/',
    'monopoly': '/məˈnɒpəli/', 'oligopoly': '/ˌɒlɪˈɡɒpəli/', 'cartel': '/kɑːrˈtel/',
    'regulation': '/ˌreɡjuˈleɪʃn/', 'compliance': '/kəmˈplaɪəns/', 'audit': '/ˈɔːdɪt/',
    'litigation': '/ˌlɪtɪˈɡeɪʃn/', 'jurisdiction': '/ˌdʒʊərɪsˈdɪkʃn/', 'verdict': '/vɜːrdɪkt/',
    'sovereign': '/ˈsɒvrɪn/', 'autonomous': '/ɔːˈtɒnəməs/', 'unprecedented': '/ʌnˈpresɪdentɪd/',
    'revolutionary': '/ˌrevəˈluːʃəneri/', 'paradigm': '/ˈpærədaɪm/', 'synergy': '/ˈsɪərdʒi/',
    'strategic': '/strəˈtiːdʒik/', 'tactic': '/ˈtæktɪk/', 'maneuver': '/məˈnuːvər/',
    'dominate': '/ˈdɒmɪneɪt/', 'overthrow': '/ˌəʊvəˈθrəʊ/', 'usurp': '/juːˈzɜːrp/',
    'consolidate': '/kənˈsɒlɪdeɪt/', 'dismantle': '/dɪsˈmæntl/', 'eradicate': '/ɪˈrædɪkeɪt/',
    'obliterate': '/əˈblɪtəreɪt/', 'annihilate': '/əˈnaɪəleɪt/', 'triumphant': '/traɪˈʌmfənt/',
    'invincible': '/ɪnˈvɪnsəbl/', 'omnipotent': '/ɒmˈnɪpətənt/', 'supreme': '/suːˈpriːm/',
    'ultimate': '/ˈʌltɪmət/', 'transcendent': '/trænˈsendənt/', 'inevitable': '/ɪnˈevɪtəbl/',
    'immutable': '/ɪˈmjuːtəbl/', 'indisputable': '/ˌɪndɪˈspjuːtəbl/', 'unquestionable': '/ʌnˈkwestʃənəbl/',
    # Additional common words for this novel
    'awaken': '/əˈweɪkən/', 'consciousness': '/ˈkɒnʃəsnəs/', 'dimension': '/daɪˈmenʃn/',
    'realm': '/relm/', 'fiction': '/ˈfɪkʃn/', 'narrative': '/ˈnærətɪv/', 'protagonist': '/prəʊˈtæɡənɪst/',
    'antagonist': '/ænˈtæɡənɪst/', 'supporting': '/səˈpɔːtɪŋ/', 'character': '/ˈkærəktər/',
    'dialogue': '/ˈdaɪəlɒɡ/', 'monologue': '/ˈmɒnəlɒɡ/', 'improvise': '/ˈɪmprəvaɪz/',
    'rehearse': '/rɪˈhɜːrs/', 'audition': '/ɔːˈdɪʃn/', 'casting': '/ˈkɑːstɪŋ/',
    'director': '/daɪˈrektər/', 'producer': '/prəˈduːsər/', 'screenplay': '/ˈskriːnpleɪ/',
    'blockbuster': '/ˈblɒkbʌstər/', 'premiere': '/priˈmɪər/', 'sequel': '/ˈsiːkwəl/',
    'franchise': '/ˈfrænʃaɪz/', 'copyright': '/ˈkɒpiraɪt/', 'royalty': '/ˈrɔɪəlti/',
    'exclusive': '/ɪkˈskuːsɪv/', 'premium': '/ˈpriːmiəm/', 'luxurious': '/lʌɡˈʒʊəriəs/',
    'extravagant': '/ɪkˈstrævəɡənt/', 'ostentatious': '/ˌɒstenˈteɪʃəs/', 'lavish': '/ˈlævɪʃ/',
    'modest': '/ˈmɒdɪst/', 'humble': '/ˈhʌmbl/', 'grounded': '/ˈɡraʊndɪd/', 'realistic': '/ˌriːəˈlɪstɪk/',
    'idealistic': '/ˌaɪdiəˈlɪstɪk/', 'optimistic': '/ˌɒptɪˈmɪstɪk/', 'pessimistic': '/ˌpesɪˈmɪstɪk/',
    'cynical': '/ˈsɪnɪkl/', 'skeptical': '/ˈskeptɪkl/', 'pragmatic': '/præɡˈmætɪk/',
}

def get_phonetic(word):
    """Get phonetic from DB or generate generic one"""
    key = word.lower().strip()
    if key in PHONETIC_DB:
        return PHONETIC_DB[key]
    return f'/{" ".join([c for c in key if c.isalpha()])}/'

def get_difficulty(word, meaning):
    """Determine difficulty based on word complexity and meaning"""
    w = word.lower()
    # Advanced indicators
    advanced_suffixes = ('tion', 'sion', 'ment', 'ness', 'ity', 'ance', 'ence', 'ure', 'ical', 'ical')
    long_words = len(w) > 9
    academic_markers = any(m in meaning.lower() for m in ['金融', '法律', '权力', '战略', '商业', '投资', '并购'])
    
    if long_words or academic_markers or any(w.endswith(s) for s in advanced_suffixes[:6]):
        return 3  # advanced
    elif len(w) > 6:
        return 2  # intermediate
    return 1  # beginner

def clean_meaning(m):
    """Clean up meaning string"""
    m = m.strip()
    # Remove trailing punctuation issues
    if m.endswith('。') or m.endswith('.'):
        m = m[:-1]
    # Fix common patterns
    m = re.sub(r'^[nvadj]\.\s*', '', m)  # Remove leading pos tags like "n." "v."
    return m.strip()

# ===== Step 4: Build output data =====
output_chapters = []

for ch in ch_data:
    body = ch['body']
    
    # Extract word(meaning) pairs
    matches = word_re.findall(body)
    
    # Also try pattern without parentheses for words that might use different format
    # Some might be: mansion(n. 豪宅)
    
    # Deduplicate while preserving order
    seen = set()
    vocab_list = []
    for word, meaning in matches:
        w = word.strip()
        m = clean_meaning(meaning)
        
        if not w or not m or len(w) < 2:
            continue
        if w.lower() in seen:
            continue
            
        seen.add(w.lower())
        vocab_list.append({
            'word': w,
            'phonetic': get_phonetic(w),
            'meaning': m,
            'ex': '',  # Will fill from context later if needed
            'diff': get_difficulty(w, m),
            'syn': ''
        })
    
    # Clean body text - remove (释义) annotations but keep English words
    # Replace word(释义) with just word (keeping the English word in Chinese text)
    clean_body = body
    # We want to keep the English words as-is (they're already naturally embedded)
    # Just remove the parenthetical definitions
    clean_body = re.sub(r'\((?:[nvadj]\.\s*)?.+?\)', '', clean_body)
    # Remove [此处省略...] markers  
    clean_body = re.sub(r'\[此处省略[^\]]*\]', '', clean_body)
    # Clean up extra whitespace
    clean_body = re.sub(r'\s+', ' ', clean_body).strip()
    
    # Build paragraphs from the body (split by sentence-ending punctuation + newlines)
    paragraphs = []
    # Try splitting on Chinese punctuation that indicates paragraph breaks
    raw_paras = re.split(r'[！？。\n]+', clean_body)
    for p in raw_paras:
        p = p.strip()
        if len(p) > 10:  # Only keep substantial paragraphs
            paragraphs.append({
                'raw': p,
                'tr': re.sub(r'\b([A-Za-z][A-Za-z\'\-]*(?:\s+[A-Za-z][A-Za-z\'\-]*)?)\b', r'[\1]', p)
            })
    
    if not paragraphs:
        # Fallback: put entire body as one paragraph
        paragraphs.append({
            'raw': clean_body,
            'tr': re.sub(r'\b([A-Za-z][A-Za-z\'\-]*(?:\s+[A-Za-z][A-Za-z\'\-]*)?)\b', r'[\1]', clean_body)
        })
    
    output_chapters.append({
        'id': f"ch{ch['num'].zfill(2)}",
        'title': ch['title'],
        'para': paragraphs,
        'vl': vocab_list
    })
    
    print(f"\nCh{ch['num']}: {ch['title']}")
    print(f"  Body: {len(clean_body)} chars | Paragraphs: {len(paragraphs)} | Vocab: {len(vocab_list)} (declared: {ch['vocab_count']})")
    if vocab_list:
        print(f"  Sample words: {[v['word'] for v in vocab_list[:5]]}")

# ===== Step 5: Output stats =====
total_vocab = sum(len(ch['vl']) for ch in output_chapters)
total_paras = sum(len(ch['para']) for ch in output_chapters)

print(f"\n{'='*60}")
print(f"BOOK 2 TOTALS: {len(output_chapters)} chapters | {total_paras} paragraphs | {total_vocab} vocab entries")

# Save intermediate result
with open('/tmp/npc_book2_parsed.json', 'w', encoding='utf-8') as f:
    json.dump(output_chapters, f, ensure_ascii=False, indent=2)

print(f"\nSaved parsed data to /tmp/npc_book2_parsed.json")
