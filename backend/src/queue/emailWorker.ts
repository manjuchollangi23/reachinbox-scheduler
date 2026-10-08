import { Worker, Job, DelayedError } from 'bullmq';
import nodemailer from 'nodemailer';
import IORedis from 'ioredis';
import prisma from '../db/prisma';
import { getTransporter } from '../email/transporter';
import { indexEmailJob } from '../search/elasticsearch';
import { sendSlackNotification } from '../notifications/slack';
import dotenv from 'dotenv';
dotenv.config();

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
});

const getHourWindow = () => Math.floor(Date.now() / (1000 * 60 * 60));

export const emailWorker = new Worker('email-queue', async (job: Job) => {
  const { jobId, delaySeconds } = job.data;
  
  // Fetch job from DB
  const emailJob = await prisma.emailJob.findUnique({
    where: { id: jobId },
    include: { sender: true }
  });

  if (!emailJob) {
    throw new Error(`EmailJob ${jobId} not found in DB.`);
  }

  const senderId = emailJob.senderId;
  const hourlyLimit = emailJob.hourlyLimit || 200;
  
  const currentHour = getHourWindow();
  const counterKey = `rate_limit:${senderId}:${currentHour}`;
  
  // Increment Redis counter
  const currentCount = await connection.incr(counterKey);
  
  // Set expiry for the key if it's new (expire after 2 hours to be safe)
  if (currentCount === 1) {
    await connection.expire(counterKey, 2 * 60 * 60);
  }

  if (currentCount > hourlyLimit) {
    // Hourly limit exceeded
    // Check if we need to send a slack notification
    const notifiedKey = `notified_rate_limit:${senderId}:${currentHour}`;
    const alreadyNotified = await connection.get(notifiedKey);
    
    if (!alreadyNotified && emailJob.sender.slackToken) {
      await sendSlackNotification(
        emailJob.sender.slackToken,
        `⚠️ Rate limit of ${hourlyLimit} emails/hour reached for sender ${emailJob.sender.email}. Delaying remaining emails to the next hour.`
      );
      await connection.set(notifiedKey, '1', 'EX', 2 * 60 * 60);
    }
    
    // Reschedule to next hour
    const nextHourStart = (currentHour + 1) * 60 * 60 * 1000;
    const delayUntilNextHour = nextHourStart - Date.now();
    
    // Move to delayed and throw error so it doesn't complete
    await job.moveToDelayed(Date.now() + delayUntilNextHour, job.token!);
    throw new DelayedError(); // Specific error for BullMQ to know we moved it
  }

  // If we passed the rate limit check, we send the email.
  const transporter = await getTransporter();
  
  try {
    const info = await transporter.sendMail({
      from: emailJob.sender.email || '"ReachInbox Demo" <no-reply@reachinbox.ai>',
      to: emailJob.toEmail,
      subject: emailJob.subject,
      text: emailJob.body,
    });
    
    console.log(`Email sent: ${info.messageId}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`📨 View sent email preview: ${previewUrl}`);
    }
    
    // Update DB
    const updatedJob = await prisma.emailJob.update({
      where: { id: jobId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        previewUrl: (previewUrl as string) || null,
      }
    });
    
    // Index in Elasticsearch
    await indexEmailJob(updatedJob);
    
    // To mimic provider throttling, if delaySeconds is specified, we wait
    // We could do this using BullMQ rate limiter, or just standard sleep.
    // However, keeping the worker blocked for delaySeconds decreases concurrency throughput.
    // The requirement says: "There must be a minimum delay between individual email sends... Use BullMQ's limiter options, OR add a custom delay in the worker logic."
    // I will use a custom delay block in the worker to ensure at least X seconds pass.
    if (delaySeconds > 0) {
      await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`Failed to send email job ${jobId}:`, error);
    
    await prisma.emailJob.update({
      where: { id: jobId },
      data: { status: 'FAILED', error: error.message }
    });
    
    throw error;
  }
}, {
  connection,
  concurrency: 5, // Configurable worker concurrency
});

emailWorker.on('completed', (job) => {
  console.log(`Job ${job.id} has completed!`);
});

emailWorker.on('failed', (job, err) => {
  console.log(`Job ${job?.id} has failed with ${err.message}`);
});
