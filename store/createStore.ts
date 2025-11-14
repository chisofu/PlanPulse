import { useSyncExternalStore } from 'react';

type SetState<T> = (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
type GetState<T> = () => T;
type Subscriber = () => void;

type StateCreator<T> = (set: SetState<T>, get: GetState<T>) => T;

type Selector<T, U> = (state: T) => U;

export interface StoreApi<T> {
  getState: GetState<T>;
  setState: SetState<T>;
  subscribe: (listener: Subscriber) => () => void;
}

export function createStore<T>(initializer: StateCreator<T>) {
  let state: T;
  const listeners = new Set<Subscriber>();

  const getState: GetState<T> = () => state;

  const setState: SetState<T> = (partial) => {
    const partialState = typeof partial === 'function' ? (partial as (s: T) => Partial<T>)(state) : partial;
    const nextState = { ...state, ...partialState };
    if (nextState !== state) {
      state = nextState;
      listeners.forEach((listener) => listener());
    }
  };

  const subscribe = (listener: Subscriber) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  state = initializer(setState, getState);

  const useStore = <U>(selector: Selector<T, U> = (s) => s as unknown as U): U =>
    useSyncExternalStore(subscribe, () => selector(state), () => selector(state));

  return Object.assign(useStore, {
    getState,
    setState,
    subscribe,
  });
}
