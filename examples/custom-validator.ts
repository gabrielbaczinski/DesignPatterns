/**
 * Exemplo 2: Extensibilidade — validator customizado e assíncrono.
 * O desenvolvedor implementa a interface Validator (Strategy) sem
 * modificar o código da biblioteca (Open/Closed Principle).
 */
import {
  Validator,
  ValidationResult,
  FormBuilder,
  RequiredValidator,
} from '../src';

// ─── Validator customizado síncrono ────────────────────────────────────────
// O cliente cria uma nova Strategy sem tocar no código da lib
class NoBadWordsValidator implements Validator {
  readonly name = 'noBadWords';
  private readonly badWords = ['spam', 'fake', 'test'];

  validate(value: unknown): ValidationResult {
    const str = String(value).toLowerCase();
    const found = this.badWords.find(word => str.includes(word));
    return found
      ? { valid: false, message: `Content contains disallowed word: "${found}"` }
      : { valid: true };
  }
}

// ─── Validator customizado assíncrono ──────────────────────────────────────
// Simula verificação de username único via API
class UniqueUsernameValidator implements Validator {
  readonly name = 'uniqueUsername';
  private readonly takenUsernames = ['admin', 'root', 'user123'];

  async validate(value: unknown): Promise<ValidationResult> {
    // Simula latência de rede
    await new Promise(resolve => setTimeout(resolve, 50));

    const username = String(value).toLowerCase();
    const isTaken = this.takenUsernames.includes(username);
    return isTaken
      ? { valid: false, message: `Username "${value}" is already taken` }
      : { valid: true };
  }
}

async function main() {
  // Builder monta o formulário usando os validators customizados do cliente
  const form = new FormBuilder('profile')
    .field('username', 'text', 'Username')
      .validate(
        new RequiredValidator(),
        new UniqueUsernameValidator(),  // async custom Strategy
        new NoBadWordsValidator()       // sync custom Strategy
      )
      .add()
    .field('bio', 'textarea', 'Bio')
      .validate(new NoBadWordsValidator())
      .add()
    .build();

  console.log('--- Test: taken username ---');
  form.setValue('username', 'admin');
  const r1 = await form.submit();
  console.log('Valid:', r1.valid);
  console.log('Errors:', form.getState()['username']?.errors);

  form.reset();

  console.log('\n--- Test: bad word in bio ---');
  form.setValue('username', 'alice99');
  form.setValue('bio', 'I send spam every day');
  const r2 = await form.submit();
  console.log('Valid:', r2.valid);
  console.log('Errors:', form.getState()['bio']?.errors);

  form.reset();

  console.log('\n--- Test: all valid ---');
  form.setValue('username', 'alice99');
  form.setValue('bio', 'I love coding!');
  const r3 = await form.submit();
  console.log('Valid:', r3.valid);
}

main().catch(console.error);
