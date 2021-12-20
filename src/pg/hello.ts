// https://devcenter.heroku.com/articles/heroku-postgresql#connecting-in-node-js

import { Client, QueryResult, QueryResultRow } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  // ssl: {
  //   rejectUnautypescriptthorized: false,
  // },
});

export async function selectPublicTables(): Promise<string[]> {
  const query = `
SELECT table_name
FROM information_schema.tables
WHERE table_schema='public'`;

  const { rows } = await select(query);
  return rows.map(x => x['table_name']);
}

// https://gist.github.com/zerbfra/70b155fa00b4e0d6fd1d4e090a039ad4
export async function select(q: string): Promise<QueryResult<QueryResultRow>> {
  let ret: QueryResult<QueryResultRow>;

  try {
    client.connect();
    ret = await client.query(
      q
      // (err: any, res: { rows: any }) => {
      // }
    );
  } finally {
    client.end();
  }

  return ret;
}
