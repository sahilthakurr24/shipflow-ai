"use server";

import { DEFAULT_AUTH_CALLBACK, SIGN_IN_PATH } from "../../utils/index";
import { auth } from "@repo/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { SignInValues, SignUpValues } from "./model";

export type AuthActionResult = { error: string } | undefined;

export async function signInEmail(values: SignInValues): Promise<AuthActionResult> {
  try {
    await auth.api.signInEmail({
      body: { email: values.email, password: values.password },
      headers: await headers(),
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to sign in" };
  }

  // Outside the try/catch so the redirect's control-flow throw isn't swallowed.
  redirect(DEFAULT_AUTH_CALLBACK);
}

export async function signUpEmail(values: SignUpValues): Promise<AuthActionResult> {
  try {
    await auth.api.signUpEmail({
      body: { email: values.email, password: values.password, name: values.name },
      headers: await headers(),
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to create account" };
  }

  redirect(DEFAULT_AUTH_CALLBACK);
}

export async function getServerSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requiredAuth(redirectsTo = SIGN_IN_PATH) {
  const session = await getServerSession();
  if (!session) {
    redirect(redirectsTo);
  }

  return session;
}

export async function requiredUnAuth(redirectsTo = DEFAULT_AUTH_CALLBACK) {
  const session = await getServerSession();
  if (session) {
    redirect(redirectsTo);
  }
}
