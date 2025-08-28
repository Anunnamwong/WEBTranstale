import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_TRANSLATE_API_BASE || 'http://94.232.251.236:8080';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  try {
    const { data, status } = await axios.get(`${BASE_URL}/queue/status`);
    return res.status(status || 200).json(data);
  } catch (error: any) {
    const status = error?.response?.status || 500;
    const data = error?.response?.data || { message: 'Proxy queue status failed' };
    return res.status(status).json(data);
  }
}


