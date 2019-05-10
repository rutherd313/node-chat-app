const path = require('path'); 
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('../src/utils/messages');
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/user');

//Created server outside of express library
const http = require('http');
const server = http.createServer(app);

//setting websocket
const socketio = require('socket.io');
const io = socketio(server);

const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))



//websocket event listner, fires when socketio gets a new connection
io.on('connection', (socket) => {
    console.log('New Websocket Connection')
    
    socket.on('join', ({username, room}, callback) => {
        const { error, user } = addUser({id: socket.id, username, room})

        if (error) {
            return callback(error)
        }

        socket.join(user.room)
        //1st arg: name of what's being emitted, 2nd: data
        socket.emit('initMessage', generateMessage('Admin', 'Welcome!'))
        //emits to other clients except client emiting
        socket.broadcast.to(user.room).emit('initMessage', generateMessage('Admin', `${user.username} has joined the chat!`));
    
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
    });

    //listens data from client 
    socket.on('sendMessage', (msg, callback) => {
        const user = getUser(socket.id);

        const filter = new Filter();

        if (filter.isProfane(msg)) {
            return callback('Profanity is not allowed!');
        }

        //emits to all clients connected
        io.to(user.room).emit('initMessage', generateMessage(user.username, msg));
        callback(); //callback acknowledges the event received from the client
    })

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://www.google.com/maps?q=${coords.latitude}, ${coords.longitude}`))
        callback(); //event acknowledged
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('initMessage', generateMessage('Admin', `${user.username} has left the chat`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }       
    })
})

server.listen(port, () => {
    console.log(`Server is up on port: ${port}`);
})
