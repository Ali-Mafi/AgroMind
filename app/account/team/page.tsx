import { TeamManagement } from "@/features/collaboration/components/team-management";
import { readTeamOverview } from "@/features/collaboration/services/data";

export const dynamic = "force-dynamic";

export default async function Page() {
  const overview = await readTeamOverview();
  return <TeamManagement initialOverview={overview} />;
}
