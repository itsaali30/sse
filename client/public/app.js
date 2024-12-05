new Vue({
    el: '#app',
    data: {
      messages: [], // Array to hold messages
      newMessage: '' // Two-way bound input for new messages
    },
    methods: {
      // Send a message to the server
      sendMessage() {
        if (!this.newMessage.trim()) return;
  
        axios.post('/produce', { message: this.newMessage })
          .then(() => {
            this.newMessage = ''; // Clear the input after sending
          })
          .catch(err => console.error(err));
      }
    },
    mounted() {
      // Connect to the SSE endpoint
      const eventSource = new EventSource('/events');
      eventSource.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.messages.push(message.value); // Add new message to the array
      };
    }
  });
  