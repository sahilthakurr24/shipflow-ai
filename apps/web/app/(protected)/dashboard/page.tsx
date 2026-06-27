import { getServerSession } from "../../../auth/actions/index";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

const stats = [
  { label: "Open feature requests", value: "—" },
  { label: "PRDs in progress", value: "—" },
  { label: "Pull requests awaiting review", value: "—" },
];

export default async function DashboardPage() {
  const session = await getServerSession();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
        <p className="text-muted-foreground text-sm">
          Signed in as {session?.user.email}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-3xl">{stat.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Get started</CardTitle>
          <CardDescription>
            Connect a repository and submit your first feature request to kick off the
            delivery flow.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
