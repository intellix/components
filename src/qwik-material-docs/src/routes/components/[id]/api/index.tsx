import {component$} from '@qwik.dev/core';
import {routeLoader$, type StaticGenerateHandler} from '@qwik.dev/router';
import {COMPONENTS} from '../../../../data/components';
import {loadMaterialApi} from '../../../../lib/api-registry';
import ApiReference from '../../../../components/api-reference';

export const useApiData = routeLoader$(async ({params}) => {
  const entry = COMPONENTS.find(c => c.id === params.id);
  if (!entry) return null;
  return loadMaterialApi(entry.entryPoint);
});

export default component$(() => {
  const data = useApiData().value;
  if (!data) return null;
  return <ApiReference data={data} />;
});

export const onStaticGenerate: StaticGenerateHandler = () => {
  return {params: COMPONENTS.map(c => ({id: c.id}))};
};
