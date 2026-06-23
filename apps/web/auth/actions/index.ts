"use server";

import { DEFAULT_AUTH_CALLBACK, SIGN_IN_PATH } from "~/utils";
import { auth } from "@repo/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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
