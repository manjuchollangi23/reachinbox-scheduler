import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';
dotenv.config();

let esClient: Client | null = null;
let esAvailable = false;

const getClient = () => {
  if (!esClient) {
    esClient = new Client({
      node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    });
  }
  return esClient;
};

export const indexEmailJob = async (job: any) => {
  if (!esAvailable) return; // silently skip if ES not running
  try {
    await getClient().index({
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
    console.warn('[ES] Indexing skipped - Elasticsearch unavailable');
  }
};

export const searchEmails = async (query: string, senderId: string): Promise<any[]> => {
  if (!esAvailable) return []; // return empty if ES not running
  try {
    const result = await getClient().search({
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
    console.warn('[ES] Search unavailable - Elasticsearch not running');
    return [];
  }
};

// Initialize index - gracefully skip if Elasticsearch is not running
export const initElasticsearch = async () => {
  try {
    const client = getClient();
    // Ping with a short timeout to check availability
    await client.ping({}, { requestTimeout: 3000 } as any);
    esAvailable = true;
    console.log('[ES] Elasticsearch connected.');
    const exists = await client.indices.exists({ index: 'emails' });
    if (!exists) {
      await client.indices.create({ index: 'emails' });
      console.log('[ES] Created emails index in Elasticsearch');
    }
  } catch (error) {
    esAvailable = false;
    console.warn('[ES] Elasticsearch not available - search features disabled. Start Elasticsearch to enable.');
  }
};
