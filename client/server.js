// Import dependencies
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { KafkaClient, Producer, Consumer } = require('kafka-node');

// Initialize Express app
const app = express();
const PORT = 3000;

// Middleware to parse JSON and serve static files
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Kafka configuration
const kafkaHost = 'localhost:9092'; // Adjust based on your Kafka setup
const client = new KafkaClient({ kafkaHost });
const producer = new Producer(client);
const consumer = new Consumer(client, [{ topic: 'test-topic', partition: 0 }], { autoCommit: true });

// SSE Clients Storage
const sseClients = [];

// SSE Route for Real-Time Communication
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Push client response to sseClients array
  sseClients.push(res);

  // Remove client when the connection is closed
  req.on('close', () => {
    const index = sseClients.indexOf(res);
    if (index !== -1) {
      sseClients.splice(index, 1);
    }
  });
});

// Function to Broadcast Messages to All Connected SSE Clients
const broadcastMessage = (message) => {
  sseClients.forEach((client) => {
    client.write(`data: ${JSON.stringify(message)}\n\n`);
  });
};

// Kafka Producer: Send Messages to Topic
app.post('/produce', (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  producer.send([{ topic: 'test-topic', messages: message }], (err, data) => {
    if (err) {
      console.error('Error producing message:', err);
      return res.status(500).json({ error: 'Failed to send message' });
    }
    console.log('Message sent:', data);
    res.json({ success: true, data });
  });
});

// Kafka Consumer: Receive Messages from Topic
consumer.on('message', (message) => {
  console.log('Received message:', message.value);
  broadcastMessage({ value: message.value }); // Broadcast to SSE clients
});

// Handle Kafka Consumer Errors
consumer.on('error', (err) => {
  console.error('Kafka Consumer Error:', err);
});

// Handle Kafka Producer Readiness
producer.on('ready', () => {
  console.log('Kafka Producer is ready');
});

// Handle Kafka Producer Errors
producer.on('error', (err) => {
  console.error('Kafka Producer Error:', err);
});

// Fallback Route for SPA (Serves index.html)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the Server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
