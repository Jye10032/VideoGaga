import ProjectLibrary from "../components/studio/ProjectLibrary";
export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ create?: string }>;
}) {
  const { create } = await searchParams;
  return <ProjectLibrary initialCreate={create === "1"} />;
}
