import { Database, SQLiteCloudRow } from "@sqlitecloud/drivers"
import type {
  Adapter,
  AdapterAccount,
  AdapterSession,
  AdapterUser,
  VerificationToken,
} from "@auth/core/adapters"
import {
  CREATE_ACCOUNT_SQL,
  CREATE_SESSION_SQL,
  CREATE_USER_SQL,
  CREATE_VERIFICATION_TOKEN_SQL,
  DELETE_ACCOUNT_BY_PROVIDER_AND_PROVIDER_ACCOUNT_ID_SQL,
  DELETE_ACCOUNT_BY_USER_ID_SQL,
  DELETE_SESSION_BY_USER_ID_SQL,
  DELETE_SESSION_SQL,
  DELETE_USER_SQL,
  DELETE_VERIFICATION_TOKEN_SQL,
  GET_ACCOUNT_BY_PROVIDER_AND_PROVIDER_ACCOUNT_ID_SQL,
  GET_SESSION_BY_TOKEN_SQL,
  GET_USER_BY_ACCOUNT_SQL,
  GET_USER_BY_EMAIL_SQL,
  GET_USER_BY_ID_SQL,
  GET_USER_BY_ROW_ID_SQL,
  GET_VERIFICATION_TOKEN_BY_IDENTIFIER_AND_TOKEN_SQL,
  UPDATE_SESSION_BY_SESSION_TOKEN_SQL,
  UPDATE_USER_BY_ID_SQL,
} from "./sql.js"
export interface SQLiteCloudAdapterOptions {
  /**
   * The URL of your SQLite Cloud database
   * in the format sqlitecloud://<domain>:<port>/<dbName>?apikey=<apiKey>
   **/
  connectionString: string
}

export const getEnvConnectionString = () => {
  return process.env.SQLITE_CLOUD_URL
}

const isoDateRE =
  /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/

const isDate = (val: any): val is ConstructorParameters<typeof Date>[0] =>
  !!(val && isoDateRE.test(val) && !isNaN(Date.parse(val)))

export const format = {
  /** Takes an object that's coming from a database and converts it to plain JavaScript. */
  from<T>(object: Record<string, any> = {}) {
    const newObject: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(object))
      if (isDate(value)) newObject[key] = new Date(value)
      else newObject[key] = value
    return newObject as Record<string, any>
  },
  /** Takes an object that's coming from Auth.js and prepares it to be written to the database. */
  to<T>(object: Record<string, any>) {
    const newObject: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(object))
      if (value instanceof Date) newObject[key] = value.toISOString()
      else newObject[key] = value
    return newObject as Record<string, any>
  },
}

export function getObjectFrom(row: SQLiteCloudRow) {
  const obj: Record<string, any> = {}
  for (const key in row) {
    obj[key] = row[key]
  }
  const formattedObj = format.from(obj)
  if (Object.keys(formattedObj).length === 0) return null
  return formattedObj
}

export function getInsertableFrom(obj: Record<string, any>) {
  const insertable: Record<string, any> = {}
  for (const key in obj) {
    insertable[key] = obj[key]
  }
  const formattedRow = format.to(insertable)
  if (Object.keys(formattedRow).length === 0) return null
  return formattedRow
}

