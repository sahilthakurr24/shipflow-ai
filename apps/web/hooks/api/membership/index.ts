"use client";

import { trpc } from "~/trpc/client";

// queries
export function useGetMembership(
  input: Parameters<typeof trpc.membership.getMembership.useQuery>[0],
) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.membership.getMembership.useQuery(input);
  return { membership: data?.membership, error, isFetched, isFetching, isLoading, refetch, status };
}

export function useListOrganizationMembers(
  input: Parameters<typeof trpc.membership.listOrganizationMembers.useQuery>[0],
) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.membership.listOrganizationMembers.useQuery(input);
  return { members: data?.members ?? [], error, isFetched, isFetching, isLoading, refetch, status };
}

// mutations
export function useAddMember() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: addMemberAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.membership.addMember.useMutation({
    onSuccess: async () => {
      await utils.membership.listOrganizationMembers.invalidate();
    },
  });
  return { addMemberAsync, error, isError, isIdle, isPending, isSuccess, status };
}

export function useUpdateMemberRole() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: updateMemberRoleAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.membership.updateMemberRole.useMutation({
    onSuccess: async () => {
      await utils.membership.listOrganizationMembers.invalidate();
    },
  });
  return { updateMemberRoleAsync, error, isError, isIdle, isPending, isSuccess, status };
}

export function useRemoveMember() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: removeMemberAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.membership.removeMember.useMutation({
    onSuccess: async () => {
      await utils.membership.listOrganizationMembers.invalidate();
    },
  });
  return { removeMemberAsync, error, isError, isIdle, isPending, isSuccess, status };
}

export function useLeaveOrganization() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: leaveOrganizationAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.membership.leaveOrganization.useMutation({
    onSuccess: async () => {
      await utils.organization.getUserOrganizations.invalidate();
    },
  });
  return { leaveOrganizationAsync, error, isError, isIdle, isPending, isSuccess, status };
}
