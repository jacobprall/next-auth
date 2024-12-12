import { beforeAll, afterAll } from "vitest"

import {
  down,
  getEnvConnectionString,
  getObjectFrom,
  SQLiteCloudAdapter,
  up,
} from "../src/"
import {
  GET_USER_BY_ID_SQL,
  GET_SESSION_BY_TOKEN_SQL,
  GET_ACCOUNT_BY_PROVIDER_AND_PROVIDER_ACCOUNT_ID_SQL,
  GET_VERIFICATION_TOKEN_BY_IDENTIFIER_AND_TOKEN_SQL,
} from "../src/sql"
import { runBasicTests } from "utils/adapter"
import { Database } from "@sqlitecloud/drivers"
const db = new Database(getEnvConnectionString())

const adapter = SQLiteCloudAdapter({
  connectionString: getEnvConnectionString(),
})

beforeAll(async () => {
  await up(db)
})

runBasicTests({
  adapter,
  db: {
    user: async (id) => {
      const [result] = await db.sql(GET_USER_BY_ID_SQL, [id])
      return result ? getObjectFrom(result) : null
    },
    session: async (sessionToken) => {
      const [result] = await db.sql(GET_SESSION_BY_TOKEN_SQL, [sessionToken])
      return result ? getObjectFrom(result) : null
    },
    account: async ({ provider, providerAccountId }) => {
      const [result] = await db.sql(
        GET_ACCOUNT_BY_PROVIDER_AND_PROVIDER_ACCOUNT_ID_SQL,
        [provider, providerAccountId]
      )
      return result ? getObjectFrom(result) : null
    },
    verificationToken: async ({ identifier, token }) => {
      const [result] = await db.sql(
        GET_VERIFICATION_TOKEN_BY_IDENTIFIER_AND_TOKEN_SQL,
        [identifier, token]
      )
      return result ? getObjectFrom(result) : null
    },
  },
})
