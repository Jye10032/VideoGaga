import StudioWorkspace from "../../components/studio/StudioWorkspace";
import { parseStudioStep } from "../../lib/studio/navigation";
export default async function StudioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string | string[] }>;
}) {
  const { id } = await params;
  const { step } = await searchParams;
  return (
    <StudioWorkspace key={id} id={id} initialStep={parseStudioStep(step)} />
  );
}
