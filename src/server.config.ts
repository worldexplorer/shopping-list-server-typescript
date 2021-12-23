export const config = {
  keyPort: 'WEBSOCKET_PORT', //HEROKU_DYNAMIC_
  devPort: 5000,
  printEnv: false,
  debugPrismaQuery: true,
};

export const runConfig = {
  PORT: process.env.PORT ? parseInt(process.env.PORT) : config.devPort, // heroku provides dynamic ports
  HOST: '0.0.0.0', // '192.168.43.135' // heroku crashes on IPv6 binding
};

export const URL: string = `http://${runConfig.HOST}:${runConfig.PORT}`;
