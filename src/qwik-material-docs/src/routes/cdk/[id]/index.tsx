import type {RequestHandler} from '@qwik.dev/router';
import {withBase} from '../../../lib/base-path';

export const onGet: RequestHandler = ({redirect, params}) => {
  throw redirect(302, withBase(`/cdk/${params.id}/overview/`));
};
