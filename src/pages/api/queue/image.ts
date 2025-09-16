import type { NextApiRequest, NextApiResponse } from 'next'

const IMAGE_API_BASE = process.env.IMAGE_API_BASE || 'http://94.232.251.234:5050'

export const config = {
	api: {
		bodyParser: false,
	},
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', ['POST'])
		return res.status(405).json({ message: 'Method Not Allowed' })
	}
	try {
		const lang = (req.query.lang as string) || 'en'
		const headers: Record<string, string> = {}
		const contentType = req.headers['content-type']
		if (contentType) headers['content-type'] = Array.isArray(contentType) ? contentType[0] : contentType
		const auth = req.headers['authorization']
		if (auth) headers['Authorization'] = Array.isArray(auth) ? auth[0] : auth

		const upstream = await fetch(`${IMAGE_API_BASE}/v1/queue/image?lang=${encodeURIComponent(lang)}`, {
			method: 'POST',
			headers,
			// Node.js fetch requires duplex when streaming a body
			// @ts-ignore
			duplex: 'half',
			// @ts-ignore
			body: req,
		})

		const text = await upstream.text()
		res.status(upstream.status)
		try {
			return res.json(JSON.parse(text))
		} catch {
			return res.send(text)
		}
	} catch (e: any) {
		console.error('Image upload proxy error:', e)
		return res.status(500).json({ message: e?.message || 'Proxy error' })
	}
}
