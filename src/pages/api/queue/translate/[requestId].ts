import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_TRANSLATE_API_BASE || 'http://94.232.251.236:8080';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { requestId } = req.query;

  if (!requestId || typeof requestId !== 'string') {
    return res.status(400).json({ message: 'Invalid request ID' });
  }

  try {
    const { data, status } = await axios.get(`${BASE_URL}/queue/translate/${encodeURIComponent(requestId)}`, {
      timeout: 5000,
    });

    return res.status(status || 200).json(data);
  } catch (error: any) {
    const status = error?.response?.status || 500;
    
    // Handle 404 as "not ready yet" (polling scenario)
    if (status === 404) {
      return res.status(404).json({ 
        status: 'pending',
        message: 'Translation not ready yet' 
      });
    }

    const data = error?.response?.data || { message: 'Failed to get translation status' };
    return res.status(status).json(data);
  }
}

