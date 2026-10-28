/**
 * Exemplo 3 — cliente estende a ESTRUTURA (Composite).
 * Um grupo de campos reutilizável, usado duas vezes no mesmo formulário.
 */
import { Field, FieldGroup, FormBuilder, PatternValidator, RequiredValidator } from '../src';

class EnderecoGroup extends FieldGroup {
  constructor(name: string, label: string) {
    super(
      name,
      [
        new Field('rua', { type: 'text', label: 'Rua', validators: [new RequiredValidator()] }),
        new Field('cidade', { type: 'text', label: 'Cidade', validators: [new RequiredValidator()] }),
        new Field('cep', {
          type: 'text',
          label: 'CEP',
          validators: [new RequiredValidator(), new PatternValidator(/^\d{5}-\d{3}$/)],
        }),
      ],
      label,
    );
  }
}

async function main(): Promise<void> {
  const form = new FormBuilder('checkout')
    .field('nome', 'text', 'Nome').validate(new RequiredValidator()).add()
    .component(new EnderecoGroup('entrega', 'Endereço de entrega'))
    .component(new EnderecoGroup('cobranca', 'Endereço de cobrança'))
    .build();

  form.setValue('nome', 'Bruno Lima');
  form.setValue('entrega', { rua: 'Rua das Flores, 10', cidade: 'Curitiba', cep: '80000-000' });
  form.setValue('cobranca.rua', 'Av. Brasil, 500'); // caminho completo até o campo

  const resultado = await form.submit();
  console.log('Válido:', resultado.valid);
  console.log('Erros por caminho:', resultado.errors);
  console.log('Valores:', JSON.stringify(resultado.values, null, 2));
}

main().catch(console.error);
