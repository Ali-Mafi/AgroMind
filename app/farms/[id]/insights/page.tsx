import { FarmInformation } from "@/features/farms/components/farm-information";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <FarmInformation id={id} kind="insights" />; }
