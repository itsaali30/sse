new Vue({
    el: '#app',
    data: {
        messages: [],
        newMessage: ''
    },
    mounted() {
        this.startSSE();
    },
    methods: {
        startSSE() {
            const eventSource = new EventSource('/.netlify/functions/chat');
            eventSource.onmessage = (event) => {
                this.messages.push(JSON.parse(event.data));
            };
        },
        sendMessage() {
            axios.post('/.netlify/functions/sendMessage', { message: this.newMessage })
                .then(() => {
                    this.newMessage = '';
                })
                .catch(err => console.error(err));
        }
    },
    template: `
        <div>
            <ul>
                <li v-for="msg in messages">{{ msg.message }}</li>
            </ul>
            <input v-model="newMessage" placeholder="Type your message">
            <button @click="sendMessage">Send</button>
        </div>
    `
});
