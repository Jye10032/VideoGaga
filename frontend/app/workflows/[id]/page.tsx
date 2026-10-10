import { redirect } from "next/navigation";
export default async function LegacyWorkflow({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  redirect(`/studio/${encodeURIComponent(id)}`);
}
