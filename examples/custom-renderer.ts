/**
 * Exemplo 4 — cliente estende a RENDERIZAÇÃO.
 *  a) Tipo de campo novo ('rating') estendendo o HtmlRenderer (Template Method).
 *  b) Formato de saída novo (Markdown) com um Visitor próprio.
 * A biblioteca não é alterada em nenhum dos dois casos.
 */
import {
  Field,
  FieldGroup,
  Form,
  FormBuilder,
  HtmlRenderer,
  RangeValidator,
  RequiredValidator,
  type FormVisitor,
} from '../src';
import { savePage } from './save-page';

// a) Só o passo renderControl muda; rótulo, erros e acessibilidade continuam iguais.
class RatingHtmlRenderer extends HtmlRenderer {
  protected override renderControl(field: Field, attributes: string): string {
    if (field.config.type !== 'rating') return super.renderControl(field, attributes);
    return `<input type="range" min="1" max="5" step="1" ${attributes} value="${this.escape(field.getValue())}">`;
  }
}

// b) Uma operação totalmente nova sobre a árvore do formulário.
class MarkdownVisitor implements FormVisitor<string> {
  visitForm(form: Form): string {
    const body = form.getComponents().map(child => child.accept(this, child.name)).join('\n');
    return `# ${form.name}\n\n${body}`;
  }

  visitGroup(group: FieldGroup, path: string): string {
    const body = group.getChildren().map(child => child.accept(this, `${path}.${child.name}`)).join('\n');
    return `\n## ${group.label ?? group.name}\n\n${body}`;
  }

  visitField(field: Field): string {
    const { value, errors } = field.getState();
    const status = errors.length > 0 ? ` _(${errors.join('; ')})_` : '';
    return `- **${field.config.label}:** ${String(value) || '—'}${status}`;
  }
}

async function main(): Promise<void> {
  const form = new FormBuilder('avaliacao')
    .field('produto', 'text', 'Produto').validate(new RequiredValidator()).add()
    .field('nota', 'rating', 'Nota').defaultValue(3).validate(new RangeValidator(1, 5)).add()
    .group('cliente', 'Cliente')
      .field('nome', 'text', 'Nome').validate(new RequiredValidator()).add()
    .end()
    .build();

  form.setValue('produto', 'Café especial');
  await form.validate();

  console.log('--- HTML com o tipo "rating" ---');
  savePage('avaliacao.html', 'Avaliação', new RatingHtmlRenderer().render(form));

  console.log('\n--- Markdown (Visitor do cliente) ---');
  console.log(form.accept(new MarkdownVisitor()));
}

main().catch(console.error);
