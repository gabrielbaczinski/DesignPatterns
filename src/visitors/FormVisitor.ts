import type { Form } from '../Form';
import type { Field } from '../fields/Field';
import type { FieldGroup } from '../fields/FieldGroup';

/**
 * Visitor — uma operação sobre a árvore do formulário.
 *
 * Cada nó chama o método do seu tipo em `accept()` (double dispatch). Assim,
 * operações novas (renderizar HTML, coletar erros, gerar outro formato)
 * são classes novas, sem alterar Field, FieldGroup ou Form.
 * `path` é o caminho completo do nó, ex.: "endereco.cidade".
 */
export interface FormVisitor<R> {
  visitForm(form: Form): R;
  visitGroup(group: FieldGroup, path: string): R;
  visitField(field: Field, path: string): R;
}
