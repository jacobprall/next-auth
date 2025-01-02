import { Database, SQLiteCloudRow } from "@sqlitecloud/drivers"
import type {
  Adapter,
  AdapterAccount,
  AdapterSession,
  AdapterUser,
  VerificationToken,
} from "@auth/core/adapters"
import {
  INSERT_ACCOUNT,
  INSERT_SESSION,
  INSERT_USER,
  INSERT_VERIFICATION_TOKEN,
  DELETE_ACCOUNT_BY_PROVIDER_AND_PROVIDER_ACCOUNT_ID,
  DELETE_ACCOUNT_BY_USER_ID,
  DELETE_SESSION_BY_USER_ID,
  DELETE_SESSION,
  DELETE_USER,
  DELETE_VERIFICATION_TOKEN,
  GET_ACCOUNT_BY_PROVIDER_AND_PROVIDER_ACCOUNT_ID,
  GET_SESSION_BY_TOKEN,
  GET_USER_BY_ACCOUNT,
  GET_USER_BY_EMAIL,
  GET_USER_BY_ID,
  GET_USER_BY_ROW_ID,
  GET_VERIFICATION_TOKEN_BY_IDENTIFIER_AND_TOKEN,
  UPDATE_SESSION_BY_SESSION_TOKEN,
  UPDATE_USER_BY_ID,
  GET_SESSION_AND_USER_BY_TOKEN,
} from "./sql.js"

