import type { Metadata } from "next";

import { AuthForm } from "~/components/auth-form";

export const metadata: Metadata = {
  title: "Sign up · ShipFlow AI",
};

export default function SignUpPage() {
  return <AuthForm mode="signup" />;
}
