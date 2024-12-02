const { sendToClients } = require('./chat');

module.exports.handler = async (event, context) => {
    const body = JSON.parse(event.body);
    const message = body.message;

    // Send the message to all clients via SSE
    sendToClients(message);

    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Message sent' })
    };
};
