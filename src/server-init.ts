import * as express from 'express';
import * as http from 'http';

import 'reflect-metadata';

import { config, runConfig } from './server.config';

import { selectPublicTables } from './pg/hello';
import { QueryResultRow } from 'pg';

const app = express();
const httpServer: http.Server = http.createServer(app);

app.get('/', async (req, res) => {
  const publicTables = await selectPublicTables();
  const content = {
    [config.keyPort]: runConfig.PORT,
    publicTables,
  };
  if (config.printEnv) {
    res.json({ ...content, ENV: process.env });
  } else {
    res.jsonp(content);
  }
});

import * as ioServer from './server-io';
ioServer.create(httpServer);
