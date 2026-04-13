from __future__ import annotations

import io
import json
import zipfile
from pathlib import Path
from urllib.request import urlopen


ROOT = Path(__file__).resolve().parent.parent
TARGET_DIR = ROOT / "src" / "data" / "lexicons"


LEXICON_SOURCES = {
    "cet4": {
        "label": "CET-4",
        "description": "大学英语四级核心词库",
        "source_url": "https://raw.githubusercontent.com/KyleBing/english-vocabulary/master/json/3-CET4-%E9%A1%BA%E5%BA%8F.json",
        "source_label": "KyleBing / english-vocabulary",
        "kind": "kylebing",
    },
    "cet6": {
        "label": "CET-6",
        "description": "大学英语六级核心词库",
        "source_url": "https://raw.githubusercontent.com/KyleBing/english-vocabulary/master/json/4-CET6-%E9%A1%BA%E5%BA%8F.json",
        "source_label": "KyleBing / english-vocabulary",
        "kind": "kylebing",
    },
    "toefl": {
        "label": "TOEFL",
        "description": "托福考试高频词库",
        "source_url": "https://raw.githubusercontent.com/KyleBing/english-vocabulary/master/json/6-%E6%89%98%E7%A6%8F-%E9%A1%BA%E5%BA%8F.json",
        "source_label": "KyleBing / english-vocabulary",
        "kind": "kylebing",
    },
    "ielts": {
        "label": "IELTS",
        "description": "雅思考试词汇词库",
        "source_url": "http://ydschool-online.nos.netease.com/1521164657744_IELTS_2.zip",
        "source_label": "kajweb / dict (Youdao offline book mirror)",
        "kind": "kajweb_zip",
    },
}


def load_json(url: str):
    with urlopen(url) as response:
        return json.load(response)


def normalize_kylebing(entry: dict, lexicon_id: str) -> dict:
    translations = entry.get("translations") or []
    primary = translations[0] if translations else {}
    return {
        "word": str(entry.get("word", "")).strip(),
        "meaning": str(primary.get("translation", "")).strip(),
        "pos": str(primary.get("type", "")).strip(),
        "phonetic": "",
        "example": "",
        "difficulty": "intermediate",
        "lexicon": [lexicon_id],
        "source": "lexicon",
    }


def normalize_kajweb(entry: dict, lexicon_id: str) -> dict:
    word = entry.get("headWord") or entry.get("content", {}).get("word", {}).get("wordHead", "")
    content = entry.get("content", {}).get("word", {}).get("content", {})
    trans = content.get("trans") or []
    syno = content.get("syno", {}).get("synos") or []
    sentence_list = content.get("sentence", {}).get("sentences") or []

    meaning = ""
    pos = ""
    if trans:
      primary = trans[0]
      pos = str(primary.get("pos", "")).strip()
      meaning = str(primary.get("tranCn", "")).strip()
    elif syno:
      primary = syno[0]
      pos = str(primary.get("pos", "")).strip()
      meaning = str(primary.get("tran", "")).strip()

    example = sentence_list[0].get("sContent", "").strip() if sentence_list else ""

    return {
        "word": str(word).strip(),
        "meaning": meaning,
        "pos": pos,
        "phonetic": str(content.get("usphone") or content.get("ukphone") or "").strip(),
        "example": example,
        "difficulty": "intermediate",
        "lexicon": [lexicon_id],
        "source": "lexicon",
    }


def read_kajweb_zip(url: str):
    with urlopen(url) as response:
        payload = response.read()
    archive = zipfile.ZipFile(io.BytesIO(payload))
    json_name = archive.namelist()[0]
    text = archive.read(json_name).decode("utf-8")
    return [json.loads(line) for line in text.splitlines() if line.strip()]


def normalize_entries(lexicon_id: str, config: dict) -> list[dict]:
    if config["kind"] == "kylebing":
        raw_entries = load_json(config["source_url"])
        normalized = [normalize_kylebing(entry, lexicon_id) for entry in raw_entries]
    else:
        raw_entries = read_kajweb_zip(config["source_url"])
        normalized = [normalize_kajweb(entry, lexicon_id) for entry in raw_entries]

    return [item for item in normalized if item["word"] and item["meaning"]]


def main():
    TARGET_DIR.mkdir(parents=True, exist_ok=True)
    manifest = []

    for lexicon_id, config in LEXICON_SOURCES.items():
        entries = normalize_entries(lexicon_id, config)
        output_path = TARGET_DIR / f"{lexicon_id}.json"
        output_path.write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8")
        manifest.append({
            "id": lexicon_id,
            "label": config["label"],
            "description": config["description"],
            "count": len(entries),
            "sourceUrl": config["source_url"],
            "sourceLabel": config["source_label"],
        })
        print(f"[lexicon] {lexicon_id}: {len(entries)} entries")

    manifest_path = TARGET_DIR / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[lexicon] manifest saved -> {manifest_path}")


if __name__ == "__main__":
    main()
