import { Router, Request, Response } from 'express';
import { searchEmails } from '../search/elasticsearch';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const { q, senderId } = req.query;
    if (!senderId || !q) {
       return res.status(400).json({ error: 'Missing query or senderId' });
    }
    
    const results = await searchEmails(String(q), String(senderId));
    return res.json(results);
  } catch (error) {
    return res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
