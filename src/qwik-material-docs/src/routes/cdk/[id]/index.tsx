import type {RequestHandler} from '@qwik.dev/router';

export const onGet: RequestHandler = ({redirect, params}) => {
  throw redirect(302, `/cdk/${params.id}/overview/`);
};
