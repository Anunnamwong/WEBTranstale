import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_TRANSLATE_API_BASE || 'http://94.232.251.236:8080';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ message: 'Invalid request body' });
    }

    const { data, status } = await axios.post(`${BASE_URL}/queue/novita/translate`, req.body, {
      headers: { 'Content-Type': 'application/json' },
    });

    return res.status(status || 200).json(data);
  } catch (error: any) {
    const status = error?.response?.status || 500;
    const data = error?.response?.data || { message: 'Proxy translate queue failed' };
    return res.status(status).json(data);
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};
