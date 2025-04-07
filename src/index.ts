import fastify from 'fastify';
import cors from '@fastify/cors';
import { PubSub } from '@google-cloud/pubsub';

const app = fastify({
  logger: true
});

// Register CORS
await app.register(cors, {
  origin: true
});

// Initialize PubSub with emulator support
const emulatorHost = process.env.PUBSUB_EMULATOR_HOST;
const apiEndpoint = emulatorHost ? `http://${emulatorHost}` : undefined;
const projectId = process.env.PUBSUB_PROJECT_ID || 'gcp-pubsub-456020';

const pubsub = new PubSub({
  projectId,
  apiEndpoint
});

console.log('PubSub initialized with:', {
  projectId,
  apiEndpoint
});

// Configuration
const TOPIC_NAME = 'my-topic';

// Ensure topic exists
async function ensureTopic() {
  const topic = pubsub.topic(TOPIC_NAME);
  const [exists] = await topic.exists();
  if (!exists) {
    console.log(`Topic ${TOPIC_NAME} does not exist, creating it...`);
    await pubsub.createTopic(TOPIC_NAME);
    console.log(`Topic ${TOPIC_NAME} created successfully`);
  }
  return topic;
}

// Health check endpoint
app.get('/health', async () => {
  return { status: 'ok' };
});

// Publish message endpoint
app.post('/publish', async (request, reply) => {
  try {
    const { message } = request.body as { message: string };
    
    if (!message) {
      return reply.code(400).send({ error: 'Message is required' });
    }

    const data = Buffer.from(JSON.stringify({ message, timestamp: new Date().toISOString() }));
    
    console.log('Publishing with config:', {
      projectId,
      apiEndpoint,
      topic: TOPIC_NAME,
      message
    });
    
    const topic = await ensureTopic();
    const messageId = await topic.publishMessage({ data });

    return { messageId };
  } catch (error) {
    console.error('Detailed publish error:', {
      error: error.message,
      code: error.code,
      details: error.details,
      stack: error.stack
    });
    return reply.code(500).send({ error: 'Failed to publish message', details: error.message });
  }
});

// Start the server
const start = async () => {
  try {
    await app.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Publisher service is running on port 3000');
    console.log('Using Pub/Sub Emulator:', !!process.env.PUBSUB_EMULATOR_HOST);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start(); 