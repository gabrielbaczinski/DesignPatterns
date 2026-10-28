// Utilitário dos exemplos (não faz parte da biblioteca): salva o HTML gerado
// numa página com um CSS simples, para abrir no navegador.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const STYLE = `
  body { font-family: system-ui, sans-serif; max-width: 480px; margin: 40px auto; padding: 0 16px; }
  fieldset { border: 1px solid #ccc; border-radius: 8px; margin: 16px 0; }
  .fc-field { display: flex; flex-direction: column; gap: 4px; margin: 12px 0; }
  .fc-field input, .fc-field select, .fc-field textarea { padding: 8px; border: 1px solid #aaa; border-radius: 6px; }
  .fc-field--invalid input, .fc-field--invalid select, .fc-field--invalid textarea { border-color: #c62828; }
  .fc-errors { color: #c62828; margin: 0; padding-left: 18px; font-size: 14px; }
`;

export function savePage(fileName: string, title: string, html: string): void {
  const dir = join(__dirname, 'output');
  mkdirSync(dir, { recursive: true });
  const path = join(dir, fileName);
  writeFileSync(
    path,
    `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${title}</title>` +
      `<style>${STYLE}</style></head><body><h1>${title}</h1>${html}</body></html>`,
  );
  console.log(`Página gerada: ${path}`);
}
