import type {RequestHandler} from '@qwik.dev/router';

export const onGet: RequestHandler = ({redirect, params}) => {
  throw redirect(302, `/components/${params.id}/overview/`);
};
