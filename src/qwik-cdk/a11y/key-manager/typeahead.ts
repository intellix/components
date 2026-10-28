/**
 * Qwik port of `src/cdk/a11y/key-manager/typeahead.ts`. Upstream implements
 * the letter-buffer/debounce machinery with an RxJS `Subject` pipeline
 * (`tap` + `debounceTime` + `filter` + `map`); this port reproduces the same
 * externally-observable behaviour (type several letters within the debounce
 * window, find the first non-skipped item whose label starts with the
 * buffered string, starting the search right after the current selection)
 * using a plain `setTimeout` debounce instead, since qwik-cdk has no RxJS
 * dependency.
 */
import {A, NINE, Z, ZERO} from '../../keycodes';

const DEFAULT_TYPEAHEAD_DEBOUNCE_INTERVAL_MS = 200;

interface TypeaheadItem {
  getLabel?(): string;
}

interface TypeaheadConfig<T> {
  debounceInterval?: number;
  skipPredicate?: (item: T) => boolean | undefined;
  /** Called with the item that matched the typed sequence. */
  onSelect: (item: T) => void;
}

/**
 * Selects items based on keyboard input. Implements the typeahead
 * functionality of `role="menu"`/`role="listbox"`/`role="tree"` and other
 * related roles.
 */
export interface Typeahead<T> {
  handleKey(event: KeyboardEvent): void;
  isTyping(): boolean;
  reset(): void;
  setCurrentSelectedItemIndex(index: number): void;
  setItems(items: readonly T[]): void;
  destroy(): void;
}

export function createTypeahead<T extends TypeaheadItem>(
  initialItems: readonly T[],
  config: TypeaheadConfig<T>,
): Typeahead<T> {
  const debounceInterval =
    typeof config.debounceInterval === 'number'
      ? config.debounceInterval
      : DEFAULT_TYPEAHEAD_DEBOUNCE_INTERVAL_MS;
  const skipPredicateFn = config.skipPredicate;

  let items: readonly T[] = initialItems;
  let selectedItemIndex = -1;
  let pressedLetters: string[] = [];
  let timer: ReturnType<typeof setTimeout> | undefined;

  function runSearch(): void {
    const inputString = pressedLetters.join('').toLocaleUpperCase();
    pressedLetters = [];
    if (!inputString) return;

    // Start at 1 because we want to start searching at the item immediately
    // following the current active item.
    for (let i = 1; i < items.length + 1; i++) {
      const index = (selectedItemIndex + i) % items.length;
      const item = items[index];

      if (
        !skipPredicateFn?.(item) &&
        item.getLabel?.().toLocaleUpperCase().trim().indexOf(inputString) === 0
      ) {
        config.onSelect(item);
        break;
      }
    }
  }

  return {
    handleKey(event: KeyboardEvent): void {
      const keyCode = event.keyCode;
      let letter: string | undefined;

      // Attempt to use `event.key` (also maps to the user's keyboard
      // language); otherwise fall back to resolving alphanumeric characters
      // via the (deprecated but still populated) `keyCode`.
      if (event.key && event.key.length === 1) {
        letter = event.key.toLocaleUpperCase();
      } else if ((keyCode >= A && keyCode <= Z) || (keyCode >= ZERO && keyCode <= NINE)) {
        letter = String.fromCharCode(keyCode);
      }
      if (!letter) return;

      pressedLetters.push(letter);
      if (timer != null) clearTimeout(timer);
      timer = setTimeout(runSearch, debounceInterval);
    },
    isTyping(): boolean {
      return pressedLetters.length > 0;
    },
    reset(): void {
      pressedLetters = [];
    },
    setCurrentSelectedItemIndex(index: number): void {
      selectedItemIndex = index;
    },
    setItems(newItems: readonly T[]): void {
      items = newItems;
    },
    destroy(): void {
      pressedLetters = [];
      if (timer != null) clearTimeout(timer);
    },
  };
}
