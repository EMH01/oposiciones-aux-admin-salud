"""Regenerate the bundled bank from public/preguntas.pdf (requires pdfplumber).

Run: python scripts/extract_questions.py
Headers and verification footers are excluded by their position on each page.
Every question must have ordered A–D options and an explicit official answer.
"""
import json
import re
from pathlib import Path
import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'src/data/questions.ts'
existing = TARGET.read_text()
metadata = {
    int(m[0]): m[1]
    for m in re.findall(r'["\']?id["\']?\s*:\s*(\d+),[\s\S]*?["\']?topic["\']?\s*:\s*["\']([^"\']+)', existing)
}
assert set(metadata) == set(range(1, 301)), 'Missing topic metadata'
lines = []
with pdfplumber.open(ROOT / 'public/preguntas.pdf') as pdf:
    for page in pdf.pages:
        page_lines = page.extract_text_lines()
        header_end = next(line['bottom'] for line in page_lines if 'Nº de preguntas de reserva:' in line['text'])
        footer_start = next(line['top'] for line in page_lines if re.match(r'Página \d+ de \d+', line['text']))
        for line in page_lines:
            if header_end < line['top'] < footer_start:
                lines.append(line['text'].strip())

bank = []
current = None
field = None
for line in lines:
    question = re.match(r'^(\d{1,3})\.\s*(.+)', line)
    option = re.match(r'^([A-D])\)\s*(.*)', line)
    answer = re.fullmatch(r'Respuesta Correcta:\s*([A-D])', line)
    if question:
        assert current is None, f'Missing answer before {line}'
        id_ = int(question[1])
        assert id_ == len(bank) + 1, f'Unexpected question ID: {id_}'
        current = dict(id=id_, question=question[2], options={}, topic=metadata[id_])
        field = 'question'
    elif option:
        assert current is not None, f'Option outside question: {line}'
        field = option[1]
        assert field == 'ABCD'[len(current['options'])], f'Option order: {current["id"]}'
        current['options'][field] = option[2]
    elif answer:
        assert current is not None and list(current['options']) == list('ABCD')
        assert all(current['options'].values()) and current['question'].strip()
        current['correctAnswer'] = answer[1]
        bank.append(current)
        current = None
        field = None
    else:
        assert current is not None, f'Unrecognized text outside question: {line}'
        if field == 'question':
            current['question'] += ' ' + line
        else:
            current['options'][field] += ' ' + line

assert current is None and len(bank) == 300, f'Incomplete bank: {len(bank)}'
serialized = json.dumps(bank, ensure_ascii=False, indent=2)
assert not any(noise in serialized for noise in ['Proporciona el PDF', 'Respuesta Correcta:', 'Página ', 'verifica_doc', 'Listado de preguntas'])
TARGET.write_text(
    "import type { Question } from '../types';\n\n"
    '// Extracted from public/preguntas.pdf with scripts/extract_questions.py.\n'
    '// Official answers come from the PDF; IDs and topics remain stable.\n'
    f'export const questions: Question[] = {serialized};\n\n'
    'export const TOPICS = [...new Set(questions.map(q => q.topic))];\n\n'
    'export const getQuestionsByTopic = (topic: string) =>\n'
    '  questions.filter(q => q.topic === topic);\n'
)
print(f'Extracted {len(bank)} complete questions and official answers; question 92:')
print(json.dumps(bank[91], ensure_ascii=False, indent=2))
