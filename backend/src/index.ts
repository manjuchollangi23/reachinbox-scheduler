import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

import jobsRouter from './routes/jobs';
import authRouter from './routes/auth';
import searchRouter from './routes/search';
import { emailQueue } from './queue/emailQueue';
import './queue/emailWorker'; // Import worker to start it
import { initElasticsearch } from './search/elasticsearch';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Bull Board setup
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());

app.use('/api/jobs', jobsRouter);
app.use('/api/auth', authRouter);
app.use('/api/search', searchRouter);

const PORT = process.env.PORT || 3001;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`BullMQ Dashboard available at http://localhost:${PORT}/admin/queues`);
  await initElasticsearch();
});
