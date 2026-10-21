/**
 * Exemplo 1: Uso básico out-of-the-box da biblioteca formcraft.
 * Demonstra Builder + Strategy + Composite + Observer em conjunto.
 */
import {
  FormBuilder,
  RequiredValidator,
  EmailValidator,
  MinLengthValidator,
  MaxLengthValidator,
  FormEvent,
} from '../src';

async function main() {
  // Builder Pattern: construção fluente, passo a passo
  const form = new FormBuilder('registration')
    .field('name', 'text', 'Full Name')
      .placeholder('John Doe')
      .validate(
        new RequiredValidator(),           // Strategy: algoritmo "required"
        new MinLengthValidator(3),         // Strategy: algoritmo "minLength"
        new MaxLengthValidator(100)        // Strategy: algoritmo "maxLength"
      )
      .add()
    .field('email', 'email', 'Email Address')
      .placeholder('john@example.com')
      .validate(
        new RequiredValidator(),
        new EmailValidator()               // Strategy: algoritmo "email"
      )
      .add()
    .field('password', 'text', 'Password')
      .validate(
        new RequiredValidator(),
        new MinLengthValidator(8, 'Password must be at least 8 characters')
      )
      .add()
    // Composite Pattern: agrupa endereço como FieldGroup aninhado
    .group('address')
      .field('street', 'text', 'Street').validate(new RequiredValidator()).add()
      .field('city', 'text', 'City').validate(new RequiredValidator()).add()
      .field('zip', 'text', 'ZIP Code').add()
    .end()
    .build();

  // Observer Pattern: ouvindo eventos do formulário
  const unsubscribe = form.on('submit', (event: FormEvent) => {
    console.log('\n[Observer] Form submit event received:');
    console.log('  Valid:', event.valid);
    console.log('  Values:', JSON.stringify(event.values, null, 2));
  });

  form.on('validate', (event: FormEvent) => {
    console.log('[Observer] Validation complete — form valid:', event.valid);
  });

  // Preenchendo valores
  form.setValue('name', 'Alice Smith');
  form.setValue('email', 'alice@example.com');
  form.setValue('password', 'secret123');
  form.setValue('address', { street: '123 Main St', city: 'Cityville', zip: '12345' });

  // Submetendo o formulário
  const result = await form.submit();
  console.log('\nSubmit result:', result.valid ? 'SUCCESS' : 'FAILED');

  // Cancela inscrição do observer de submit
  unsubscribe();

  // Testando validação com dados inválidos
  console.log('\n--- Testing invalid data ---');
  const form2 = new FormBuilder('test')
    .field('email', 'email', 'Email')
      .validate(new RequiredValidator(), new EmailValidator())
      .add()
    .build();

  form2.setValue('email', 'not-an-email');
  const { valid } = await form2.submit();
  console.log('Validation failed as expected:', !valid);

  const state = form2.getState();
  console.log('Field errors:', state['email']?.errors);
}

main().catch(console.error);
