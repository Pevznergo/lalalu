export async function postJson<TResponse>(
  url: string,
  options: {
    apiKey?: string;
    body: unknown;
    headers?: Record<string, string>;
  }
): Promise<TResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(options.apiKey ? { authorization: `Bearer ${options.apiKey}` } : {}),
      ...(options.headers ?? {})
    },
    body: JSON.stringify(options.body)
  });

  if (!response.ok) {
    throw new Error(`Provider request failed with ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
}
