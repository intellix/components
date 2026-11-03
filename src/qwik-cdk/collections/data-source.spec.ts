import {describe, expect, it, vi} from 'vitest';
import {ArrayDataSource} from './array-data-source';
import {createNoopCollectionViewer, DataSource, isDataSource} from './data-source';
import {subscribableOf} from './subscribable';

describe('isDataSource', () => {
  it('returns true for an ArrayDataSource', () => {
    expect(isDataSource(new ArrayDataSource([1, 2, 3]))).toBe(true);
  });

  it('returns true for any object with a connect function', () => {
    expect(isDataSource({connect: () => subscribableOf([])})).toBe(true);
  });

  it('returns false for a plain array', () => {
    expect(isDataSource([1, 2, 3])).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(isDataSource(null)).toBe(false);
    expect(isDataSource(undefined)).toBe(false);
  });
});

describe('ArrayDataSource', () => {
  it('connect() synchronously replays the wrapped array', () => {
    const source = new ArrayDataSource([1, 2, 3]);
    const seen: (readonly number[])[] = [];
    const unsubscribe = source.connect().subscribe(value => seen.push(value));

    expect(seen).toEqual([[1, 2, 3]]);
    unsubscribe();
    source.disconnect();
  });

  it('forwards a Subscribable source as-is', () => {
    let observer: ((value: readonly number[]) => void) | undefined;
    const subscribable = {
      subscribe(cb: (value: readonly number[]) => void) {
        observer = cb;
        return () => (observer = undefined);
      },
    };
    const source = new ArrayDataSource(subscribable);
    const seen: (readonly number[])[] = [];
    source.connect().subscribe(value => seen.push(value));

    expect(seen).toEqual([]);
    observer?.([4, 5]);
    expect(seen).toEqual([[4, 5]]);
  });
});

describe('DataSource (abstract class)', () => {
  it('can be subclassed like upstream', () => {
    class FakeDataSource extends DataSource<string> {
      connect() {
        return subscribableOf(['a', 'b']);
      }
      disconnect() {}
    }

    const source = new FakeDataSource();
    expect(isDataSource(source)).toBe(true);
    const spy = vi.fn();
    source.connect(createNoopCollectionViewer()).subscribe(spy);
    expect(spy).toHaveBeenCalledWith(['a', 'b']);
  });
});

describe('createNoopCollectionViewer', () => {
  it('never emits on viewChange, and unsubscribe is a no-op', () => {
    const viewer = createNoopCollectionViewer();
    const spy = vi.fn();
    const unsubscribe = viewer.viewChange.subscribe(spy);
    expect(spy).not.toHaveBeenCalled();
    expect(() => unsubscribe()).not.toThrow();
  });
});
