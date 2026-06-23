import { getServerSession } from "../../../auth/actions/index";

export default async function DashboardPage() {
  const session = await getServerSession();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Signed in as {session?.user.email}
      </p>
    </div>
  );
}
