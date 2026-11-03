import {DataSource} from './data-source';
import {isSubscribable, subscribableOf, type Subscribable} from './subscribable';

/** `DataSource` wrapper for a native array (or a `Subscribable` of one). */
export class ArrayDataSource<T> extends DataSource<T> {
  constructor(private _data: readonly T[] | Subscribable<readonly T[]>) {
    super();
  }

  connect(): Subscribable<readonly T[]> {
    return isSubscribable(this._data) ? this._data : subscribableOf(this._data);
  }

  disconnect() {}
}
