import { PrintExportPage } from "@/modules/exports/components/print-export-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PrintExportPage id={id} />;
}
