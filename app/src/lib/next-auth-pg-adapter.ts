/**
 * Postgres adapter for Auth.js using schema `next_auth` so it never collides with `public.users`.
 */
import type { Pool } from "pg";
import { mapExpiresAt } from "@auth/pg-adapter";

const S = "next_auth";

export default function NextAuthPostgresAdapter(client: Pool) {
  return {
    async createVerificationToken(verificationToken: {
      identifier: string;
      expires: Date;
      token: string;
    }) {
      const { identifier, expires, token } = verificationToken;
      const sql = `
        INSERT INTO ${S}.verification_token ( identifier, expires, token )
        VALUES ($1, $2, $3)
      `;
      await client.query(sql, [identifier, expires, token]);
      return verificationToken;
    },
    async useVerificationToken({ identifier, token }: { identifier: string; token: string }) {
      const sql = `DELETE FROM ${S}.verification_token
        WHERE identifier = $1 AND token = $2
        RETURNING identifier, expires, token`;
      const result = await client.query(sql, [identifier, token]);
      return result.rowCount !== 0 ? result.rows[0] : null;
    },
    async createUser(user: {
      name?: string | null;
      email?: string | null;
      emailVerified?: Date | null;
      image?: string | null;
    }) {
      const { name, email, emailVerified, image } = user;
      const sql = `
        INSERT INTO ${S}.users (name, email, "emailVerified", image)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, email, "emailVerified", image`;
      const result = await client.query(sql, [name, email, emailVerified, image]);
      return result.rows[0];
    },
    async getUser(id: string) {
      const sql = `SELECT * FROM ${S}.users WHERE id = $1`;
      try {
        const result = await client.query(sql, [id]);
        return result.rowCount === 0 ? null : result.rows[0];
      } catch {
        return null;
      }
    },
    async getUserByEmail(email: string) {
      const sql = `SELECT * FROM ${S}.users WHERE email = $1`;
      const result = await client.query(sql, [email]);
      return result.rowCount !== 0 ? result.rows[0] : null;
    },
    async getUserByAccount({
      providerAccountId,
      provider,
    }: {
      providerAccountId: string;
      provider: string;
    }) {
      const sql = `
        SELECT u.* FROM ${S}.users u
        JOIN ${S}.accounts a ON u.id = a."userId"
        WHERE a.provider = $1 AND a."providerAccountId" = $2`;
      const result = await client.query(sql, [provider, providerAccountId]);
      return result.rowCount !== 0 ? result.rows[0] : null;
    },
    async updateUser(user: {
      id: string;
      name?: string | null;
      email?: string | null;
      emailVerified?: Date | null;
      image?: string | null;
    }) {
      const fetchSql = `SELECT * FROM ${S}.users WHERE id = $1`;
      const query1 = await client.query(fetchSql, [user.id]);
      const oldUser = query1.rows[0];
      const newUser = { ...oldUser, ...user };
      const { id, name, email, emailVerified, image } = newUser;
      const updateSql = `
        UPDATE ${S}.users SET
        name = $2, email = $3, "emailVerified" = $4, image = $5
        WHERE id = $1
        RETURNING name, id, email, "emailVerified", image`;
      const query2 = await client.query(updateSql, [id, name, email, emailVerified, image]);
      return query2.rows[0];
    },
    async linkAccount(account: Record<string, unknown>) {
      const sql = `
        INSERT INTO ${S}.accounts (
          "userId", provider, type, "providerAccountId",
          access_token, expires_at, refresh_token, id_token, scope, session_state, token_type
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING
          id, "userId", provider, type, "providerAccountId",
          access_token, expires_at, refresh_token, id_token, scope, session_state, token_type`;
      const params = [
        account.userId,
        account.provider,
        account.type,
        account.providerAccountId,
        account.access_token,
        account.expires_at,
        account.refresh_token,
        account.id_token,
        account.scope,
        account.session_state,
        account.token_type,
      ];
      const result = await client.query(sql, params);
      return mapExpiresAt(result.rows[0]);
    },
    async createSession({
      sessionToken,
      userId,
      expires,
    }: {
      sessionToken: string;
      userId: string;
      expires: Date;
    }) {
      if (userId === undefined) {
        throw new Error("userId is undef in createSession");
      }
      const sql = `INSERT INTO ${S}.sessions ("userId", expires, "sessionToken")
        VALUES ($1, $2, $3)
        RETURNING id, "sessionToken", "userId", expires`;
      const result = await client.query(sql, [userId, expires, sessionToken]);
      return result.rows[0];
    },
    async getSessionAndUser(sessionToken: string | undefined) {
      if (sessionToken === undefined) {
        return null;
      }
      const result1 = await client.query(`SELECT * FROM ${S}.sessions WHERE "sessionToken" = $1`, [
        sessionToken,
      ]);
      if (result1.rowCount === 0) {
        return null;
      }
      const session = result1.rows[0];
      const result2 = await client.query(`SELECT * FROM ${S}.users WHERE id = $1`, [
        session.userId,
      ]);
      if (result2.rowCount === 0) {
        return null;
      }
      const user = result2.rows[0];
      return { session, user };
    },
    async updateSession(session: { sessionToken: string; expires: Date }) {
      const { sessionToken } = session;
      const result1 = await client.query(`SELECT * FROM ${S}.sessions WHERE "sessionToken" = $1`, [
        sessionToken,
      ]);
      if (result1.rowCount === 0) {
        return null;
      }
      const originalSession = result1.rows[0];
      const newSession = { ...originalSession, ...session };
      const sql = `UPDATE ${S}.sessions SET expires = $2 WHERE "sessionToken" = $1`;
      const result = await client.query(sql, [newSession.sessionToken, newSession.expires]);
      return result.rows[0];
    },
    async deleteSession(sessionToken: string) {
      await client.query(`DELETE FROM ${S}.sessions WHERE "sessionToken" = $1`, [sessionToken]);
    },
    async unlinkAccount(partialAccount: { provider: string; providerAccountId: string }) {
      const { provider, providerAccountId } = partialAccount;
      await client.query(
        `DELETE FROM ${S}.accounts WHERE "providerAccountId" = $1 AND provider = $2`,
        [providerAccountId, provider],
      );
    },
    async deleteUser(userId: string) {
      await client.query(`DELETE FROM ${S}.users WHERE id = $1`, [userId]);
      await client.query(`DELETE FROM ${S}.sessions WHERE "userId" = $1`, [userId]);
      await client.query(`DELETE FROM ${S}.accounts WHERE "userId" = $1`, [userId]);
    },
  };
}

export { mapExpiresAt };
