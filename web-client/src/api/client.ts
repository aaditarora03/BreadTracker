import type { Subscription } from "../types/Subscription"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api"

function getApiBaseCandidates(): string[] {
  const candidates = [API_BASE_URL]

  if (API_BASE_URL.includes("127.0.0.1")) {
    candidates.push(API_BASE_URL.replace("127.0.0.1", "localhost"))
    candidates.push(API_BASE_URL.replace("127.0.0.1", "[::1]"))
  } else if (API_BASE_URL.includes("localhost")) {
    candidates.push(API_BASE_URL.replace("localhost", "127.0.0.1"))
    candidates.push(API_BASE_URL.replace("localhost", "[::1]"))
  } else if (API_BASE_URL.includes("[::1]")) {
    candidates.push(API_BASE_URL.replace("[::1]", "127.0.0.1"))
    candidates.push(API_BASE_URL.replace("[::1]", "localhost"))
  }

  return [...new Set(candidates)]
}

export interface AuthSession {
  access_token: string
  refresh_token?: string
  user?: {
    id: string
    email?: string
  }
}

interface SignupPayload {
  email: string
  password: string
  firstName: string
  lastName: string
}

interface LoginPayload {
  email: string
  password: string
}

interface CreateSubscriptionPayload {
  serviceName: string
  cost: number
  billingDate: string
  recurrenceType: "weekly" | "monthly" | "yearly"
}

interface UpdateSubscriptionPayload {
  billingDate?: string
  autoRenew?: boolean
}

interface BackendSubscription {
  subscription_id: number
  service_name: string
  cost: number
  billing_date: string
  recurrence_type: "weekly" | "monthly" | "yearly"
  auto_renew: boolean
  is_active: boolean
}

function normalizeSubscription(item: BackendSubscription): Subscription {
  return {
    subscriptionId: item.subscription_id,
    serviceName: item.service_name,
    cost: item.cost,
    billingDate: item.billing_date,
    recurrenceType: item.recurrence_type,
    autoRenew: item.auto_renew,
    isActive: item.is_active,
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set("Content-Type", "application/json")

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  let response: Response | null = null
  let lastError: unknown = null

  for (const baseUrl of getApiBaseCandidates()) {
    try {
      response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers,
      })
      break
    } catch (error) {
      lastError = error
    }
  }

  if (!response) {
    // Surface a useful message for CORS/network issues instead of a raw browser TypeError.
    if (lastError instanceof TypeError) {
      throw new Error(`Network error: could not reach API at ${getApiBaseCandidates().join(" or ")}. Check backend status and CORS settings.`)
    }
    throw lastError
  }

  if (!response.ok) {
    let detail = "Request failed"
    try {
      const data = await response.json()
      detail = data.detail ?? detail
    } catch {
      // No-op: keep fallback message.
    }
    throw new Error(detail)
  }

  return response.json() as Promise<T>
}

export async function signup(payload: SignupPayload): Promise<void> {
  await request("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function login(payload: LoginPayload): Promise<AuthSession> {
  return request<AuthSession>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function logout(token: string): Promise<void> {
  await request("/auth/logout", {
    method: "POST",
    body: JSON.stringify({}),
  }, token)
}

export async function getSubscriptions(token: string): Promise<Subscription[]> {
  const data = await request<BackendSubscription[]>("/subscription/", { method: "GET" }, token)
  return data.map(normalizeSubscription)
}

export async function createSubscription(
  token: string,
  payload: CreateSubscriptionPayload,
): Promise<Subscription> {
  const data = await request<BackendSubscription>(
    "/subscription/create",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  )
  return normalizeSubscription(data)
}

export async function updateSubscription(
  token: string,
  subscriptionId: number,
  payload: UpdateSubscriptionPayload,
): Promise<Subscription> {
  const data = await request<BackendSubscription>(
    `/subscription/update/${subscriptionId}`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  )
  return normalizeSubscription(data)
}

export async function deleteSubscription(token: string, subscriptionId: number): Promise<void> {
  await request(`/subscription/delete/${subscriptionId}`, { method: "DELETE" }, token)
}
