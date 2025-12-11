import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "public", "data")
INPUT_JSON = os.path.join(DATA_DIR, "sermons.json")
OUTPUT_JSON = os.path.join(DATA_DIR, "sermons.json")

def normalize_sermons(videos):
    normalized = []
    for v in videos:
        title = v.get("title", "")
        person = v.get("person", "")
        
        # Remove date from title
        title = re.sub(r'^\d{4}-\d{2}-\d{2}\s*\|\s*', '', title)

        if not person:
            if "|" in title:
                parts = title.split("|")
                person = parts[-1].strip()
                title = "|".join(parts[:-1]).strip()
        
        sermon_type = "Sunday Service"
        if "Morning Manna" in v.get("description", "") or "Morning Manna" in title:
            sermon_type = "Morning Manna"
        
        date_str = v.get("date", "").split("T")[0]

        normalized.append(
            {
                "youtubeId": v.get("youtubeId"),
                "title": title,
                "description": v.get("description"),
                "date": date_str,
                "thumbnail": v.get("thumbnail"),
                "url": v.get("url"),
                "person": person,
                "sermon_type": sermon_type
            }
        )
    return normalized

def main():
    with open(INPUT_JSON, "r", encoding="utf-8") as f:
        sermons = json.load(f)
    
    normalized_sermons = normalize_sermons(sermons)
    
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(normalized_sermons, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()