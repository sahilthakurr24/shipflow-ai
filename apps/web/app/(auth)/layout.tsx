import { requiredUnAuth } from "~/auth/actions";

export async function AuthLayout({ children }: { children: React.ReactNode }) {
  await requiredUnAuth();

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center lg-muted/40 px-4 py-12">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
