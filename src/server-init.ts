import * as express from 'express';
import * as http from 'http';
import * as constants from './server-const';

const app = express();
const httpServer: http.Server = http.createServer(app);

app.get('/', (req, res) => {
  const currentPort = parseInt(app.get(constants.keyPort));
  const content = {
    [constants.keyPort]: currentPort,
  };
  if (currentPort === constants.devPort) {
    res.jsonp(content);
  } else {
    res.json({ ...content, ENV: process.env });
  }
});

// import * as ioServer from './server-io';
// ioServer.create(app, httpServer);

import * as wsServer from './server-ws';
wsServer.create(app, httpServer);
