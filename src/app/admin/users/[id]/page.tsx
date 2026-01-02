import { UserDetail } from "@/components/admin/UserDetail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <UserDetail userId={id} />
    </div>
  );
}
