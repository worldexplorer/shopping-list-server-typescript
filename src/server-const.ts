export const keyPort = 'WEBSOCKET_PORT'; //HEROKU_DYNAMIC_
export const devPort = 5000;

// heroku provides dynamic ports
export const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : devPort;
// heroku crashes on IPv6 binding
export const HOST: string = '0.0.0.0'; // '192.168.43.135'
export const URL = `http://${HOST}:${PORT}`;
