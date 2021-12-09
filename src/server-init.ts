import * as express from 'express';
import * as http from 'http';
import { config, runConfig } from './server.config';

const app = express();
const httpServer: http.Server = http.createServer(app);

app.get('/', (req, res) => {
  const content = {
    [config.keyPort]: runConfig.PORT,
  };
  if (config.printEnv) {
    res.json({ ...content, ENV: process.env });
  } else {
    res.jsonp(content);
  }
});

import * as ioServer from './server-io';
ioServer.create(httpServer);

// import * as wsServer from './server-ws';
// wsServer.create(httpServer);
