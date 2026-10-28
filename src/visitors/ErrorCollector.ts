import type { Form } from '../Form';
import type { Field } from '../fields/Field';
import type { FieldGroup } from '../fields/FieldGroup';
import type { FormComponent } from '../fields/FormComponent';
import { joinPath } from '../fields/path';
import type { FormVisitor } from './FormVisitor';

/** Erros por caminho completo, ex.: { 'endereco.cidade': ['Campo obrigatório'] }. */
export type FormErrors = Record<string, readonly string[]>;

/** Visitor interno: junta os erros de todos os campos que têm erro. */
export class ErrorCollector implements FormVisitor<FormErrors> {
  visitForm(form: Form): FormErrors {
    return this.collect(form.getComponents(), '');
  }

  visitGroup(group: FieldGroup, path: string): FormErrors {
    return this.collect(group.getChildren(), path);
  }

  visitField(field: Field, path: string): FormErrors {
    const { errors } = field.getState();
    return errors.length > 0 ? { [path]: errors } : {};
  }

  private collect(children: readonly FormComponent[], parent: string): FormErrors {
    return Object.assign({}, ...children.map(child => child.accept(this, joinPath(parent, child.name))));
  }
}
