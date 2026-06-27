"use client";

import { trpc } from "~/trpc/client";

// queries
export function useListProjects(input: Parameters<typeof trpc.project.listProjects.useQuery>[0]) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.project.listProjects.useQuery(input);
  return {
    projects: data?.projects ?? [],
    error,
    isFetched,
    isFetching,
    isLoading,
    refetch,
    status,
  };
}

export function useGetProjectById(
  input: Parameters<typeof trpc.project.getProjectById.useQuery>[0],
) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.project.getProjectById.useQuery(input);
  return { project: data?.project, error, isFetched, isFetching, isLoading, refetch, status };
}

// mutations
export function useCreateProject() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: createProjectAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.project.createProject.useMutation({
    onSuccess: async () => {
      await utils.project.listProjects.invalidate();
    },
  });
  return { createProjectAsync, error, isError, isIdle, isPending, isSuccess, status };
}

export function useUpdateProject() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: updateProjectAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.project.updateProject.useMutation({
    onSuccess: async () => {
      await utils.project.listProjects.invalidate();
    },
  });
  return { updateProjectAsync, error, isError, isIdle, isPending, isSuccess, status };
}

export function useDeleteProject() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: deleteProjectAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.project.deleteProject.useMutation({
    onSuccess: async () => {
      await utils.project.listProjects.invalidate();
    },
  });
  return { deleteProjectAsync, error, isError, isIdle, isPending, isSuccess, status };
}
