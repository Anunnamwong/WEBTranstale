import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'

const API_BASE = process.env.NEXT_PUBLIC_MODERATION_API_BASE || 'http://localhost:5050'

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
		const fields = parsed[0]
		const files = parsed[1] as formidable.Files
		
		let fileEntry = (files as any).file as formidable.File | formidable.File[] | undefined
		if (!fileEntry) {
			return res.status(400).json({ message: 'No file provided' })
		}
		const file = Array.isArray(fileEntry) ? fileEntry[0] : fileEntry
		if (!file || !file.filepath) {
			return res.status(400).json({ message: 'Invalid file' })
		}

		const stats = fs.statSync(file.filepath)
		if (!stats || stats.size <= 0) {
			return res.status(400).json({ message: 'Empty file' })
		}

		const formData = new FormData()
		const fileBuffer = fs.readFileSync(file.filepath)
		const fileBlob = new Blob([fileBuffer])
		formData.append('file', fileBlob, file.originalFilename || 'image.jpg')

		const upstream = await fetch(`${API_BASE}/v1/queue/image`, { 
			method: 'POST',
			body: formData
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
