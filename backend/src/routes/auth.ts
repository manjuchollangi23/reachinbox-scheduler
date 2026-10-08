import { Router, Request, Response } from 'express';
import prisma from '../db/prisma';

const router = Router();

// Endpoint for frontend to sync user after Google Login
router.post('/sync', async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, name, avatar } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: { email, name, avatar }
      });
    }
    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to sync user' });
  }
});

// Endpoint to simulate connecting Slack
router.post('/slack/connect', async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId, slackWebhookUrl } = req.body; // In real app, this would be an OAuth flow
    if (!userId || !slackWebhookUrl) return res.status(400).json({ error: 'Missing userId or webhook URL' });

    const user = await prisma.user.update({
      where: { id: userId },
      data: { slackToken: slackWebhookUrl } // Storing webhook URL for demo purposes
    });
    return res.json({ message: 'Slack connected successfully', user });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to connect Slack' });
  }
});

export default router;
