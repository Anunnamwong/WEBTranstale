import type { NextApiRequest, NextApiResponse } from 'next'

const IMAGE_API_BASE = process.env.IMAGE_API_BASE || 'http://94.232.251.234:5050'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'GET') {
		res.setHeader('Allow', ['GET'])
		return res.status(405).json({ message: 'Method Not Allowed' })
	}
	const { requestId } = req.query
	try {
		const headers: Record<string, string> = {}
		const auth = req.headers['authorization']
		if (auth) headers['Authorization'] = Array.isArray(auth) ? auth[0] : auth
		const upstream = await fetch(`${IMAGE_API_BASE}/v1/queue/image/${encodeURIComponent(String(requestId))}`, { headers })
		if (upstream.status === 404) {
			return res.status(404).send('Not ready')
		}
		const text = await upstream.text()
		res.status(upstream.status)
		try {
			return res.json(JSON.parse(text))
		} catch {
			return res.send(text)
		}
	} catch (e: any) {
		return res.status(500).json({ message: e?.message || 'Proxy error' })
	}
}
