const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnautypescriptthorized: false,
  },
});

export function sample_query(): string {
  let ret = '';

  client.connect();
  const query = 'SELECT table_schema,table_name FROM information_schema.tables;';
  client.query(query, (err: any, res: { rows: any }) => {
    if (err) throw err;
    for (let row of res.rows) {
      const str = JSON.stringify(row);
      ret += str;
      console.log(str);
    }
    client.end();
  });

  return ret;
}
