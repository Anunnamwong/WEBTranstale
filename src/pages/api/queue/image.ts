import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'

const IMAGE_API_BASE = process.env.IMAGE_API_BASE || 'http://94.232.251.234:5050'

export const config = {
	api: {
		bodyParser: false,
	},
}

async function forwardStream(req: NextApiRequest, url: string, headers: Record<string, string>) {
	return fetch(url, {
		method: 'POST',
		headers,
		// @ts-ignore
		duplex: 'half',
		// @ts-ignore
		body: req,
	})
}

async function forwardRebuilt(req: NextApiRequest, url: string, headers: Record<string, string>) {
	const form = formidable({ multiples: true, keepExtensions: true })
	const parsed = await form.parse(req)
	const files = parsed[1] as formidable.Files
	let file: formidable.File | undefined
	const anyFiles = Object.values(files || {}) as any[]
	if (anyFiles.length > 0) {
		const first = anyFiles[0]
		file = Array.isArray(first) ? (first[0] as formidable.File) : (first as formidable.File)
	}
	if (!file) {
		const fileEntry = (files as any)?.file as formidable.File | formidable.File[] | undefined
		if (fileEntry) file = Array.isArray(fileEntry) ? fileEntry[0] : fileEntry
	}
	if (!file || !(file as any).filepath) {
		throw new Error('No file provided')
	}
	const stats = fs.statSync((file as any).filepath)
	if (!stats || stats.size <= 0) throw new Error('Empty file')
	const formData = new FormData()
	const fileBuffer = fs.readFileSync((file as any).filepath)
	const fileBlob = new Blob([fileBuffer], { type: (file as any).mimetype || 'application/octet-stream' })
	formData.append('file', fileBlob, (file as any).originalFilename || 'image.jpg')
	return fetch(url, { method: 'POST', headers, body: formData })
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
		const url = `${IMAGE_API_BASE}/v1/queue/image?lang=${encodeURIComponent(lang)}`

		let upstream: Response | null = null
		try {
			upstream = await forwardStream(req, url, headers)
		} catch (e: any) {
			console.error('Streaming forward failed, falling back to rebuild:', e?.message || e)
			upstream = await forwardRebuilt(req, url, { Authorization: headers['Authorization'] || '' })
		}

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
