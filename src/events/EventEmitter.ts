// Observer Pattern: permite que objetos se inscrevam e recebam notificações
// de eventos sem acoplamento direto entre emissores e ouvintes.
export type EventListener<T> = (event: T) => void;

export class EventEmitter<TEvents extends Record<string, unknown>> {
  private listeners: {
    [K in keyof TEvents]?: Array<EventListener<TEvents[K]>>;
  } = {};

  // Inscreve um ouvinte (Observer) para um tipo de evento
  on<K extends keyof TEvents>(eventType: K, listener: EventListener<TEvents[K]>): () => void {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }
    this.listeners[eventType]!.push(listener);

    // Retorna função para cancelar inscrição (unsubscribe)
    return () => this.off(eventType, listener);
  }

  // Remove um ouvinte específico
  off<K extends keyof TEvents>(eventType: K, listener: EventListener<TEvents[K]>): void {
    const handlers = this.listeners[eventType];
    if (!handlers) return;
    this.listeners[eventType] = handlers.filter(h => h !== listener) as typeof handlers;
  }

  // Notifica todos os ouvintes inscritos (Subject notifica Observers)
  emit<K extends keyof TEvents>(eventType: K, event: TEvents[K]): void {
    const handlers = this.listeners[eventType];
    if (!handlers) return;
    handlers.forEach(handler => handler(event));
  }

  // Remove todos os ouvintes de um tipo de evento
  removeAllListeners<K extends keyof TEvents>(eventType?: K): void {
    if (eventType) {
      delete this.listeners[eventType];
    } else {
      this.listeners = {};
    }
  }
}
