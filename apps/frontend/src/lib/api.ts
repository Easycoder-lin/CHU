const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"

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
        let details = ""
        try {
            const contentType = response.headers.get("content-type") || ""
            if (contentType.includes("application/json")) {
                const body = await response.json()
                details = body?.message ? ` - ${body.message}` : ` - ${JSON.stringify(body)}`
            } else {
                const bodyText = await response.text()
                details = bodyText ? ` - ${bodyText}` : ""
            }
        } catch {
            // ignore parse errors
        }
        throw new Error(`API Request failed: ${response.status} ${response.statusText}${details}`)
    }

    // Handle empty responses
    if (response.status === 204) {
        return {} as T
    }

    return response.json()
}
