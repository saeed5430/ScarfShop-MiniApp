export class ApiError extends Error {
	readonly status: number;
	readonly code: string;

	constructor(status: number, code: string, message: string) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		this.code = code;
	}
}

export function notFound(message = 'Not found'): ApiError {
	return new ApiError(404, 'NOT_FOUND', message);
}

export function badRequest(message: string, code = 'BAD_REQUEST'): ApiError {
	return new ApiError(400, code, message);
}

export function conflict(message: string, code = 'CONFLICT'): ApiError {
	return new ApiError(409, code, message);
}

export function unauthorized(message = 'Unauthorized'): ApiError {
	return new ApiError(401, 'UNAUTHORIZED', message);
}

export function extractRpcError(err: unknown): string {
	if (err instanceof Error) {
		const anyErr = err as Error & { errorMessage?: string; errorCode?: number };
		if (anyErr.errorMessage) {
			return anyErr.errorMessage;
		}
		return err.message;
	}
	return String(err);
}