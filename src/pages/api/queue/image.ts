import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'

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
			return res.status(400).json({ message: 'No file provided' })
		}

		const stats = fs.statSync((file as any).filepath)
		if (!stats || stats.size <= 0) {
			return res.status(400).json({ message: 'Empty file' })
		}

		const formData = new FormData()
		const fileBuffer = fs.readFileSync((file as any).filepath)
		const fileBlob = new Blob([fileBuffer], { type: (file as any).mimetype || 'application/octet-stream' })
		formData.append('file', fileBlob, (file as any).originalFilename || 'image.jpg')

		const lang = (req.query.lang as string) || 'en'
		const headers: Record<string, string> = {}
		const auth = req.headers['authorization']
		if (auth) headers['Authorization'] = Array.isArray(auth) ? auth[0] : auth

		const upstream = await fetch(`${IMAGE_API_BASE}/v1/queue/image?lang=${encodeURIComponent(lang)}`, { 
			method: 'POST',
			body: formData,
			headers
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
