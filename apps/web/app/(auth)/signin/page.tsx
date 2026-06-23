"use client";

import { useState, useTransition } from "react";

import { signInEmail, signUpEmail } from "~/auth/actions";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSignIn() {
    setError(null);
    startTransition(async () => {
      // On success the action redirects server-side; only failures return here.
      const result = await signInEmail({ email, password });
      if (result?.error) setError(result.error);
    });
  }

  function handleSignUp() {
    setError(null);
    startTransition(async () => {
      const result = await signUpEmail({
        email,
        password,
        name: email.split("@")[0] ?? email,
      });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        handleSignIn();
      }}
    >
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground">Welcome back to ShipFlow AI</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="space-y-2">
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Please wait..." : "Sign in"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={isPending}
          onClick={handleSignUp}
        >
          Create account
        </Button>
      </div>
    </form>
  );
}
