import fastify from 'fastify';
import cors from '@fastify/cors';
import { PubSub } from '@google-cloud/pubsub';
import fs from 'fs';
import path from 'path';

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

// Load Pub/Sub configuration
let pubsubConfig;
try {
  const configPath = path.resolve(process.cwd(), '../config/pubsub-config.json');
  const configData = fs.readFileSync(configPath, 'utf8');
  pubsubConfig = JSON.parse(configData);
  console.log('Loaded Pub/Sub configuration:', pubsubConfig);
} catch (error) {
  console.error('Error loading Pub/Sub configuration:', error);
  pubsubConfig = { topics: [] };
}

// Ensure topic exists
async function ensureTopic(topicName) {
  const topic = pubsub.topic(topicName);
  const [exists] = await topic.exists();
  if (!exists) {
    console.log(`Topic ${topicName} does not exist, creating it...`);
    await pubsub.createTopic(topicName);
    console.log(`Topic ${topicName} created successfully`);
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
    const { message, topicName = 'my-topic' } = request.body as { message: string, topicName?: string };
    
    if (!message) {
      return reply.code(400).send({ error: 'Message is required' });
    }

    const data = Buffer.from(JSON.stringify({ message, timestamp: new Date().toISOString() }));
    
    console.log('Publishing with config:', {
      projectId,
      apiEndpoint,
      topic: topicName,
      message
    });
    
    const topic = await ensureTopic(topicName);
    const messageId = await topic.publishMessage({ data });

    return { messageId, topic: topicName };
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

// Publish to specific topic endpoint
app.post('/publish/:topicName', async (request, reply) => {
  try {
    const { topicName } = request.params as { topicName: string };
    const { message } = request.body as { message: string };
    
    if (!message) {
      return reply.code(400).send({ error: 'Message is required' });
    }

    const data = Buffer.from(JSON.stringify({ message, timestamp: new Date().toISOString() }));
    
    console.log('Publishing to specific topic:', {
      projectId,
      apiEndpoint,
      topic: topicName,
      message
    });
    
    const topic = await ensureTopic(topicName);
    const messageId = await topic.publishMessage({ data });

    return { messageId, topic: topicName };
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

// Push notification endpoint for email notifications
app.post('/notifications', async (request, reply) => {
  try {
    console.log('Received push notification in service1:');
    console.log('Headers:', request.headers);
    console.log('Body:', request.body);
    
    // In a real application, you would validate the Pub/Sub token here
    // For local development with the emulator, we'll just log the message
    
    // Return 200 OK to acknowledge the message
    return reply.code(200).send({ status: 'ok' });
  } catch (error) {
    console.error('Error processing push notification:', error);
    return reply.code(500).send({ error: 'Failed to process notification' });
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