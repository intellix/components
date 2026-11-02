import {component$} from '@qwik.dev/core';
import {routeLoader$, type StaticGenerateHandler} from '@qwik.dev/router';
import {CDK_ENTRIES} from '../../../../data/cdk';
import {loadCdkApi} from '../../../../lib/api-registry';
import ApiReference from '../../../../components/api-reference';

export const useApiData = routeLoader$(async ({params}) => {
  const entry = CDK_ENTRIES.find(c => c.id === params.id);
  if (!entry) return null;
  return loadCdkApi(entry.id);
});

export default component$(() => {
  const data = useApiData().value;
  if (!data) return null;
  return <ApiReference data={data} />;
});

export const onStaticGenerate: StaticGenerateHandler = () => {
  return {params: CDK_ENTRIES.map(c => ({id: c.id}))};
};
