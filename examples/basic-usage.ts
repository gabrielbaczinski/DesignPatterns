/**
 * Exemplo 1 — uso padrão (out-of-the-box).
 * Só recursos prontos da biblioteca: builder, validadores, grupos, eventos e renderizador HTML.
 */
import {
  EmailValidator,
  FormBuilder,
  HtmlRenderer,
  MinLengthValidator,
  PatternValidator,
  RangeValidator,
  RequiredValidator,
} from '../src';
import { savePage } from './save-page';

async function main(): Promise<void> {
  const form = new FormBuilder('cadastro')
    .field('nome', 'text', 'Nome completo')
      .placeholder('Maria Silva')
      .validate(new RequiredValidator(), new MinLengthValidator(3))
      .add()
    .field('email', 'email', 'E-mail')
      .validate(new RequiredValidator(), new EmailValidator())
      .add()
    .field('idade', 'number', 'Idade')
      .validate(new RangeValidator(18, 120))
      .add()
    .group('endereco', 'Endereço')
      .field('cidade', 'text', 'Cidade').validate(new RequiredValidator()).add()
      .field('cep', 'text', 'CEP')
        .validate(new PatternValidator(/^\d{5}-\d{3}$/, 'Use o formato 00000-000'))
        .add()
    .end()
    .build();

  form.on('change', ({ path, value }) => console.log(`[change] ${path} = ${JSON.stringify(value)}`));
  form.on('submit', ({ valid }) => console.log(`[submit] válido: ${valid}`));

  console.log('--- Dados inválidos ---');
  form.setValue('nome', 'Al');
  form.setValue('email', 'nao-e-email');
  form.setValue('idade', 12);
  form.setValue('endereco', { cep: '123' });

  const invalido = await form.submit();
  console.log('Erros:', invalido.errors);

  // Visitor: o mesmo formulário vira HTML, já com as mensagens de erro.
  savePage('cadastro.html', 'Cadastro', new HtmlRenderer().render(form));

  console.log('\n--- Dados corrigidos ---');
  form.setValue('nome', 'Alice Souza');
  form.setValue('email', 'alice@exemplo.com');
  form.setValue('idade', 25);
  form.setValue('endereco', { cidade: 'Curitiba', cep: '80000-000' });

  const valido = await form.submit();
  console.log('Valores:', JSON.stringify(valido.values, null, 2));
}

main().catch(console.error);
