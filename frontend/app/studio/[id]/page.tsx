import StudioWorkspace from "../../components/studio/StudioWorkspace";
export default async function StudioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StudioWorkspace key={id} id={id} />;
}
