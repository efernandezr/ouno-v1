import { UserList } from "@/components/admin/UserList";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-muted-foreground">
          Manage user accounts and roles
        </p>
      </header>
      <UserList />
    </div>
  );
}
