import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  EmailValidator,
  FormBuilder,
  MaxLengthValidator,
  MinLengthValidator,
  PatternValidator,
  RangeValidator,
  RequiredValidator,
  ValueValidator,
  type ValidationResult,
  type Validator,
} from '../src';

const isValid = async (validator: Validator, value: unknown) => (await validator.validate(value)).valid;

describe('validadores prontos', () => {
  it('RequiredValidator trata vazio, espaços, lista vazia e checkbox desmarcado', async () => {
    const required = new RequiredValidator();
    for (const empty of [undefined, null, '', '   ', [], false]) {
      assert.equal(await isValid(required, empty), false, `deveria rejeitar ${JSON.stringify(empty)}`);
    }
    for (const filled of ['a', 0, true, ['x']]) {
      assert.equal(await isValid(required, filled), true);
    }
  });

  it('demais validadores aceitam valor vazio (combinam com Required)', async () => {
    const validators = [
      new EmailValidator(),
      new MinLengthValidator(3),
      new MaxLengthValidator(1),
      new PatternValidator(/^\d+$/),
      new RangeValidator(1, 2),
    ];
    for (const validator of validators) {
      assert.equal(await isValid(validator, ''), true);
    }
  });

  it('aplicam suas regras', async () => {
    assert.equal(await isValid(new EmailValidator(), 'a@b.co'), true);
    assert.equal(await isValid(new EmailValidator(), 'a@b'), false);
    assert.equal(await isValid(new MinLengthValidator(3), 'ab'), false);
    assert.equal(await isValid(new MaxLengthValidator(3), 'abcd'), false);
    assert.equal(await isValid(new PatternValidator(/^\d+$/), '12a'), false);
    assert.equal(await isValid(new RangeValidator(18, 99), '20'), true);
    assert.equal(await isValid(new RangeValidator(18, 99), 17), false);
    assert.equal(await isValid(new RangeValidator(18, 99), 'abc'), false);
  });

  it('usam mensagem personalizada', async () => {
    assert.deepEqual(await new MinLengthValidator(3, 'curto').validate('a'), { valid: false, message: 'curto' });
  });
});

describe('validadores do cliente', () => {
  it('subclasse de ValueValidator só implementa check()', async () => {
    class Par extends ValueValidator {
      protected check(value: unknown): ValidationResult {
        return Number(value) % 2 === 0 ? { valid: true } : { valid: false, message: 'ímpar' };
      }
    }
    assert.equal(await isValid(new Par(), ''), true);
    assert.equal(await isValid(new Par(), 3), false);
  });

  it('validadores síncronos e assíncronos convivem no mesmo campo', async () => {
    const asyncValidator: Validator = {
      validate: async value => (value === 'admin' ? { valid: false, message: 'em uso' } : { valid: true }),
    };
    const form = new FormBuilder('f')
      .field('u', 'text', 'U').validate(new MinLengthValidator(6), asyncValidator).add()
      .build();

    form.setValue('u', 'admin');
    await form.validate();
    assert.deepEqual(form.getErrors(), { u: ['Mínimo de 6 caracteres', 'em uso'] });
  });
});