export function SQLiteCloudAdapter(db: Database): Adapter {
  return {
    async createUser(user: AdapterUser) {
      const { name, email, emailVerified, image } = getInsertableFrom(
        user
      ) as AdapterUser

      const { lastID } = await db.sql(INSERT_USER, [
        name,
        email,
        emailVerified,
        image,
      ])
      const result = await db.sql(GET_USER_BY_ROW_ID, [lastID])
      return getObjectFrom(result[0])
    },
    async getUser(userId: string) {
      const [result] = await db.sql(GET_USER_BY_ID, [userId])
      return result ? getObjectFrom(result) : null
    },
    async getUserByEmail(email: string) {
      const [result] = await db.sql(GET_USER_BY_EMAIL, [email])
      return result ? getObjectFrom(result) : null
    },
    async createSession(session: AdapterSession) {
      const { sessionToken, userId, expires } = getInsertableFrom(
        session
      ) as AdapterSession
      await db.sql(INSERT_SESSION, [
        crypto.randomUUID(),
        sessionToken,
        userId,
        expires,
      ])
      const [result] = await db.sql(GET_SESSION_BY_TOKEN, [sessionToken])
      return result ? getObjectFrom(result) : null
    },
    async updateUser(data: Partial<AdapterUser>) {
      const [oldUserRow] = await db.sql(GET_USER_BY_ID, [data.id])
      if (!oldUserRow) throw new Error("User not found")
      const oldUserObj = getInsertableFrom(getObjectFrom(oldUserRow)!)!
      const insertable = getInsertableFrom(data) as AdapterUser
      const { name, email, emailVerified, image, id } = Object.assign(
        oldUserObj,
        insertable
      )
      await db.sql(UPDATE_USER_BY_ID, [name, email, emailVerified, image, id])
      const [result] = await db.sql(GET_USER_BY_ID, [id])
      return result ? getObjectFrom(result) : null
    },
    async updateSession(data: Partial<AdapterSession>) {
      const { expires, sessionToken } = getInsertableFrom(
        data
      ) as AdapterSession
      await db.sql(UPDATE_SESSION_BY_SESSION_TOKEN, [expires, sessionToken])
      const [result] = await db.sql(GET_SESSION_BY_TOKEN, [sessionToken])
      return result ? getObjectFrom(result) : null
    },
    async deleteSession(sessionToken: string) {
      await db.sql(DELETE_SESSION, [sessionToken])
      return null
    },
    async deleteUser(id: string) {
      const [result] = await db.sql(GET_USER_BY_ID, [id])
      if (!result) throw new Error("User not found")
      await db.sql(DELETE_USER, [id])
      await db.sql(DELETE_SESSION_BY_USER_ID, [id])
      await db.sql(DELETE_ACCOUNT_BY_USER_ID, [id])
      return null
    },
    async linkAccount(data: AdapterAccount) {
      const {
        userId,
        type,
        provider,
        providerAccountId,
        refresh_token,
        access_token,
        expires_at,
        token_type,
        scope,
        id_token,
        session_state,
      } = getInsertableFrom(data) as AdapterAccount
      await db.sql(INSERT_ACCOUNT, [
        userId,
        type,
        provider,
        providerAccountId,
        refresh_token,
        access_token,
        expires_at,
        token_type,
        scope,
        id_token,
        session_state,
      ])
    },
    async getUserByAccount(account: AdapterAccount) {
      const [result] = await db.sql(GET_USER_BY_ACCOUNT, [
        account.providerAccountId,
        account.provider,
      ])
      return result ? getObjectFrom(result) : null
    },
    async unlinkAccount(account: AdapterAccount) {
      const { provider, providerAccountId } = getInsertableFrom(
        account
      ) as AdapterAccount
      await db.sql(DELETE_ACCOUNT_BY_PROVIDER_AND_PROVIDER_ACCOUNT_ID, [
        provider,
        providerAccountId,
      ])
    },
    async getAccount(providerAccountId: string, provider: string) {
      const [result] = await db.sql(
        GET_ACCOUNT_BY_PROVIDER_AND_PROVIDER_ACCOUNT_ID,
        [provider, providerAccountId]
      )
      return result ? getObjectFrom(result) : null
    },
    async getSessionAndUser(sessionToken: string) {
      const [sessionRow] = await db.sql(GET_SESSION_AND_USER_BY_TOKEN, [
        sessionToken,
      ])
      return sessionRow ? getObjectFrom(sessionRow) : null
    },
    async createVerificationToken(verificationToken: VerificationToken) {
      const { identifier, expires, token } = getInsertableFrom(
        verificationToken
      ) as VerificationToken
      await db.sql(INSERT_VERIFICATION_TOKEN, [identifier, expires, token])
      return verificationToken
    },
    async useVerificationToken({
      identifier,
      token,
    }: {
      identifier: string
      token: string
    }) {
      const [result] = await db.sql(
        GET_VERIFICATION_TOKEN_BY_IDENTIFIER_AND_TOKEN,
        [identifier, token]
      )
      await db.sql(DELETE_VERIFICATION_TOKEN, [identifier, token])
      return result ? getObjectFrom(result) : null
    },
    // async createAuthenticator(data: AdapterAuthenticator) {
    //   await db.sql(INSERT_AUTHENTICATOR, [data.id, data.userId, data.credentialID, data.counter])
    // },
    // async getAuthenticator(credentialID: string) {
    //   const result = await db.sql(GET_AUTHENTICATOR_BY_CREDENTIAL_ID, [credentialID])
    //   return result[0]
    // },
    // async listAuthenticatorsByUserId(userId: string) {
    //   const result = await db.sql(LIST_AUTHENTICATORS_BY_USER_ID, [userId])
    //   return result
    // },
    // async updateAuthenticatorCounter(credentialID: string, newCounter: number) {
    //   await db.sql(UPDATE_AUTHENTICATOR_COUNTER, [newCounter, credentialID])
    // },
  }
}

const isoDateRE =
  /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/

const isDate = (val: any): val is ConstructorParameters<typeof Date>[0] =>
  !!(val && isoDateRE.test(val) && !isNaN(Date.parse(val)))

const format = {
  /** Takes an object that's coming from a database and converts it to plain JavaScript. */
  from<T>(object: Record<string, any> = {}) {
    const newObject: Record<string, any> = {}
    for (const [key, value] of Object.entries(object))
      if (isDate(value)) newObject[key] = new Date(value)
      else newObject[key] = value
    return newObject
  },
  /** Takes an object that's coming from Auth.js and prepares it to be written to the database. */
  to<T>(object: Record<string, any>) {
    const newObject: Record<string, any> = {}
    for (const [key, value] of Object.entries(object))
      if (value instanceof Date) newObject[key] = value.toISOString()
      else newObject[key] = value
    return newObject
  },
}

function getObjectFrom(row: SQLiteCloudRow) {
  const obj: Record<string, any> = {}
  for (const key in row) {
    obj[key] = row[key]
  }
  const formattedObj = format.from(obj)
  return formattedObj
}

function getInsertableFrom(obj: Record<string, any>) {
  const insertable: Record<string, any> = {}
  for (const key in obj) {
    insertable[key] = obj[key]
  }
  const formattedRow = format.to(insertable)
  return formattedRow
}

export { up, down } from "./migrations.js"
