import type { Form } from '../Form';
import type { Field } from '../fields/Field';
import type { FieldGroup } from '../fields/FieldGroup';
import type { FormComponent } from '../fields/FormComponent';
import { joinPath } from '../fields/path';
import type { FormVisitor } from '../visitors/FormVisitor';

/**
 * Renderizador HTML pronto para uso.
 *
 * Visitor: a renderização fica fora do modelo. Field e FieldGroup só guardam
 * estado e regras; quem decide a aparência é esta classe. Outro formato
 * (Markdown, componentes React...) é só outro Visitor.
 *
 * Template Method: `visitField()` define o esqueleto fixo de todo campo
 * (wrapper, rótulo, controle, erros e atributos de acessibilidade). As
 * subclasses trocam apenas os passos `renderLabel`, `renderControl` e
 * `renderErrors`, por exemplo para suportar um tipo de campo novo.
 */
export class HtmlRenderer implements FormVisitor<string> {
  render(form: Form): string {
    return form.accept(this);
  }

  visitForm(form: Form): string {
    return `<form name="${this.escape(form.name)}" novalidate>${this.renderChildren(form.getComponents(), '')}</form>`;
  }

  visitGroup(group: FieldGroup, path: string): string {
    const legend = group.label ? `<legend>${this.escape(group.label)}</legend>` : '';
    return `<fieldset name="${this.escape(path)}">${legend}${this.renderChildren(group.getChildren(), path)}</fieldset>`;
  }

  visitField(field: Field, path: string): string {
    const id = `fc-${path.replace(/\./g, '-')}`;
    const { errors, validating } = field.getState();
    const invalid = errors.length > 0;

    const attributes = [
      `id="${id}"`,
      `name="${this.escape(path)}"`,
      invalid ? `aria-invalid="true" aria-describedby="${id}-errors"` : '',
      validating ? 'aria-busy="true"' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      `<div class="fc-field${invalid ? ' fc-field--invalid' : ''}">` +
      this.renderLabel(field, id) +
      this.renderControl(field, attributes) +
      this.renderErrors(errors, `${id}-errors`) +
      '</div>'
    );
  }

  protected renderLabel(field: Field, id: string): string {
    return `<label for="${id}">${this.escape(field.config.label)}</label>`;
  }

  /** `attributes` já traz id, name e aria-*; basta incluí-los no controle. */
  protected renderControl(field: Field, attributes: string): string {
    const { type, placeholder, options = [] } = field.config;
    const value = field.getValue();
    const placeholderAttr = placeholder ? ` placeholder="${this.escape(placeholder)}"` : '';

    switch (type) {
      case 'textarea':
        return `<textarea ${attributes}${placeholderAttr}>${this.escape(value)}</textarea>`;
      case 'checkbox':
        return `<input type="checkbox" ${attributes}${value === true ? ' checked' : ''}>`;
      case 'select': {
        const empty = placeholder ? `<option value="">${this.escape(placeholder)}</option>` : '';
        const items = options
          .map(option => {
            const selected = String(value) === option.value ? ' selected' : '';
            return `<option value="${this.escape(option.value)}"${selected}>${this.escape(option.label)}</option>`;
          })
          .join('');
        return `<select ${attributes}>${empty}${items}</select>`;
      }
      default:
        return `<input type="${this.escape(type)}" ${attributes} value="${this.escape(value)}"${placeholderAttr}>`;
    }
  }

  protected renderErrors(errors: readonly string[], id: string): string {
    if (errors.length === 0) return '';
    const items = errors.map(error => `<li>${this.escape(error)}</li>`).join('');
    return `<ul class="fc-errors" id="${id}">${items}</ul>`;
  }

  /** Escapa texto para HTML (evita XSS com valores digitados pelo usuário). */
  protected escape(value: unknown): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private renderChildren(children: readonly FormComponent[], parent: string): string {
    return children.map(child => child.accept(this, joinPath(parent, child.name))).join('');
  }
}
