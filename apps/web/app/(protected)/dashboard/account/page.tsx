"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";

import { ModeToggle } from "~/components/mode-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";
import { authClient } from "~/lib/auth-client";

function initialsOf(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return initials || "U";
}

export default function AccountPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  const [name, setName] = React.useState("");
  const [image, setImage] = React.useState("");
  const [savingProfile, setSavingProfile] = React.useState(false);

  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [savingPassword, setSavingPassword] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);

  // Seed profile fields once the session loads.
  const seeded = React.useRef(false);
  React.useEffect(() => {
    if (user && !seeded.current) {
      seeded.current = true;
      setName(user.name ?? "");
      setImage(user.image ?? "");
    }
  }, [user]);

  async function saveProfile() {
    if (!name.trim()) {
      toast.error("Name can't be empty");
      return;
    }
    setSavingProfile(true);
    try {
      await authClient.updateUser({ name: name.trim(), image: image.trim() || undefined });
      toast.success("Profile updated");
      // The sidebar user (server-rendered from the session) refreshes.
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword() {
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirm) {
      toast.error("New passwords don't match");
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await authClient.changePassword({ currentPassword, newPassword });
      if (error) throw new Error(error.message ?? "Failed to change password");
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      toast.success("Password changed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  }

  async function signOutOthers() {
    setSigningOut(true);
    try {
      await authClient.revokeOtherSessions();
      toast.success("Signed out of all other devices");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to sign out other devices");
    } finally {
      setSigningOut(false);
    }
  }

  if (isPending) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight">Account</h2>
        <p className="text-muted-foreground text-sm">Manage your personal profile and security.</p>
      </header>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-14 rounded-xl">
              <AvatarImage src={image} alt={name} />
              <AvatarFallback className="rounded-xl text-lg">{initialsOf(name)}</AvatarFallback>
            </Avatar>
            <div className="text-muted-foreground text-sm">
              <p className="text-foreground font-medium">{name || "Your name"}</p>
              <p>{user?.email}</p>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="image">Avatar URL</Label>
            <Input
              id="image"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://…"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email ?? ""} disabled />
            <p className="text-muted-foreground/70 text-xs">
              Email is managed by your login and can&apos;t be changed here.
            </p>
          </div>

          <Button onClick={saveProfile} disabled={savingProfile} className="self-start">
            {savingProfile ? <Loader2 className="animate-spin" /> : <Check className="size-4" />}
            Save changes
          </Button>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Theme</p>
            <p className="text-muted-foreground text-sm">
              Choose light, dark, or match your system.
            </p>
          </div>
          <ModeToggle />
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Security</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="current">Current password</Label>
            <Input
              id="current"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="new">New password</Label>
            <Input
              id="new"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="confirm">Confirm new password</Label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <Button
            onClick={changePassword}
            disabled={savingPassword || !currentPassword || !newPassword}
            className="self-start"
          >
            {savingPassword ? <Loader2 className="animate-spin" /> : null}
            Change password
          </Button>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <div>
              <p className="text-sm font-medium">Other devices</p>
              <p className="text-muted-foreground text-sm">
                Sign out everywhere except this device.
              </p>
            </div>
            <Button variant="outline" onClick={signOutOthers} disabled={signingOut}>
              {signingOut ? <Loader2 className="animate-spin" /> : <LogOut className="size-4" />}
              Sign out other devices
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
