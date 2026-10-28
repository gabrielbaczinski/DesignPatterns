import type { Form } from '../Form';
import type { Field } from '../fields/Field';
import type { FieldGroup } from '../fields/FieldGroup';
import type { FormComponent } from '../fields/FormComponent';
import { joinPath } from '../fields/path';
import type { FormVisitor } from './FormVisitor';

/** Visitor interno: monta o índice caminho -> componente usado pelo Form. */
export class PathIndexer implements FormVisitor<void> {
  readonly index = new Map<string, FormComponent>();

  visitForm(form: Form): void {
    form.getComponents().forEach(child => child.accept(this, child.name));
  }

  visitGroup(group: FieldGroup, path: string): void {
    this.index.set(path, group);
    group.getChildren().forEach(child => child.accept(this, joinPath(path, child.name)));
  }

  visitField(field: Field, path: string): void {
    this.index.set(path, field);
  }
}
