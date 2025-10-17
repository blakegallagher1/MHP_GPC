import EventEmitter from 'eventemitter3';

export type DomainEvent =
  | { type: 'lead.created'; payload: { leadId: string } }
  | { type: 'lead.updated'; payload: { leadId: string; stage: string } }
  | { type: 'deal.updated'; payload: { dealId: string; stage: string } }
  | { type: 'deal.rescored'; payload: { dealId: string } };

class DomainEventBus extends EventEmitter<DomainEvent['type']> {
  emitEvent(event: DomainEvent): boolean {
    return this.emit(event.type, event.payload);
  }

  onEvent<T extends DomainEvent['type']>(type: T, listener: (payload: Extract<DomainEvent, { type: T }>['payload']) => void) {
    this.on(type, listener as any);
  }
}

export const eventBus = new DomainEventBus();
