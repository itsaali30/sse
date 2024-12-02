const express = require('express');
const app = express();
let clients = [];

app.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Push the response to clients
    clients.push(res);
});

function sendToClients(message) {
    clients.forEach(client => {
        client.write(`data: ${JSON.stringify({ message })}\n\n`);
    });
}

const serverless = require('serverless-http');
module.exports.handler = serverless(app);

// Expose sendToClients function to other functions
module.exports.sendToClients = sendToClients;
