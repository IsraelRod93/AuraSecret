import { redirect } from 'next/navigation';

export default async function DashboardPage({ params }: { params: Promise<{ companionId: string }> }) {
  const { companionId } = await params;
  redirect(`/panel/${companionId}`);
}
