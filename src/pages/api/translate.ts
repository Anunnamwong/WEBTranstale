import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_TRANSLATE_API_BASE || 'http://94.232.251.236:8080';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const headers: Record<string, string> = {};
    const xDistributed = req.headers['x-distributed'];
    if (typeof xDistributed === 'string') headers['x-distributed'] = xDistributed;

    const { data, status } = await axios.post(`${BASE_URL}/translate`, req.body, { headers });
    return res.status(status || 200).json(data);
  } catch (error: any) {
    const status = error?.response?.status || 500;
    const data = error?.response?.data || { message: 'Proxy translate failed' };
    return res.status(status).json(data);
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '8mb',
    },
  },
};


