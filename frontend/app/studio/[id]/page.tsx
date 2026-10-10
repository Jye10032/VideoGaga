import StudioWorkspace from "../../components/studio/StudioWorkspace";
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
    <StudioWorkspace key={id} id={id} initialStep={step === "assets" ? 1 : 0} />
  );
}
