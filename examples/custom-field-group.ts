/**
 * Exemplo 3: Extensibilidade — FieldGroup customizado e Observer em campo individual.
 * Mostra o Composite Pattern: cliente cria seu próprio grupo de campos
 * reutilizável sem alterar a biblioteca.
 */
import {
  FieldGroup,
  Field,
  FormBuilder,
  RequiredValidator,
  MinLengthValidator,
  EmailValidator,
} from '../src';

// Composite customizado: AddressGroup é um FieldGroup pré-montado reutilizável
class AddressGroup extends FieldGroup {
  constructor(name: string) {
    super(name);
    this.add(new Field('street', { type: 'text', label: 'Street', validators: [new RequiredValidator()] }));
    this.add(new Field('city', { type: 'text', label: 'City', validators: [new RequiredValidator()] }));
    this.add(new Field('state', { type: 'text', label: 'State' }));
    this.add(new Field('zip', { type: 'text', label: 'ZIP Code', validators: [new RequiredValidator()] }));
  }
}

async function main() {
  // Usando o Builder + Composite customizado
  const form = new FormBuilder('checkout')
    .field('fullName', 'text', 'Full Name')
      .validate(new RequiredValidator(), new MinLengthValidator(2))
      .add()
    .field('email', 'email', 'Email')
      .validate(new RequiredValidator(), new EmailValidator())
      .add()
    .build();

  // Adiciona o Composite customizado diretamente ao formulário
  form._addComponent(new AddressGroup('shipping'));
  form._addComponent(new AddressGroup('billing'));

  // Observer Pattern: ouve mudanças de um campo específico
  const nameField = form.getField('fullName');
  nameField?.on('change', (event) => {
    console.log(`[Observer] Name changed to: "${event.value}"`);
  });

  form.setValue('fullName', 'Bob Johnson');
  form.setValue('email', 'bob@example.com');
  form.setValue('shipping', { street: '10 Oak Ave', city: 'Townsville', zip: '99999' });
  form.setValue('billing', { street: '10 Oak Ave', city: 'Townsville', zip: '99999' });

  const result = await form.submit();
  console.log('\nCheckout form valid:', result.valid);
  console.log('All values:', JSON.stringify(result.values, null, 2));
}

main().catch(console.error);
