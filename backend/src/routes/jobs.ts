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
          senderId,
          status: 'PENDING'
        }
      });
      createdJobs.push(dbJob);

      // Calculate initial delay for queue
      const timeUntilSchedule = Math.max(0, scheduledDate.getTime() - Date.now());
      // Add cumulative delay to ensure spacing between emails being queued
      // E.g., if delay is 2s, email 0 sends at T, email 1 sends at T+2s.
      const delay = timeUntilSchedule + cumulativeDelay;
      cumulativeDelay += (delaySeconds || 0) * 1000;

      await emailQueue.add('send-email', {
        jobId: dbJob.id,
        delaySeconds: delaySeconds || 0
      }, {
        delay, // BullMQ delay option
        jobId: dbJob.id // Unique ID to maintain idempotency
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

    const filter: any = { senderId: String(senderId) };
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
