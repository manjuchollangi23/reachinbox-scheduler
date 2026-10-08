import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';
dotenv.config();

export const esClient = new Client({
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
});

export const indexEmailJob = async (job: any) => {
  try {
    await esClient.index({
      index: 'emails',
      id: job.id,
      document: {
        subject: job.subject,
        body: job.body,
        toEmail: job.toEmail,
        status: job.status,
        senderId: job.senderId,
        scheduledTime: job.scheduledTime,
        sentAt: job.sentAt,
      },
    });
  } catch (error) {
    console.error('Error indexing email to Elasticsearch:', error);
  }
};

export const searchEmails = async (query: string, senderId: string) => {
  try {
    const result = await esClient.search({
      index: 'emails',
      query: {
        bool: {
          must: [
            { term: { senderId: senderId } },
            {
              multi_match: {
                query,
                fields: ['subject', 'body', 'toEmail'],
              },
            },
          ],
        },
      },
    });
    return result.hits.hits.map((hit: any) => hit._source);
  } catch (error) {
    console.error('Error searching emails in Elasticsearch:', error);
    return [];
  }
};

// Initialize index
export const initElasticsearch = async () => {
  try {
    const exists = await esClient.indices.exists({ index: 'emails' });
    if (!exists) {
      await esClient.indices.create({ index: 'emails' });
      console.log('Created emails index in Elasticsearch');
    }
  } catch (error) {
    console.error('Failed to initialize Elasticsearch index:', error);
  }
};
