"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { authClient } from "~/lib/auth-client";
import { cn } from "~/lib/utils";

const DASHBOARD = "/dashboard";

const COPY = {
  signin: {
    title: "Welcome back",
    description: "Sign in to your ShipFlow AI account",
    submit: "Sign in",
    github: "Sign in with GitHub",
    altText: "Don't have an account?",
    altHref: "/signup",
    altLabel: "Sign up",
  },
  signup: {
    title: "Create your account",
    description: "Start shipping faster with ShipFlow AI",
    submit: "Create account",
    github: "Sign up with GitHub",
    altText: "Already have an account?",
    altHref: "/signin",
    altLabel: "Sign in",
  },
} as const;

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

export function AuthForm({
  mode,
  className,
  ...props
}: { mode: "signin" | "signup" } & React.ComponentProps<"div">) {
  const router = useRouter();
  const copy = COPY[mode];

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isGithubPending, setIsGithubPending] = useState(false);

  const disabled = isPending || isGithubPending;

  async function handleEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);

    const { error } =
      mode === "signup"
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password });

    if (error) {
      toast.error(error.message ?? "Something went wrong. Please try again.");
      setIsPending(false);
      return;
    }

    toast.success(mode === "signup" ? "Account created" : "Signed in");
    router.push(DASHBOARD);
    router.refresh();
  }

  async function handleGithub() {
    setIsGithubPending(true);
    try {
      // Redirects to GitHub on success, then back to `callbackURL`.
      await authClient.signIn.social({ provider: "github", callbackURL: DASHBOARD });
    } catch {
      toast.error("Could not continue with GitHub. Please try again.");
      setIsGithubPending(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{copy.title}</CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailSubmit}>
            <FieldGroup>
              <Field>
                <Button variant="outline" type="button" onClick={handleGithub} disabled={disabled}>
                  {isGithubPending ? <Loader2 className="animate-spin" /> : <GithubIcon />}
                  {copy.github}
                </Button>
              </Field>

              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with email
              </FieldSeparator>

              {mode === "signup" ? (
                <Field>
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <Input
                    id="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Ada Lovelace"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    disabled={disabled}
                  />
                </Field>
              ) : null}

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  disabled={disabled}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                  disabled={disabled}
                />
                {mode === "signup" ? (
                  <FieldDescription>Must be at least 8 characters.</FieldDescription>
                ) : null}
              </Field>

              <Field>
                <Button type="submit" disabled={disabled}>
                  {isPending ? <Loader2 className="animate-spin" /> : null}
                  {copy.submit}
                </Button>
                <FieldDescription className="text-center">
                  {copy.altText}{" "}
                  <Link href={copy.altHref} className="underline underline-offset-4">
                    {copy.altLabel}
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </FieldDescription>
    </div>
  );
}
