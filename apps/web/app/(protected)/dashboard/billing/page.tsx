import { CreditCard, FileText, Gauge, Sparkles } from "lucide-react";

import { Card, CardContent } from "~/components/ui/card";

const UPCOMING = [
  {
    icon: Sparkles,
    title: "Plans & subscriptions",
    description: "Pick a plan and manage upgrades.",
  },
  { icon: Gauge, title: "Usage-based AI review", description: "Track AI review and PRD usage." },
  {
    icon: FileText,
    title: "Invoices & payment methods",
    description: "Download invoices, manage cards.",
  },
];

export default function BillingPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight">Billing</h2>
        <p className="text-muted-foreground text-sm">
          Plans, usage, and invoices for your organization.
        </p>
      </header>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
          <span className="border-border bg-card text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium shadow-sm">
            <span className="relative flex size-2">
              <span className="bg-primary/60 absolute inline-flex size-full animate-ping rounded-full opacity-75" />
              <span className="bg-primary relative inline-flex size-2 rounded-full" />
            </span>
            Coming soon
          </span>

          <span className="bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-2xl shadow-sm">
            <CreditCard className="size-6" />
          </span>

          <div className="space-y-1">
            <p className="text-lg font-semibold tracking-tight">Billing is coming soon</p>
            <p className="text-muted-foreground mx-auto max-w-md text-sm">
              Subscriptions, usage-based pricing, and invoices aren&apos;t available yet — your
              workspace stays fully usable in the meantime.
            </p>
          </div>

          <div className="mt-2 grid w-full max-w-xl gap-3 sm:grid-cols-3">
            {UPCOMING.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="border-border/70 flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center"
                >
                  <Icon className="text-muted-foreground size-4" />
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-muted-foreground/80 text-xs">{item.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
