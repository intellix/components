import {component$} from '@qwik.dev/core';
import {CalendarInDialog} from '../../../scenarios/_calendar-in-dialog';

// Qwik-only: see `CalendarInDialog`. Opened from a native `<button>` — no button CSS until the
// calendar brings it.
export default component$(() => <CalendarInDialog serverButton={false} />);
