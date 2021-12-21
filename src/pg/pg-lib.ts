// // https://devcenter.heroku.com/articles/heroku-postgresql#connecting-in-node-js
// import { Client, QueryResult, QueryResultRow } from 'pg';
// const client = new Client({
//   connectionString: process.env.DATABASE_URL,
//   // ssl: {
//   //   rejectUnautypescriptthorized: false,
//   // },
// });

// // https://gist.github.com/zerbfra/70b155fa00b4e0d6fd1d4e090a039ad4
// export async function select(q: string): Promise<QueryResult<QueryResultRow>> {
//   let ret: QueryResult<QueryResultRow>;
//   try {
//     client.connect();
//     ret = await client.query(
//       q
//       // (err: any, res: { rows: any }) => {
//       // }
//     );
//   } finally {
//     client.end();
//   }
//   return ret;
// }

// https://node-postgres.com/features/pooling
import { Pool, QueryResult, QueryResultRow } from 'pg';

// console.warn('process.env.DATABASE_URL', process.env.DATABASE_URL);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function select(q: string): Promise<QueryResult<QueryResultRow>> {
  let result: QueryResult<QueryResultRow>;
  const client = await pool.connect();
  try {
    const res = await client.query(q);
    result = res;
  } finally {
    // Make sure to release the client before any error handling,
    // just in case the error handling itself throws an error.
    client.release();
  }
  return result;
}

// https://stackoverflow.com/questions/60355815/how-to-type-node-postgres-async-query-functions-in-typescript
// const Table = {
//   getOne: async (id: string): Promise<QueryResult> => {
//     return db.query('SELECT * FROM table WHERE id=$1', [id]);
//   },
// }

// // "getOne" should be called like this
// try {
//   const result = await Table.getOne("YOUR_ID");
//   // handle result
// } catch (e) {
//   // handle error
// }
