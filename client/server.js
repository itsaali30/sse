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
const kafkaHost = 'localhost:9092'; // Adjust this based on your Kafka setup
const client = new KafkaClient({ kafkaHost });
const producer = new Producer(client);
const consumer = new Consumer(client, [{ topic: 'test-topic', partition: 0 }], { autoCommit: true });

// Message storage
const messages = [];

// Route to produce messages
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

// Route to consume messages
app.get('/consume', (req, res) => {
  res.json({ messages });
});

// Kafka consumer: listen for messages
consumer.on('message', (message) => {
  console.log('Received message:', message.value);
  messages.push(message.value); // Store received messages
});

// Handle Kafka errors
consumer.on('error', (err) => {
  console.error('Kafka Consumer Error:', err);
});

producer.on('ready', () => {
  console.log('Kafka Producer is ready');
});

producer.on('error', (err) => {
  console.error('Kafka Producer Error:', err);
});

// Fallback route for SPA (serves index.html for any unmatched routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
