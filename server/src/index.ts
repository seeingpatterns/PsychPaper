import express from 'express'
import cors from 'cors'
import bcrypt from "bcryptjs";
import { Pool } from "pg";

const app = express()
const PORT = process.env.PORT ?? 3000
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'psychpaper-server' })
})

app.get('/api/admin/users', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, created_at
       FROM admin_users
       ORDER BY id`
    )
    res.json({
      users: result.rows.map((row) => ({
        id: row.id,
        username: row.username,
        created_at: row.created_at,
      })),
    })
  } catch (err) {
    console.error('admin users list error:', err)
    res.status(500).json({ ok: false, error: 'Failed to list admin users' })
  }
})

app.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body ?? {};

    if (typeof username !== "string" || typeof password !== "string") {
      return res.status(400).json({ ok: false, error: "Invalid payload" });
    }

    const result = await pool.query(
      `SELECT id, password_hash
       FROM admin_users
       WHERE username = $1
       LIMIT 1`,
      [username]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ ok: false });
    }

    const { password_hash } = result.rows[0];
    const ok = await bcrypt.compare(password, password_hash);

    if (!ok) return res.status(401).json({ ok: false });

    return res.json({ ok: true });
  } catch (err) {
    console.error("admin login error:", err);
    return res.status(500).json({ ok: false });
  }
});
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
