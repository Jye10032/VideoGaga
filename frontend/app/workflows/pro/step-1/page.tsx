import { redirect } from "next/navigation";
export default async function LegacyWorkflow({searchParams}:{searchParams?:Promise<{pid?:string}>}){
  const params=await searchParams;
  redirect(params?.pid ? `/studio/${encodeURIComponent(params.pid)}` : "/projects");
}
