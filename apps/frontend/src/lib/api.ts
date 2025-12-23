const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"

interface RequestOptions extends RequestInit {
    token?: string
}

export async function apiRequest<T = any>(
    endpoint: string,
    { token, ...options }: RequestOptions = {}
): Promise<T> {
    const headers = new Headers(options.headers)

    headers.set("Content-Type", "application/json")
    if (token) {
        headers.set("Authorization", `Bearer ${token}`)
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    })

    if (!response.ok) {
        throw new Error(`API Request failed: ${response.statusText}`)
    }

    // Handle empty responses
    if (response.status === 204) {
        return {} as T
    }

    return response.json()
}
