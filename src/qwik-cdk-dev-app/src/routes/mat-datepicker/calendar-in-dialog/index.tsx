import {component$} from '@qwik.dev/core';
import {CalendarInDialog} from '../../../scenarios/_calendar-in-dialog';

// Qwik-only: see `CalendarInDialog`. Opened from a server-rendered `MatButton`.
export default component$(() => <CalendarInDialog serverButton />);
