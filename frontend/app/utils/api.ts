const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface ApiError {
  message: string;
  field?: string;
  fields?: Record<string, string>;
}

export class ResponseError extends Error {
  status: number;
  errorData: ApiError;

  constructor(status: number, errorData: ApiError) {
    super(errorData.message || 'API request failed');
    this.name = 'ResponseError';
    this.status = status;
    this.errorData = errorData;
  }
}

export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: ApiError = { message: 'An unknown error occurred' };
    try {
      const json = await response.json();
      errorData = json.error || json;
    } catch (e) {
      // Ignored
    }
    throw new ResponseError(response.status, errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
