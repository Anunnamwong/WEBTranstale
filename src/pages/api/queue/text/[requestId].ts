import type { NextApiRequest, NextApiResponse } from 'next'

const API_BASE = process.env.NEXT_PUBLIC_MODERATION_API_BASE || 'http://localhost:5050'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'GET') {
		res.setHeader('Allow', ['GET'])
		return res.status(405).json({ message: 'Method Not Allowed' })
	}
	const { requestId } = req.query
	try {
		const upstream = await fetch(`${API_BASE}/v1/queue/text/${encodeURIComponent(String(requestId))}`)
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
