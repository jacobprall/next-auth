import { beforeAll } from "vitest"

import { getObjectFrom, SQLiteCloudAdapter, up } from "../src/"
import {
  GET_USER_BY_ID,
  GET_SESSION_BY_TOKEN,
  GET_ACCOUNT_BY_PROVIDER_AND_PROVIDER_ACCOUNT_ID,
  GET_VERIFICATION_TOKEN_BY_IDENTIFIER_AND_TOKEN,
} from "../src/sql"
import { runBasicTests } from "utils/adapter"
import { Database } from "@sqlitecloud/drivers"

const SQLITE_CLOUD_URL = process.env.SQLITE_CLOUD_URL ?? ""

const db = new Database(SQLITE_CLOUD_URL!)

const adapter = SQLiteCloudAdapter(db)

beforeAll(async () => {
  await up(db)
})

runBasicTests({
  adapter,
  db: {
    user: async (id) => {
      const [result] = await db.sql(GET_USER_BY_ID, [id])
      return result ? getObjectFrom(result) : null
    },
    session: async (sessionToken) => {
      const [result] = await db.sql(GET_SESSION_BY_TOKEN, [sessionToken])
      return result ? getObjectFrom(result) : null
    },
    account: async ({ provider, providerAccountId }) => {
      const [result] = await db.sql(
        GET_ACCOUNT_BY_PROVIDER_AND_PROVIDER_ACCOUNT_ID,
        [provider, providerAccountId]
      )
      return result ? getObjectFrom(result) : null
    },
    verificationToken: async ({ identifier, token }) => {
      const [result] = await db.sql(
        GET_VERIFICATION_TOKEN_BY_IDENTIFIER_AND_TOKEN,
        [identifier, token]
      )
      return result ? getObjectFrom(result) : null
    },
  },
})
