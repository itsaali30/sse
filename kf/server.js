const express = require('express');
const kafka = require('kafka-node');
const Airtable = require('airtable');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const base = new Airtable({ apiKey: 'patX200VGkvIdjhvl.85e8e525a33b49ef814bfbfc0c0af14631faf88b39fd566a99a5c3de203a181a' }).base('appUycLZwpqXOVZsQ');

// Kafka Setup
const client = new kafka.KafkaClient({ kafkaHost: 'localhost:9092' });
const producer = new kafka.Producer(client);
const consumer1 = new kafka.Consumer(client, [{ topic: 'test', partition: 0 }], { autoCommit: true });
const consumer2 = new kafka.Consumer(client, [{ topic: 'test', partition: 1 }], { autoCommit: true });

let consumer1Messages = [];
let consumer2Messages = [];

// Store all messages for Consumer 1
consumer1.on('message', (message) => {
    console.log('Consumer 1 received:', message.value);
    consumer1Messages.push(message.value);
});

// Store all messages for Consumer 2 and post to Airtable
consumer2.on('message', (message) => {
    console.log('Consumer 2 received:', message.value);
    consumer2Messages.push(message.value);

    // Post message to Airtable
    base('Youtube').create(
        { Name: 'Message', Description: message.value },
        (err, record) => {
            if (err) {
                console.error('Airtable error:', err);
                return;
            }
            console.log('Record added:', record.getId());
        }
    );
});

// Produce message
app.post('/produce', (req, res) => {
    const { message } = req.body;
    const payloads = [{ topic: 'test', messages: message }];
    producer.send(payloads, (err, data) => {
        if (err) {
            res.status(500).send('Error producing message');
        } else {
            res.status(200).send('Message sent successfully');
        }
    });
});

// Fetch all Consumer 1 messages
app.get('/consume1', (req, res) => {
    res.json({ messages: consumer1Messages });
});

// Fetch all Consumer 2 messages
app.get('/consume2', (req, res) => {
    res.json({ messages: consumer2Messages });
});

// Serve SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
