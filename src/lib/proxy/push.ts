export async function pushYamlToProxy(yaml: string): Promise<{ ok: boolean; skipped?: boolean }> {
  const agentUrl    = process.env.PROXY_AGENT_URL
  const agentSecret = process.env.PROXY_AGENT_SECRET

  if (!agentUrl || !agentSecret) return { ok: true, skipped: true }

  const res = await fetch(`${agentUrl}/update-config`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${agentSecret}`,
    },
    body: JSON.stringify({ yaml }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Proxy agent responded with ${res.status}: ${text}`)
  }

  return { ok: true }
}
