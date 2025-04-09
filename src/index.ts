import fastify from 'fastify';
import cors from '@fastify/cors';

const app = fastify({
  logger: true
});

// Register CORS
await app.register(cors, {
  origin: true
});

// Example endpoint that demonstrates how to use the PubSub service
app.post('/example', async (request, reply) => {
  try {
    const body = request.body as any;
    console.log('=== Push Notification Received ===');
    console.log('Request body:', JSON.stringify(body, null, 2));
    console.log('Request headers:', JSON.stringify(request.headers, null, 2));
    console.log('Request method:', request.method);
    console.log('Request URL:', request.url);
    console.log('Request IP:', request.ip);
    console.log('================================');

    // PubSub push notifications come in a specific format
    if (body.message && body.message.data) {
      // Decode the base64 message data
      const messageData = Buffer.from(body.message.data, 'base64').toString('utf-8');
      console.log('Decoded message:', messageData);
      
      // Verify the message format
      try {
        const parsedMessage = JSON.parse(messageData);
        console.log('Parsed message:', parsedMessage);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
      
      // Acknowledge the message
      return { status: 'ok', message: 'Message received and processed' };
    } else {
      console.log('Received non-PubSub request:', body);
      return { status: 'ok', message: 'Non-PubSub request received' };
    }
  } catch (error) {
    console.error('Error processing push notification:', error);
    return reply.code(500).send({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', async () => {
  return { status: 'ok' };
});

// Start the server
const start = async () => {
  try {
    await app.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Example service 1 is running on port 3001');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start(); 