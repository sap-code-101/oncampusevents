import { apiResponseHandler, handleApiError, isSelfThrownApiError } from "@/lib/basic-utils/api-handle";
import { SelfThrownError, SUCCESS_RESPONSE } from "@/lib/types/api-handle-types";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { Key } from "lucide-react";
import { toast } from "sonner";

type HttpMethodMutation = 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface MutationCustomParams<TInput, TContext = any> {
  apiRoute: string;
  key: any;
  method?: HttpMethodMutation;
  httpOnlyCookie?: boolean;
  errorFallbackMsg?: string;
  successFallbackMsg?: string;
  onSuccessSideEffect?: (success: SUCCESS_RESPONSE) => void;
  onErrorSideEffect?: (err: SelfThrownError, vars: TInput, context: TContext) => void;
  onMutateCustom?: (data: TInput) => TContext;
  extraOptions?: Partial<UseMutationOptions<SUCCESS_RESPONSE, SelfThrownError, TInput, TContext>>;
}

export function useMutationCustom<TInput>({
  apiRoute,
  key,
  method = "POST",
  httpOnlyCookie = false,
  errorFallbackMsg = "Something went wrong.",
  successFallbackMsg = "Request successful.",
  onSuccessSideEffect,
  onErrorSideEffect,
  onMutateCustom,
  extraOptions = {},
}: MutationCustomParams<TInput>) {
  return useMutation<SUCCESS_RESPONSE, SelfThrownError, TInput>({
    mutationKey: key,
    mutationFn: async (data: TInput): Promise<SUCCESS_RESPONSE> => {
      const fetchOptions: RequestInit = {
        method: method,
        headers: {
          "Content-Type": "application/json"
        },
        ...(data && { body: JSON.stringify(data) }),
        ...(httpOnlyCookie && { credentials: "include" })
      };
      const response = await fetch(apiRoute, fetchOptions);
      return apiResponseHandler(response);
    },


    onSuccess: (success: SUCCESS_RESPONSE) => {
      toast.success(success.message ?? successFallbackMsg);
      if (onSuccessSideEffect) onSuccessSideEffect(success)
    },
    onMutate: (data: TInput) => onMutateCustom ? onMutateCustom(data) : undefined,
    onError: (err, vars, context) => {
      if (onErrorSideEffect) onErrorSideEffect(err, vars, context);
      handleApiError(err, errorFallbackMsg)
    },
    ...extraOptions


  });
}

