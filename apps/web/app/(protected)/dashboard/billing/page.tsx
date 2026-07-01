"use client";

import * as React from "react";
import Script from "next/script";
import { skipToken } from "@tanstack/react-query";
import { Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  useCancelSubscription,
  useCreateCheckoutSubscription,
  useListPayments,
  useListPlans,
} from "~/hooks/api/billing";
import { useOrganization } from "~/providers/organization";
import { trpc } from "~/trpc/client";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const PLAN_LABEL: Record<string, string> = { free: "Free", pro: "Pro", enterprise: "Enterprise" };

function formatRupees(amountInPaise: number) {
  return `₹${(amountInPaise / 100).toFixed(2)}`;
}

function formatPlanPrice(plan: { amount: number | null; period: string } | undefined) {
  if (!plan || plan.amount === null) return "Custom";
  return `${formatRupees(plan.amount)}/${plan.period === "monthly" ? "mo" : plan.period}`;
}

export default function BillingPage() {
  const { activeOrg, activeOrgId } = useOrganization();
  const canManage = activeOrg?.role === "owner" || activeOrg?.role === "admin";

  const [checkoutState, setCheckoutState] = React.useState<"idle" | "processing">("idle");
  const [scriptReady, setScriptReady] = React.useState(false);

  // Polling directly via trpc (not the shared hook) so we can flip on refetchInterval
  // only while "processing" — the browser checkout callback is not proof of payment,
  // so we wait for the webhook-confirmed row to actually flip to "active".
  const { data: subscriptionData, isLoading: isSubscriptionLoading } =
    trpc.billing.getSubscription.useQuery(activeOrgId ? { organizationId: activeOrgId } : skipToken, {
      refetchInterval: checkoutState === "processing" ? 2000 : false,
    });
  const subscription = subscriptionData?.subscription;

  const { payments, isLoading: isPaymentsLoading } = useListPayments(
    activeOrgId ? { organizationId: activeOrgId } : skipToken,
  );

  const { plans } = useListPlans();
  const planByTier = React.useMemo(() => {
    const map: Partial<Record<string, (typeof plans)[number]>> = {};
    for (const plan of plans) map[plan.tier] = plan;
    return map;
  }, [plans]);

  const { createCheckoutSubscriptionAsync, isPending: isCheckoutStarting } =
    useCreateCheckoutSubscription();
  const { cancelSubscriptionAsync, isPending: isCancelling } = useCancelSubscription();

  // Once the webhook confirms activation, stop polling and let the user know.
  React.useEffect(() => {
    if (checkoutState === "processing" && subscription?.plan === "pro" && subscription.status === "active") {
      setCheckoutState("idle");
      toast.success("You're on Pro!");
    }
  }, [checkoutState, subscription]);

  async function upgradeToPro() {
    if (!activeOrgId) return;
    if (!scriptReady || typeof window === "undefined" || !window.Razorpay) {
      toast.error("Checkout is still loading, try again in a moment.");
      return;
    }

    try {
      const { razorpaySubscriptionId, razorpayKeyId } = await createCheckoutSubscriptionAsync({
        organizationId: activeOrgId,
      });

      const razorpay = new window.Razorpay({
        key: razorpayKeyId,
        subscription_id: razorpaySubscriptionId,
        name: "ShipFlow AI",
        description: "Pro plan subscription",
        handler: () => {
          // The checkout modal closing "successfully" is not proof of payment —
          // only the signed webhook may mark the subscription active. This just
          // starts polling for that confirmation.
          setCheckoutState("processing");
        },
        modal: {
          ondismiss: () => setCheckoutState("idle"),
        },
      });
      razorpay.open();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start checkout");
    }
  }

  async function cancelSubscription() {
    if (!activeOrgId) return;
    try {
      await cancelSubscriptionAsync({ organizationId: activeOrgId, cancelAtPeriodEnd: true });
      toast.success("Your subscription will end at the current period's end.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to cancel subscription");
    }
  }

  const currentPlan = subscription?.plan ?? "free";
  const isProActive = currentPlan === "pro" && subscription?.status === "active";
  const creditsTotal = subscription?.aiReviewCreditsTotal ?? 0;
  const creditsUsed = subscription?.aiReviewCreditsUsed ?? 0;
  const creditsPct = creditsTotal > 0 ? Math.min(100, Math.round((creditsUsed / creditsTotal) * 100)) : 0;

  if (!activeOrg) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onLoad={() => setScriptReady(true)}
      />

      <header>
        <h2 className="text-2xl font-semibold tracking-tight">Billing</h2>
        <p className="text-muted-foreground text-sm">
          Plans, usage, and invoices for your organization.
        </p>
      </header>

      {/* Plans */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className={currentPlan === "free" ? "border-primary/50" : undefined}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Free</CardTitle>
              {currentPlan === "free" ? <Badge variant="secondary">Current plan</Badge> : null}
            </div>
            <CardDescription>
              {planByTier.free?.description ?? "For trying ShipFlow AI out."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground flex flex-col gap-1.5 text-sm">
            <p>{formatPlanPrice(planByTier.free)}</p>
            <p>{planByTier.free?.seats ?? 1} seat(s)</p>
            <p>{planByTier.free?.repositoryLimit ?? 1} repositor(y/ies)</p>
            <p>{planByTier.free?.aiReviewCreditsTotal ?? 50} AI review credits / month</p>
          </CardContent>
        </Card>

        <Card className={isProActive ? "border-primary/50" : undefined}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-1.5 text-base">
                <Sparkles className="size-4" /> Pro
              </CardTitle>
              {isProActive ? <Badge variant="secondary">Current plan</Badge> : null}
            </div>
            <CardDescription>
              {planByTier.pro?.description ?? "For teams shipping regularly."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground flex flex-col gap-1.5 text-sm">
            <p>{formatPlanPrice(planByTier.pro)}</p>
            <p>{planByTier.pro?.seats ?? 10} seats</p>
            <p>{planByTier.pro?.repositoryLimit ?? 10} repositories</p>
            <p>{planByTier.pro?.aiReviewCreditsTotal ?? 500} AI review credits / month</p>
          </CardContent>
          <CardFooter>
            {isProActive ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={!canManage || isCancelling || subscription?.cancelAtPeriodEnd}
                  >
                    {isCancelling ? <Loader2 className="animate-spin" /> : null}
                    {subscription?.cancelAtPeriodEnd ? "Cancels at period end" : "Cancel subscription"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel your Pro subscription?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You&apos;ll keep Pro access until the end of the current billing period, then
                      your organization moves back to the Free plan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Pro</AlertDialogCancel>
                    <AlertDialogAction onClick={cancelSubscription}>
                      Cancel subscription
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button
                className="w-full"
                onClick={upgradeToPro}
                disabled={!canManage || isCheckoutStarting || checkoutState === "processing"}
              >
                {isCheckoutStarting || checkoutState === "processing" ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                {checkoutState === "processing" ? "Confirming payment…" : "Upgrade to Pro"}
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card className={currentPlan === "enterprise" ? "border-primary/50" : undefined}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Enterprise</CardTitle>
              {currentPlan === "enterprise" ? <Badge variant="secondary">Current plan</Badge> : null}
            </div>
            <CardDescription>
              {planByTier.enterprise?.description ?? "Custom limits, SSO, and support."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground flex flex-col gap-1.5 text-sm">
            <p>{formatPlanPrice(planByTier.enterprise)}</p>
            <p>{planByTier.enterprise?.seats ?? "Custom"} seats</p>
            <p>{planByTier.enterprise?.repositoryLimit ?? "Custom"} repositories</p>
            <p>{planByTier.enterprise?.aiReviewCreditsTotal ?? "Custom"} AI review credits</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <a href="mailto:sales@shipflow.ai?subject=Enterprise%20plan">Contact sales</a>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI review usage</CardTitle>
          <CardDescription>
            {creditsUsed} of {creditsTotal} credits used this period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSubscriptionLoading ? (
            <Skeleton className="h-2 w-full" />
          ) : (
            <Progress value={creditsPct} />
          )}
        </CardContent>
      </Card>

      {/* Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payments</CardTitle>
          <CardDescription>Recent charges for this organization.</CardDescription>
        </CardHeader>
        <CardContent>
          {isPaymentsLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : payments.length === 0 ? (
            <p className="text-muted-foreground text-sm">No payments yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{formatRupees(payment.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={payment.status === "captured" ? "secondary" : "outline"}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{payment.method ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!canManage ? (
        <p className="text-muted-foreground text-sm italic">
          Only owners and admins can change the plan or cancel the subscription for {PLAN_LABEL[currentPlan]}.
        </p>
      ) : null}
    </div>
  );
}
