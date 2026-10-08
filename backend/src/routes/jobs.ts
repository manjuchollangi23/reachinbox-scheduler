import { Router, Request, Response } from 'express';
import prisma from '../db/prisma';
import { emailQueue } from '../queue/emailQueue';

const router = Router();

// Schedule Emails
router.post('/schedule', async (req: Request, res: Response): Promise<any> => {
  try {
    const { subject, body, toEmails, scheduledTime, delaySeconds, hourlyLimit, senderId } = req.body;

    if (!subject || !body || !toEmails || !Array.isArray(toEmails) || !senderId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let user = await prisma.user.findUnique({ where: { id: senderId } });
    if (!user) {
      user = await prisma.user.findUnique({ where: { email: senderId } });
    }
    if (!user) {
      if (typeof senderId === 'string' && senderId.includes('@')) {
        user = await prisma.user.create({
          data: { email: senderId, name: senderId.split('@')[0] }
        });
      } else {
        return res.status(404).json({ error: 'User not found. Please sign in again.' });
      }
    }
    const resolvedSenderId = user.id;

    const scheduledDate = new Date(scheduledTime || Date.now());
    
    const createdJobs = [];
    let cumulativeDelay = 0;

    for (let i = 0; i < toEmails.length; i++) {
      const email = toEmails[i];
      
      const dbJob = await prisma.emailJob.create({
        data: {
          subject,
          body,
          toEmail: email,
          scheduledTime: scheduledDate,
          delaySeconds: delaySeconds || 0,
          hourlyLimit: hourlyLimit || 200,
          senderId: resolvedSenderId,
          status: 'PENDING'
        }
      });
      createdJobs.push(dbJob);

      // Calculate initial delay for queue
      const timeUntilSchedule = Math.max(0, scheduledDate.getTime() - Date.now());
      const delay = timeUntilSchedule + cumulativeDelay;
      cumulativeDelay += (delaySeconds || 0) * 1000;

      await emailQueue.add('send-email', {
        jobId: dbJob.id,
        delaySeconds: delaySeconds || 0
      }, {
        delay,
        jobId: dbJob.id
      });
    }

    return res.status(200).json({ message: 'Emails scheduled successfully', count: createdJobs.length });
  } catch (error) {
    console.error('Schedule error:', error);
    return res.status(500).json({ error: 'Failed to schedule emails' });
  }
});

// Get all jobs
router.get('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const { senderId, status } = req.query;
    if (!senderId) {
       return res.status(400).json({ error: 'Missing senderId' });
    }

    // senderId can be a DB user ID (UUID) or an email — support both
    const senderIdStr = String(senderId);
    
    // First try to find user by ID, then by email
    let user = await prisma.user.findUnique({ where: { id: senderIdStr } });
    if (!user) {
      user = await prisma.user.findUnique({ where: { email: senderIdStr } });
    }
    
    if (!user) {
      return res.json([]); // No user found, return empty
    }

    const filter: any = { senderId: user.id };
    if (status) {
       filter.status = String(status);
    }

    const jobs = await prisma.emailJob.findMany({
      where: filter,
      orderBy: { scheduledTime: 'desc' }
    });
    
    return res.json(jobs);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

export default router;

