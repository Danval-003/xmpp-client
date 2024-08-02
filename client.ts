const WebSocket = require('ws');

const socket = new WebSocket('ws://localhost:8765/ws/');

const dataUser = {
    username: 'testWeb',
    password: 'PSSWD',
    type: 'login'
}; 

socket.on('open', function open() {
    socket.send(JSON.stringify(dataUser));
    console.log('Message sent to server:', dataUser);
});

socket.on('message', function incoming(data) {
    try {
        const message = JSON.parse(data.toString());
        console.log('Message from server:', message);
    } catch (e) {
        console.error('Error parsing JSON:', e);
    }
}); 

socket.on('close', function close() {
    console.log('WebSocket is closed now.');
});

socket.on('error', function error(err) {
    console.error('WebSocket error observed:', err);
});
