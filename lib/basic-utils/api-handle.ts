import { toast } from "sonner"
import { ERROR_API_RESPONSE, SelfThrownError, SUCCESS_API_RESPONSE, SUCCESS_RESPONSE } from "../types/api-handle-types"
import { NextResponse } from "next/server"


export async function apiResponseHandler(res: Response): Promise<SUCCESS_RESPONSE> {
  const body = await res.json()
  if (!res.ok || body.error) {
    throw {
      name: 'SelfThrownError',
      message: body.error?.message ?? 'Something went wrong',
      code: body.error?.code ?? 'UNKNOWN_ERROR',
      metaData: body.error?.metaData ?? null,
      status: res.status,
    } satisfies SelfThrownError
  }

  return body.success
}
export function isSelfThrownApiError(error: unknown): error is SelfThrownError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as any).name === 'SelfThrownError' &&
    'code' in error &&
    'message' in error &&
    'status' in error
  )
}
export function handleApiError(err: any, fallback = "Sorry, something went wrong"): never {
  if (isSelfThrownApiError(err)) {
    toast.error(err.message || fallback)
    if (process.env.NODE_ENV === "development") {
      console.error(`[${err.status}] ${err.code}:`, err.metaData ?? err.message)
    }
    throw err;
  }
  //if not api error, we will create our own error to thrown so we can use it properly in frontend
  if (err instanceof Error) {
    toast.error(fallback)
    if (process.env.NODE_ENV === "development") {
      console.error("Unknown error:", err.message)
    }
    throw {
      name: "SelfThrownError",
      message: "Unkonwn Error",
      code: "UNKNOWN_ERROR",
      metaData: null,
      status: 500
    } satisfies SelfThrownError;
  }
  toast.error(fallback)
  if (process.env.NODE_ENV === "development") {
    console.error("Unrecognized error:", err)
  }
  throw {
    name: "SelfThrownError",
    message: "Unhandled error",
    code: "UNKNOWN_ERROR",
    metaData: null,
    status: 500
  } satisfies SelfThrownError;
}
//api response handler functions
export function genApiResponse(
  { code, message, data, metaData, status }: {
    code: string,
    message: string,
    data?: Record<any, any>,
    metaData?: Record<any, any>,
    status: 200 | 201 | 400 | 401 | 403 | 404 | 409 | 422 | 500
  }): NextResponse {
  if (status == 200 || status == 201) return NextResponse.json({
    success: {
      code: code,
      message: message,
      data: data ?? null,
      metaData: metaData ?? null,
    },
    error: null
  } as SUCCESS_API_RESPONSE, { status: status })
  //error
  return NextResponse.json({
    success: null,
    error: {
      code: code,
      message: message,
      metaData: metaData ?? null
    }
  } as ERROR_API_RESPONSE, { status: status })
}