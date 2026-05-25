import * as pdfjs from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import type { Question } from '../types';
import { questions } from '../data/questions';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).href;

const CACHE_KEY = 'oposiciones_sas_questions_v1';

// ── Helpers ──────────────────────────────────────────────────────────────────

function applyToArray(loaded: Question[]): void {
  if (loaded.length === questions.length) {
    questions.splice(0, questions.length, ...loaded);
  }
}

function mergeWithDefaults(raw: RawQ[]): Question[] {
  const map = new Map(raw.map(r => [r.id, r]));
  return questions.map(q => {
    const r = map.get(q.id);
    if (!r) return q;
    return {
      ...q,
      question: r.text,
      options: { A: r.opts[0], B: r.opts[1], C: r.opts[2], D: r.opts[3] },
    };
  });
}

// ── Cache ─────────────────────────────────────────────────────────────────────

/** Carga desde localStorage si existe. Devuelve true si se aplicó. */
export function loadFromCache(): boolean {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Question[];
    if (!Array.isArray(parsed) || parsed.length !== questions.length) return false;
    applyToArray(parsed);
    return true;
  } catch {
    return false;
  }
}

export function clearQuestionsCache(): void {
  localStorage.removeItem(CACHE_KEY);
}

// ── PDF parsing ───────────────────────────────────────────────────────────────

interface RawQ {
  id: number;
  text: string;
  opts: [string, string, string, string];
}

async function extractLines(pdf: pdfjs.PDFDocumentProxy): Promise<string[]> {
  const allLines: string[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const tc = await page.getTextContent();

    // Agrupar items por coordenada Y (misma línea)
    const byY = new Map<number, string[]>();
    for (const item of tc.items as TextItem[]) {
      if (!item.str.trim()) continue;
      const y = Math.round(item.transform[5]);
      if (!byY.has(y)) byY.set(y, []);
      byY.get(y)!.push(item.str);
    }

    // En PDF, Y=0 está abajo → ordenar descendente para leer de arriba a abajo
    const sorted = [...byY.entries()].sort((a, b) => b[0] - a[0]);
    for (const [, strs] of sorted) {
      const line = strs.join(' ').replace(/\s+/g, ' ').trim();
      if (line) allLines.push(line);
    }
  }

  return allLines;
}

function parseLines(lines: string[]): RawQ[] {
  const results: RawQ[] = [];
  // Número de pregunta: "1." "1.-" "1-" "1)"
  const qRe = /^(\d{1,3})[.)–\-]\s*(.*)/;
  // Opción: "A)" "A." "a)" "A-" "A.-"
  const optRe = /^[AaBbCcDd][.)–\-]\s*(.*)/;

  let i = 0;
  while (i < lines.length) {
    const qm = lines[i].match(qRe);
    if (!qm) { i++; continue; }

    const id = parseInt(qm[1]);
    if (id < 1 || id > 300) { i++; continue; }

    let text = qm[2].trim();
    i++;

    // Acumular más texto de la pregunta hasta llegar a una opción o pregunta siguiente
    while (i < lines.length && !optRe.test(lines[i]) && !qRe.test(lines[i])) {
      text += ' ' + lines[i].trim();
      i++;
    }
    text = text.trim();

    // Recoger las 4 opciones
    const opts: string[] = [];
    while (i < lines.length && opts.length < 4) {
      const om = lines[i].match(optRe);
      if (!om) {
        if (qRe.test(lines[i])) break; // siguiente pregunta
        // línea de continuación de la opción anterior
        if (opts.length > 0) opts[opts.length - 1] += ' ' + lines[i].trim();
        i++;
        continue;
      }
      let optText = om[1].trim();
      i++;
      // Líneas de continuación de esta opción
      while (i < lines.length && !optRe.test(lines[i]) && !qRe.test(lines[i])) {
        optText += ' ' + lines[i].trim();
        i++;
      }
      opts.push(optText.trim());
    }

    if (text && opts.length === 4) {
      results.push({ id, text, opts: opts as [string, string, string, string] });
    }
  }

  return results;
}

// ── Punto de entrada principal ────────────────────────────────────────────────

/**
 * Descarga preguntas.pdf del repo (public/) y parsea las preguntas.
 * Guarda el resultado en localStorage y actualiza el array questions[] en memoria.
 * @returns número de preguntas parseadas correctamente
 */
export async function loadFromPdf(
  onProgress?: (msg: string) => void,
): Promise<number> {
  const url = `${import.meta.env.BASE_URL}preguntas.pdf`;
  onProgress?.('Descargando preguntas.pdf…');

  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(
      `No se encontró preguntas.pdf (${resp.status}). Asegúrate de incluirlo en public/.`,
    );
  }

  const buffer = await resp.arrayBuffer();
  onProgress?.('Leyendo PDF…');

  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  onProgress?.(`Procesando ${pdf.numPages} páginas…`);

  const lines = await extractLines(pdf);
  onProgress?.('Extrayendo preguntas…');

  const raw = parseLines(lines);
  const merged = mergeWithDefaults(raw);

  applyToArray(merged);
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(merged));
  } catch {
    /* localStorage lleno — ignorar */
  }

  return raw.length;
}
