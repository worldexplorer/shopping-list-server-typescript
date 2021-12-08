import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';

const app = express();

//initialize a simple http server
const server = http.createServer(app);

//initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws: WebSocket) => {

    //connection is up, let's add a simple simple event
    ws.on('message', (message: string) => {

        //log the received message and send it back to the client
        console.log('received: %s', message);
        ws.send(`Hello, you sent -> ${message}`);
    });

    //send immediatly a feedback to the incoming connection
    ws.send('Hi there, I am a WebSocket server');
});

server.on('error', (e) => {
    console.log('Socket error', e);
    // if (e?.code === 'EADDRINUSE') {
    //     console.log('Address in use, retrying...');
    //     setTimeout(() => {
    //     server.close();
    //     server.listen(PORT, HOST);
    //     }, 1000);
    // }
});

//start our server
const server_port = process.env.PORT || 5000;
server.listen(server_port, () => {
// const server_ip: string = "192.168.43.135";
// server.listen(server_port, server_ip, () => {
    console.log(`Server started`, server.address());
});