export function SQLiteCloudAdapter(
  options?: SQLiteCloudAdapterOptions
): Adapter {
  let connectionString = options?.connectionString ?? getEnvConnectionString()
  if (!connectionString) {
    throw new Error(
      "SQLITE_CLOUD_URL is not set and no connection string was provided"
    )
  }

  const db = new Database(connectionString)

  return {
    async createUser(data: AdapterUser) {
      const insertable = getInsertableFrom(data) as AdapterUser
      const { lastID } = await db.sql(CREATE_USER_SQL, [
        insertable.id,
        insertable.name,
        insertable.email,
        insertable.emailVerified,
        insertable.image,
      ])
      const result = await db.sql(GET_USER_BY_ROW_ID_SQL, [lastID])
      return getObjectFrom(result[0])
    },
    async getUser(userId: string) {
      const [result] = await db.sql(GET_USER_BY_ID_SQL, [userId])
      return result ? getObjectFrom(result) : null
    },
    async getUserByEmail(email: string) {
      const [result] = await db.sql(GET_USER_BY_EMAIL_SQL, [email])
      return result ? getObjectFrom(result) : null
    },
    async createSession(data: AdapterSession) {
      const insertable = getInsertableFrom(data) as AdapterSession
      await db.sql(CREATE_SESSION_SQL, [
        crypto.randomUUID(),
        insertable.sessionToken,
        insertable.userId,
        insertable.expires,
      ])
      const [result] = await db.sql(GET_SESSION_BY_TOKEN_SQL, [
        insertable.sessionToken,
      ])
      return result ? getObjectFrom(result) : null
    },
    async updateUser(data: Partial<AdapterUser>) {
      const [oldUserRow] = await db.sql(GET_USER_BY_ID_SQL, [data.id])
      if (!oldUserRow) throw new Error("User not found")
      const oldUserObj = getInsertableFrom(getObjectFrom(oldUserRow)!)!
      const insertable = getInsertableFrom(data) as AdapterUser
      const newUserObj = Object.assign(oldUserObj, insertable)
      await db.sql(UPDATE_USER_BY_ID_SQL, [
        newUserObj.name,
        newUserObj.email,
        newUserObj.emailVerified,
        newUserObj.image,
        newUserObj.id,
      ])
      const [result] = await db.sql(GET_USER_BY_ID_SQL, [newUserObj.id])
      return result ? getObjectFrom(result) : null
    },
    async updateSession(data: Partial<AdapterSession>) {
      const insertable = getInsertableFrom(data) as AdapterSession
      await db.sql(UPDATE_SESSION_BY_SESSION_TOKEN_SQL, [
        insertable.expires,
        insertable.sessionToken,
      ])
      const [result] = await db.sql(GET_SESSION_BY_TOKEN_SQL, [
        insertable.sessionToken,
      ])
      return result ? getObjectFrom(result) : null
    },
    async deleteSession(sessionToken: string) {
      await db.sql(DELETE_SESSION_SQL, [sessionToken])
      return null
    },
    async deleteUser(id: string) {
      const [result] = await db.sql(GET_USER_BY_ID_SQL, [id])
      if (!result) throw new Error("User not found")
      await db.sql(DELETE_USER_SQL, [id])
      await db.sql(DELETE_SESSION_BY_USER_ID_SQL, [id])
      await db.sql(DELETE_ACCOUNT_BY_USER_ID_SQL, [id])
      return null
    },
    async linkAccount(data: AdapterAccount) {
      const insertable = getInsertableFrom(data) as AdapterAccount
      await db.sql(CREATE_ACCOUNT_SQL, [
        crypto.randomUUID(),
        insertable.userId,
        insertable.type,
        insertable.provider,
        insertable.providerAccountId,
        insertable.refresh_token,
        insertable.access_token,
        insertable.expires_at,
        insertable.token_type,
        insertable.scope,
        insertable.id_token,
        insertable.session_state,
      ])
    },
    async getUserByAccount(account: AdapterAccount) {
      const [result] = await db.sql(GET_USER_BY_ACCOUNT_SQL, [
        account.providerAccountId,
        account.provider,
      ])
      return result ? getObjectFrom(result) : null
    },
    async unlinkAccount(account: AdapterAccount) {
      await db.sql(DELETE_ACCOUNT_BY_PROVIDER_AND_PROVIDER_ACCOUNT_ID_SQL, [
        account.provider,
        account.providerAccountId,
      ])
    },
    async getAccount(providerAccountId: string, provider: string) {
      const [result] = await db.sql(
        GET_ACCOUNT_BY_PROVIDER_AND_PROVIDER_ACCOUNT_ID_SQL,
        [provider, providerAccountId]
      )
      return result ? getObjectFrom(result) : null
    },
    async getSessionAndUser(sessionToken: string) {
      const [sessionRow] = await db.sql(GET_SESSION_BY_TOKEN_SQL, [
        sessionToken,
      ])
      if (!sessionRow) return null
      const [userRow] = await db.sql(GET_USER_BY_ID_SQL, [sessionRow.userId])
      if (!userRow) return null
      const user = getObjectFrom(userRow)
      const session = getObjectFrom(sessionRow)
      return {
        session,
        user,
      }
    },
    async createVerificationToken(data: VerificationToken) {
      const insertable = getInsertableFrom(data) as VerificationToken
      await db.sql(CREATE_VERIFICATION_TOKEN_SQL, [
        insertable.identifier,
        insertable.expires,
        insertable.token,
      ])
    },
    async useVerificationToken(params: { identifier: string; token: string }) {
      const [result] = await db.sql(
        GET_VERIFICATION_TOKEN_BY_IDENTIFIER_AND_TOKEN_SQL,
        [params.identifier, params.token]
      )
      if (!result) return null
      await db.sql(DELETE_VERIFICATION_TOKEN_SQL, [
        params.identifier,
        params.token,
      ])
      return getObjectFrom(result)
    },
    // async createAuthenticator(data: AdapterAuthenticator) {
    //   await db.sql(CREATE_AUTHENTICATOR_SQL, [data.id, data.userId, data.credentialID, data.counter])
    // },
    // async getAuthenticator(credentialID: string) {
    //   const result = await db.sql(GET_AUTHENTICATOR_BY_CREDENTIAL_ID_SQL, [credentialID])
    //   return result[0]
    // },
    // async listAuthenticatorsByUserId(userId: string) {
    //   const result = await db.sql(LIST_AUTHENTICATORS_BY_USER_ID_SQL, [userId])
    //   return result
    // },
    // async updateAuthenticatorCounter(credentialID: string, newCounter: number) {
    //   await db.sql(UPDATE_AUTHENTICATOR_COUNTER_SQL, [newCounter, credentialID])
    // },
  }
}

export { up, down } from "./migrations.js"
