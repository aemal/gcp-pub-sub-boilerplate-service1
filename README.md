# Publisher Service (service1)

Part of [gcp-pub-sub-boilerplate](https://github.com/aemal/gcp-pub-sub-boilerplate)

## Purpose

This service acts as the publisher in the Pub/Sub architecture. It provides a REST API endpoint for publishing messages to a Google Cloud Pub/Sub topic.

### Features

- RESTful API using Fastify
- Google Cloud Pub/Sub integration
- Local emulator support
- CORS enabled
- Health check endpoint

### API Endpoints

#### Health Check
```bash
GET /health
```
Returns service health status.

#### Publish Message
```bash
POST /publish
Content-Type: application/json

{
    "message": "Your message here"
}
```
Publishes a message to the configured Pub/Sub topic.

### Example Usage

Publish a message:
```bash
curl -X POST http://localhost:3000/publish \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello from Pub/Sub!"}'
```

Check service health:
```bash
curl http://localhost:3000/health
```

## Configuration

Environment variables:
```bash
PUBSUB_PROJECT_ID=your-project-id      # GCP project ID
PUBSUB_EMULATOR_HOST=localhost:8790    # Emulator host (for local development)
PUBSUB_TOPIC_NAME=my-topic             # Topic name (optional)
