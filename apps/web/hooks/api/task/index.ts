"use client";

import { trpc } from "~/trpc/client";

// queries
export function useListTasks(input: Parameters<typeof trpc.task.listTasks.useQuery>[0]) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.task.listTasks.useQuery(input);
  return { tasks: data?.tasks ?? [], error, isFetched, isFetching, isLoading, refetch, status };
}

export function useGetTaskById(input: Parameters<typeof trpc.task.getTaskById.useQuery>[0]) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.task.getTaskById.useQuery(input);
  return { task: data?.task, error, isFetched, isFetching, isLoading, refetch, status };
}

// mutations
export function useCreateTask() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: createTaskAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.task.createTask.useMutation({
    onSuccess: async () => {
      await utils.task.listTasks.invalidate();
    },
  });
  return { createTaskAsync, error, isError, isIdle, isPending, isSuccess, status };
}

export function useUpdateTask() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: updateTaskAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.task.updateTask.useMutation({
    onSuccess: async () => {
      await utils.task.listTasks.invalidate();
    },
  });
  return { updateTaskAsync, error, isError, isIdle, isPending, isSuccess, status };
}

export function useDeleteTask() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: deleteTaskAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.task.deleteTask.useMutation({
    onSuccess: async () => {
      await utils.task.listTasks.invalidate();
    },
  });
  return { deleteTaskAsync, error, isError, isIdle, isPending, isSuccess, status };
}
