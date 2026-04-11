/**
 * Unified API Client with error handling
 * 统一 API 客户端，带全局错误处理和 toast 回应用户提示
 */

import type { RequestInit } from 'node-fetch';
import { useAppStore } from '../store/useAppStore';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getToken(): string | null {
  return localStorage.getItem('trace-auth-token');
}

/**
 * Unified fetch wrapper with error handling
 * All API calls should go through this function
 */
export async function apiRequest<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  try {
    const token = getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers as Record<string, string> || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({
      code: 500,
      msg: 'Invalid JSON response from server',
    }));

    if (!response.ok) {
      const errorMsg = data.msg || data.error || `Request failed with status ${response.status}`;
      const addToast = useAppStore.getState().addToast;
      addToast('error', errorMsg);
      throw new ApiError(response.status, errorMsg, data.code);
    }

    if (data.code !== 200 && data.code !== undefined) {
      const errorMsg = data.msg || 'Request failed';
      const addToast = useAppStore.getState().addToast;
      addToast('error', errorMsg);
      throw new ApiError(data.code, errorMsg, data.code);
    }

    return data.data as T;
  } catch (err) {
      if (err instanceof ApiError) {
        throw err;
      }

      // Network error or other unexpected error
      const addToast = useAppStore.getState().addToast;
      addToast('error', '网络连接失败，请检查网络后重试');
      throw new ApiError(0, '网络连接失败');
    }
}

/**
 * Shorthand for GET requests
 */
export async function apiGet<T>(url: string): Promise<T> {
  return apiRequest<T>(url, { method: 'GET' });
}

/**
 * Shorthand for POST requests
 */
export async function apiPost<T>(url: string, body: unknown): Promise<T> {
  return apiRequest<T>(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
