import type { FormVisitor } from '../visitors/FormVisitor';
import type { FormComponent } from './FormComponent';
import { assertValidName } from './path';

/**
 * Composite — composto: agrupa campos e outros grupos (ex.: endereço).
 *
 * Cada operação é repassada aos filhos, de forma recursiva. A estrutura é
 * definida no construtor e não muda depois, então não existe grupo
 * "pela metade" nem filho com nome repetido.
 */
export class FieldGroup implements FormComponent {
  readonly name: string;
  readonly label: string | undefined;

  private readonly children: readonly FormComponent[];
  private readonly byName: ReadonlyMap<string, FormComponent>;

  constructor(name: string, children: readonly FormComponent[], label?: string) {
    assertValidName(name);
    this.name = name;
    this.label = label;
    this.children = [...children];
    this.byName = new Map(this.children.map(child => [child.name, child]));

    if (this.byName.size !== this.children.length) {
      throw new Error(`O grupo "${name}" tem componentes com nomes repetidos.`);
    }
  }

  getChildren(): readonly FormComponent[] {
    return this.children;
  }

  getValue(): Record<string, unknown> {
    return Object.fromEntries(this.children.map(child => [child.name, child.getValue()]));
  }

  /** Recebe um objeto parcial, ex.: { cidade: 'Curitiba' }. */
  setValue(value: unknown): void {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new TypeError(`O grupo "${this.name}" espera um objeto como valor.`);
    }
    for (const [key, childValue] of Object.entries(value)) {
      const child = this.byName.get(key);
      if (!child) throw new Error(`O grupo "${this.name}" não tem o campo "${key}".`);
      child.setValue(childValue);
    }
  }

  async validate(): Promise<boolean> {
    const results = await Promise.all(this.children.map(child => child.validate()));
    return results.every(Boolean);
  }

  reset(): void {
    this.children.forEach(child => child.reset());
  }

  accept<R>(visitor: FormVisitor<R>, path: string): R {
    return visitor.visitGroup(this, path);
  }
}
