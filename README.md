# formcraft

Framework-agnostic TypeScript library for programmatic form building and validation.

## Team

- [Nome do Aluno 1]
- [Nome do Aluno 2]

## Video

[Link do vídeo no YouTube]

---

## Installation

```bash
npm install formcraft
```

## Quick Start

```typescript
import {
  FormBuilder,
  RequiredValidator,
  EmailValidator,
  MinLengthValidator,
} from 'formcraft';

const form = new FormBuilder('contact')
  .field('name', 'text', 'Full Name')
    .validate(new RequiredValidator(), new MinLengthValidator(3))
    .add()
  .field('email', 'email', 'Email')
    .validate(new RequiredValidator(), new EmailValidator())
    .add()
  .build();

// Listen to form events (Observer Pattern)
form.on('submit', (event) => {
  if (event.valid) {
    console.log('Form submitted:', event.values);
  }
});

form.setValue('name', 'Alice');
form.setValue('email', 'alice@example.com');

const { valid, values } = await form.submit();
```

## Core Concepts & Design Patterns

### 1. Builder Pattern — `FormBuilder`

Allows step-by-step, fluent construction of a `Form` without large constructors or inconsistent intermediate states.

```typescript
const form = new FormBuilder('registration')
  .field('username', 'text', 'Username')
    .placeholder('Choose a username')
    .validate(new RequiredValidator(), new MinLengthValidator(3))
    .add()
  .group('address')
    .field('city', 'text', 'City').validate(new RequiredValidator()).add()
    .field('zip', 'text', 'ZIP').add()
  .end()
  .build(); // returns the final Form product
```

**Where implemented:** `src/builder/FormBuilder.ts`

---

### 2. Strategy Pattern — `Validator` interface

Encapsulates each validation algorithm as an interchangeable object. You can swap, combine, or add validators without changing `Field` or `Form`.

```typescript
import { Validator, ValidationResult } from 'formcraft';

// Custom Strategy — implement and plug in without touching library code
class StrongPasswordValidator implements Validator {
  readonly name = 'strongPassword';

  validate(value: unknown): ValidationResult {
    const str = String(value);
    const strong = /[A-Z]/.test(str) && /[0-9]/.test(str) && str.length >= 8;
    return strong
      ? { valid: true }
      : { valid: false, message: 'Password must have uppercase, number, and 8+ chars' };
  }
}

const form = new FormBuilder('signup')
  .field('password', 'text', 'Password')
    .validate(new RequiredValidator(), new StrongPasswordValidator())
    .add()
  .build();
```

**Where implemented:** `src/types/index.ts` (interface), `src/validators/` (implementations), `src/fields/Field.ts:validate()` (invocation)

**Built-in validators:** `RequiredValidator`, `EmailValidator`, `MinLengthValidator`, `MaxLengthValidator`, `RegexValidator`, `RangeValidator`

---

### 3. Composite Pattern — `Field` + `FieldGroup`

`Field` (Leaf) and `FieldGroup` (Composite) both implement the `FormComponent` interface. Client code handles them uniformly — `validate()`, `getValue()`, `reset()` work the same way whether called on a single field or a nested group.

```typescript
import { FieldGroup, Field, RequiredValidator } from 'formcraft';

// Reusable composite — extend FieldGroup without modifying the library
class AddressGroup extends FieldGroup {
  constructor(name: string) {
    super(name);
    this.add(new Field('street', { type: 'text', label: 'Street', validators: [new RequiredValidator()] }));
    this.add(new Field('city',   { type: 'text', label: 'City',   validators: [new RequiredValidator()] }));
    this.add(new Field('zip',    { type: 'text', label: 'ZIP' }));
  }
}

// Use it anywhere a FormComponent is expected
form._addComponent(new AddressGroup('shipping'));
form._addComponent(new AddressGroup('billing'));

// Validates all nested fields recursively
await form.validate();
```

**Where implemented:** `src/fields/Field.ts`, `src/fields/FieldGroup.ts`, `src/types/index.ts` (`FormComponent` interface)

---

### 4. Observer Pattern — `EventEmitter`

`Field` and `Form` extend `EventEmitter`, emitting events on value changes, validation, submission and reset. Consumers subscribe without coupling to the emitter's internals.

```typescript
// Listen to form-level events
const unsubscribe = form.on('submit', (event) => {
  console.log('Submitted:', event.values, 'Valid:', event.valid);
});

// Listen to individual field events
const nameField = form.getField('name');
nameField?.on('change', (event) => {
  console.log('Name changed to:', event.value);
});

nameField?.on('validate', (event) => {
  console.log('Field errors:', event.state.errors);
});

// Unsubscribe when done
unsubscribe();
```

**Where implemented:** `src/events/EventEmitter.ts`, consumed in `src/fields/Field.ts` and `src/Form.ts`

---

## Extensibility

The library follows the **Open/Closed Principle**: extend behavior by implementing provided interfaces, never by modifying library source.

| Extension Point | Interface to implement |
|---|---|
| Custom validator | `Validator` |
| Custom field type | Extend `Field` |
| Custom field group | Extend `FieldGroup` |

### Async validator example

```typescript
class UniqueEmailValidator implements Validator {
  readonly name = 'uniqueEmail';

  async validate(value: unknown): Promise<ValidationResult> {
    const taken = await checkEmailExists(String(value)); // your API call
    return taken
      ? { valid: false, message: 'Email already registered' }
      : { valid: true };
  }
}
```

## API Reference

### `FormBuilder`

| Method | Description |
|---|---|
| `field(name, type, label)` | Start a field definition |
| `group(name)` | Start a FieldGroup |
| `build()` | Construct and return the `Form` |

### `FieldBuilder` (returned by `FormBuilder.field()`)

| Method | Description |
|---|---|
| `.placeholder(text)` | Set placeholder text |
| `.defaultValue(value)` | Set initial value |
| `.options(opts)` | Set select options |
| `.validate(...validators)` | Attach validators (Strategy) |
| `.inGroup(groupName)` | Place field in a group |
| `.add()` | Finalize field, return to `FormBuilder` |

### `Form`

| Method | Description |
|---|---|
| `setValue(name, value)` | Set a field's value |
| `getValue(name?)` | Get one or all values |
| `validate()` | Validate all fields |
| `submit()` | Validate and emit submit event |
| `reset()` | Reset all fields to defaults |
| `getState()` | Get all field states |
| `getField(name)` | Get a `Field` instance |
| `getGroup(name)` | Get a `FieldGroup` instance |
| `on(event, listener)` | Subscribe to form events |

### Form Events: `submit` · `reset` · `change` · `validate`

### Field Events: `change` · `blur` · `focus` · `validate`

## Running the Examples

```bash
npm install
npx ts-node examples/basic-usage.ts
npx ts-node examples/custom-validator.ts
npx ts-node examples/custom-field-group.ts
```
