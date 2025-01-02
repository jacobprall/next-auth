// USER
export const INSERT_USER = `INSERT INTO users (name, email, emailVerified, image) VALUES (?, ?, ?, ?)`
export const GET_USER_BY_ID = `SELECT * FROM users WHERE id = ?`
export const GET_USER_BY_ROW_ID = `SELECT * FROM users WHERE rowid = ?`
export const GET_USER_BY_EMAIL = `SELECT * FROM users WHERE email = ?`
export const GET_USER_BY_ACCOUNT = `
  SELECT u.*
  FROM users u JOIN accounts a ON a.userId = u.id
  WHERE a.providerAccountId = ? AND a.provider = ?`
export const UPDATE_USER_BY_ID = `
  UPDATE users 
  SET name = ?, email = ?, emailVerified = ?, image = ?
  WHERE id = ? `
export const DELETE_USER = `DELETE FROM users WHERE id = ?`

// SESSION
export const INSERT_SESSION =
  "INSERT INTO sessions (id, sessionToken, userId, expires) VALUES (?,?,?,?)"
export const GET_SESSION_BY_TOKEN = `SELECT * FROM sessions WHERE sessionToken = ?`
export const GET_SESSION_AND_USER_BY_TOKEN = `
  SELECT s.*, u.id, u.name, u.email, u.emailVerified, u.image
  FROM sessions s JOIN users u ON s.userId = u.id
  WHERE sessionToken = ?`
export const UPDATE_SESSION_BY_SESSION_TOKEN = `UPDATE sessions SET expires = ? WHERE sessionToken = ?`
export const DELETE_SESSION = `DELETE FROM sessions WHERE sessionToken = ?`
export const DELETE_SESSION_BY_USER_ID = `DELETE FROM sessions WHERE userId = ?`

// ACCOUNT
export const INSERT_ACCOUNT = `
  INSERT INTO accounts (
    userId, type, provider, 
    providerAccountId, refresh_token, access_token, 
    expires_at, token_type, scope, id_token, session_state
  ) 
  VALUES (?,?,?,?,?,?,?,?,?,?,?)`
export const GET_ACCOUNT_BY_ID = `SELECT * FROM accounts WHERE id = ? `
export const GET_ACCOUNT_BY_PROVIDER_AND_PROVIDER_ACCOUNT_ID = `SELECT * FROM accounts WHERE provider = ? AND providerAccountId = ?`
export const DELETE_ACCOUNT_BY_PROVIDER_AND_PROVIDER_ACCOUNT_ID = `DELETE FROM accounts WHERE provider = ? AND providerAccountId = ?`
export const DELETE_ACCOUNT_BY_USER_ID = `DELETE FROM accounts WHERE userId = ?`

// VERIFICATION_TOKEN
export const GET_VERIFICATION_TOKEN_BY_IDENTIFIER_AND_TOKEN = `SELECT * FROM verification_tokens WHERE identifier = ? AND token = ?`
export const INSERT_VERIFICATION_TOKEN = `INSERT INTO verification_tokens (identifier, expires, token) VALUES (?,?,?)`
export const DELETE_VERIFICATION_TOKEN = `DELETE FROM verification_tokens WHERE identifier = ? and token = ?`
