import { Database } from "@sqlitecloud/drivers"
const upSQLStatements = [
  `CREATE TABLE IF NOT EXISTS "accounts" (
    "id" text NOT NULL,
    "userId" text NOT NULL DEFAULT NULL,
    "type" text NOT NULL DEFAULT NULL,
    "provider" text NOT NULL DEFAULT NULL,
    "providerAccountId" text NOT NULL DEFAULT NULL,
    "refresh_token" text DEFAULT NULL,
    "access_token" text DEFAULT NULL,
    "expires_at" number DEFAULT NULL,
    "token_type" text DEFAULT NULL,
    "scope" text DEFAULT NULL,
    "id_token" text DEFAULT NULL,
    "session_state" text DEFAULT NULL,
    PRIMARY KEY (id)
);`,
  `CREATE TABLE IF NOT EXISTS "sessions" (
    "id" text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL DEFAULT NULL,
    "expires" datetime NOT NULL DEFAULT NULL, 
    PRIMARY KEY (sessionToken)
);`,
  `CREATE TABLE IF NOT EXISTS "users" (
    "id" text NOT NULL DEFAULT '',
    "name" text DEFAULT NULL,
    "email" text DEFAULT NULL,
    "emailVerified" datetime DEFAULT NULL,
    "image" text DEFAULT NULL, 
    PRIMARY KEY (id)
);`,
  `CREATE TABLE IF NOT EXISTS "verification_tokens" (
    "identifier" text NOT NULL,
    "token" text NOT NULL DEFAULT NULL,
    "expires" datetime NOT NULL DEFAULT NULL, 
    PRIMARY KEY (token)
);`,
  `CREATE TABLE IF NOT EXISTS "authenticator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "credentialID" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "credentialPublicKey" TEXT NOT NULL,
    "counter" INTEGER NOT NULL,
    "credentialDeviceType" TEXT NOT NULL,
    "credentialBackedUp" BOOLEAN NOT NULL,
    "transports" TEXT,
    FOREIGN KEY ("userId") 
        REFERENCES "User" ("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);`,
]

export const downSQLStatements = [
  `DROP TABLE IF EXISTS "accounts";`,
  `DROP TABLE IF EXISTS "sessions";`,
  `DROP TABLE IF EXISTS "users";`,
  `DROP TABLE IF EXISTS "verification_tokens";`,
  `DROP TABLE IF EXISTS "authenticator";`,
]

async function up(db: Database) {
  for (const sql of upSQLStatements) {
    try {
      await db.sql(sql)
    } catch (e: any) {
      console.error(e.cause?.message, e.message)
    }
  }
}

async function down(db: Database) {
  for (const sql of downSQLStatements) {
    try {
      await db.sql(sql)
    } catch (e: any) {
      console.error(e.cause?.message, e.message)
    }
  }
}

export { up, down }
