import snowflake from 'snowflake-sdk'
import { config } from '../config'

snowflake.configure({ logLevel: 'ERROR' })

let _connection: snowflake.Connection | null = null

async function getConnection(): Promise<snowflake.Connection> {
  if (_connection && _connection.isUp()) {
    return _connection
  }

  _connection = snowflake.createConnection({
    account: config.snowflake.account,
    username: config.snowflake.username,
    password: config.snowflake.password,
    database: config.snowflake.database,
    schema: config.snowflake.schema,
    warehouse: config.snowflake.warehouse,
    role: config.snowflake.role,
    application: 'ProEdge',
  })

  await new Promise<void>((resolve, reject) => {
    _connection!.connect((err) => {
      if (err) reject(new Error(`Snowflake connection failed: ${err.message}`))
      else resolve()
    })
  })

  return _connection
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  binds: (string | number | boolean | null)[] = []
): Promise<T[]> {
  const conn = await getConnection()
  return new Promise<T[]>((resolve, reject) => {
    conn.execute({
      sqlText: sql,
      binds: binds as snowflake.Bind[],
      complete: (err, _stmt, rows) => {
        if (err) reject(err)
        else resolve((rows ?? []) as T[])
      },
    })
  })
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  binds: (string | number | boolean | null)[] = []
): Promise<T | null> {
  const rows = await query<T>(sql, binds)
  return rows[0] ?? null
}

export async function execute(
  sql: string,
  binds: (string | number | boolean | null)[] = []
): Promise<void> {
  await query(sql, binds)
}
