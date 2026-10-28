/**
 * Exemplo 2 — cliente estende a VALIDAÇÃO (Strategy).
 * Duas regras novas, criadas fora da biblioteca, sem alterar o código dela.
 */
import {
  FormBuilder,
  RequiredValidator,
  ValueValidator,
  type ValidationResult,
  type Validator,
} from '../src';

// Regra síncrona. Estende ValueValidator, que já ignora valor vazio (Template Method).
class CpfValidator extends ValueValidator {
  protected check(value: unknown): ValidationResult {
    return /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(String(value))
      ? { valid: true }
      : { valid: false, message: 'CPF deve estar no formato 000.000.000-00' };
  }
}

// Regra assíncrona. Implementa Validator direto e simula uma consulta a uma API.
class UsuarioDisponivelValidator implements Validator {
  private readonly emUso = ['admin', 'root'];

  async validate(value: unknown): Promise<ValidationResult> {
    await new Promise(resolve => setTimeout(resolve, 100)); // latência de rede
    return this.emUso.includes(String(value).toLowerCase())
      ? { valid: false, message: `O usuário "${value}" já está em uso` }
      : { valid: true };
  }
}

async function main(): Promise<void> {
  const form = new FormBuilder('perfil')
    .field('usuario', 'text', 'Usuário')
      .validate(new RequiredValidator(), new UsuarioDisponivelValidator())
      .add()
    .field('cpf', 'text', 'CPF')
      .validate(new CpfValidator())
      .add()
    .build();

  const usuario = form.getField('usuario');
  usuario.on('validate', ({ valid }) => console.log(`[validate] usuario válido: ${valid}`));

  form.setValue('usuario', 'admin');
  form.setValue('cpf', '123');

  const pendente = form.validate();
  console.log('Validando... estado intermediário validating =', usuario.getState().validating);
  await pendente;
  console.log('Erros:', form.getErrors());

  form.setValue('usuario', 'ayla');
  form.setValue('cpf', '123.456.789-00');
  console.log('\nApós corrigir, válido:', (await form.submit()).valid);
}

main().catch(console.error);
