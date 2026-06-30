"use client";

import { trpc } from "~/trpc/client";

// queries
export function useListInvitations(
  input: Parameters<typeof trpc.invitation.listInvitations.useQuery>[0],
) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.invitation.listInvitations.useQuery(input);
  return {
    invitations: data?.invitations ?? [],
    error,
    isFetched,
    isFetching,
    isLoading,
    refetch,
    status,
  };
}

export function useGetInvitationByToken(
  input: Parameters<typeof trpc.invitation.getInvitationByToken.useQuery>[0],
) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.invitation.getInvitationByToken.useQuery(input);
  return {
    invitation: data?.invitation,
    organization: data?.organization ?? null,
    invitedByName: data?.invitedByName ?? null,
    error,
    isFetched,
    isFetching,
    isLoading,
    refetch,
    status,
  };
}

// mutations
export function useCreateInvitation() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: createInvitationAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.invitation.createInvitation.useMutation({
    onSuccess: async () => {
      await utils.invitation.listInvitations.invalidate();
    },
  });
  return { createInvitationAsync, error, isError, isIdle, isPending, isSuccess, status };
}

export function useRevokeInvitation() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: revokeInvitationAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.invitation.revokeInvitation.useMutation({
    onSuccess: async () => {
      await utils.invitation.listInvitations.invalidate();
    },
  });
  return { revokeInvitationAsync, error, isError, isIdle, isPending, isSuccess, status };
}

export function useAcceptInvitation() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: acceptInvitationAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.invitation.acceptInvitation.useMutation({
    onSuccess: async () => {
      // Joining changes the user's orgs and the org's member list.
      await Promise.all([
        utils.organization.getUserOrganizations.invalidate(),
        utils.membership.listOrganizationMembers.invalidate(),
      ]);
    },
  });
  return { acceptInvitationAsync, error, isError, isIdle, isPending, isSuccess, status };
}
