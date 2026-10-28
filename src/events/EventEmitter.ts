export type Listener<T> = (payload: T) => void;
export type Unsubscribe = () => void;

/**
 * Observer — o "Subject" genérico usado por Field e Form.
 *
 * `Events` é um mapa { nomeDoEvento: tipoDoPayload }, então cada `on()`
 * recebe o payload já tipado. A classe é interna: Field e Form a usam por
 * composição e expõem só `on()`, assim apenas a biblioteca dispara eventos.
 */
export class EventEmitter<Events extends object> {
  private readonly listeners: { [K in keyof Events]?: Set<Listener<Events[K]>> } = {};

  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): Unsubscribe {
    const set = this.listeners[event] ?? new Set<Listener<Events[K]>>();
    this.listeners[event] = set;
    set.add(listener);
    return () => {
      set.delete(listener);
    };
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    // Copia antes de iterar: um ouvinte pode cancelar a inscrição durante o emit.
    [...(this.listeners[event] ?? [])].forEach(listener => listener(payload));
  }
}
