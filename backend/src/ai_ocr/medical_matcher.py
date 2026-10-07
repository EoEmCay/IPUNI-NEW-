"""Hậu xử lý chữ TrOCR đọc được: sửa tên thuốc đọc méo, giải mã tốc ký đơn thuốc VN, tách thuốc.

Cùng nguồn tên thuốc với scan.service.js: database/medications-db.json + database/drug-names.json.
Chạy self-check: python medical_matcher.py
"""
import json
import re
from pathlib import Path

DB_DIR = Path(__file__).resolve().parents[2] / 'database'
FUZZY_THRESHOLD = 0.7
AMBIGUITY_GAP = 0.1  # 2 thuốc khác nhau điểm sát nhau -> không tự sửa (vd Glipizide/Gliclazide)


def _load_terms():
    """[(term, canonical_name)] - biệt dược trỏ về tên gốc để coi là cùng 1 thuốc."""
    terms = []
    db = json.loads((DB_DIR / 'medications-db.json').read_text(encoding='utf-8')).get('medications', [])
    for med in db:
        for t in [med['name'], *med.get('aliases', [])]:
            terms.append((t.lower(), med['name'].lower()))
    known = {t for t, _ in terms}
    names = json.loads((DB_DIR / 'drug-names.json').read_text(encoding='utf-8'))
    for t in names['diabetes'] + names['common']:
        if t not in known:
            terms.append((t, t))
    return terms


TERMS = _load_terms()


def levenshtein_ratio(a, b):
    if not a or not b:
        return 0.0
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return 1 - prev[-1] / max(len(a), len(b))


def match_drug(word):
    """Từ (đã đọc méo) -> (tên thuốc đúng, điểm) hoặc None nếu không đủ giống / mơ hồ."""
    w = re.sub(r'[^a-z]', '', word.lower())
    if len(w) < 4:
        return None
    scored = sorted(((levenshtein_ratio(w, t), t, canon) for t, canon in TERMS if ' ' not in t), reverse=True)
    best_score, best_term, best_canon = scored[0]
    if best_score < FUZZY_THRESHOLD:
        return None
    runner_up = next((s for s, t, c in scored if c != best_canon), 0)
    if best_score < 1 and best_score - runner_up < AMBIGUITY_GAP:
        return None
    return best_term.title(), best_score


# Tốc ký đơn thuốc VN -> chữ đầy đủ. Thứ tự quan trọng: cụm dài trước cụm ngắn.
SHORTHAND = [
    (r'\bu\.?\s?s\.?\s?a\b', 'uống sau ăn'),
    (r'\bu\.?\s?t\.?\s?a\b', 'uống trước ăn'),
    (r'\bu\.?\s?t\.?\s?n\b', 'uống trước khi đi ngủ'),
    (r'\bt\.a\b', 'trước ăn'),
    (r'\bTDD\b', 'tiêm dưới da'),
    (r'\b(\d+(?:[.,]\d+)?)\s?v\s?x\s?(\d)\s?(?:l/ng|lần/ngày)?', r'\1 viên x \2 lần/ngày'),
    (r'\b(\d+)\s?l/ng\b', r'\1 lần/ngày'),
    (r'\b(\d+(?:[.,]\d+)?)\s?v\b', r'\1 viên'),
    (r'\b(\d+)\s?(?:đv|dv|UI|IU|U)\b', r'\1 đơn vị'),
    (r'\b(\d+)\s?p\b', r'\1 phút'),
    (r'(?<![\w/])s\s?-\s?c(?![\w/])', 'sáng 1 lần, chiều 1 lần'),
    (r'(?<![\w/])s\s?,\s?c(?![\w/])', 'sáng 1 lần, chiều 1 lần'),
]


def expand_shorthand(text):
    for pattern, repl in SHORTHAND:
        text = re.sub(pattern, repl, text, flags=re.IGNORECASE)
    return text


def correct_line(text):
    """Sửa từng từ giống tên thuốc; trả (dòng đã sửa, [(từ gốc, tên đúng)])."""
    fixes = []

    def fix(m):
        hit = match_drug(m.group(0))
        if hit and hit[0].lower() != m.group(0).lower():
            fixes.append((m.group(0), hit[0]))
            return hit[0]
        return m.group(0)

    return re.sub(r'[A-Za-zÀ-ỹ]{4,}', fix, text), fixes


DOSE_RE = re.compile(r'(\d+(?:[.,]\d+)?)\s?(mg|mcg|g|ml|IU|UI|U|đv|dv)\b', re.IGNORECASE)


def parse_medications(lines):
    """Dòng chữ (đã sửa) -> thuốc. Dòng có tên thuốc mở 1 thuốc mới; dòng sau không có tên thuốc là
    cách dùng của thuốc trước (kiểu đơn VN). Kiểu "Thuốc 250 mg - After meals" tách theo dấu gạch.
    ponytail: heuristic theo bố cục đơn thường gặp - đơn kẻ bảng / 2 cột cần tách cột trước."""
    meds = []
    for line in lines:
        words = re.findall(r'[A-Za-zÀ-ỹ]{4,}', line)
        drug = next((match_drug(w)[0] for w in words if match_drug(w)), None)
        if drug:
            dose = DOSE_RE.search(line)
            rest = line.split(' - ', 1)[1] if ' - ' in line else ''
            meds.append({
                'name': drug,
                'dosage': f'{dose.group(1)}{dose.group(2)}' if dose else None,
                'instructions': expand_shorthand(rest).strip(),
            })
        elif meds and line.strip():
            prev = meds[-1]
            prev['instructions'] = (prev['instructions'] + ' ' + expand_shorthand(line)).strip()
    return meds


if __name__ == '__main__':
    assert match_drug('Metfomin')[0] == 'Metformin'
    assert match_drug('Glimpirid')[0] == 'Glimepiride'
    assert match_drug('Rosuvastatin')[0] == 'Rosuvastatin'  # không bị kéo về Atorvastatin
    assert match_drug('Glipizide')[0] == 'Glipizide'
    assert match_drug('Patient') is None and match_drug('meals') is None
    assert expand_shorthand('1v x 2l/ng s-c u.s.a') == '1 viên x 2 lần/ngày sáng 1 lần, chiều 1 lần uống sau ăn'
    assert expand_shorthand('TDD 18U t 21h') == 'tiêm dưới da 18 đơn vị t 21h'
    assert correct_line('Metfomin 250 mg - After meals')[0] == 'Metformin 250 mg - After meals'
    meds = parse_medications(['Metformin 250 mg - After meals', 'Diamicron MR 30mg SL: 30v', '1v s u.t.a 30p'])
    assert meds[0] == {'name': 'Metformin', 'dosage': '250mg', 'instructions': 'After meals'}, meds[0]
    assert meds[1]['name'] == 'Diamicron' and meds[1]['dosage'] == '30mg'
    assert 'uống trước ăn' in meds[1]['instructions'] and '30 phút' in meds[1]['instructions'], meds[1]
    print('medical_matcher self-check OK')
