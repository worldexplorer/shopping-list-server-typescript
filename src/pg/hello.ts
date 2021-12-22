import { select } from './pg-lib';

export async function selectPublicTables(): Promise<string[]> {
  const query = `
SELECT table_name
FROM information_schema.tables
WHERE table_schema='public'`;

  const { rows } = await select(query);
  return rows.map(x => x['table_name']);
}
