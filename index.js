const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const cors = require('cors');

const port = process.env.PORT || 3002;

app.use(cors()); 
app.use(express.static('public'));

app.get('/reset', (req, res) => {
    io.emit('reset');
    res.send('Reset all recorded videos and start over.');
});

app.get('/start_record', (req, res) => {
    io.emit('start_record');
    res.send('Start recording signal sent to all clients');
});

app.get('/stop_and_play', (req, res) => {
    io.emit('stop_and_play');
    res.send('Stop recording and start playing signal sent to all clients');
});

io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

server.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});