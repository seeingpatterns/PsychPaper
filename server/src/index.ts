import 'dotenv/config'
import { Pool } from 'pg'
import { createApp } from './app.js'
import { AdminUserService } from './application/admin-user/AdminUserService.js'
import { PgAdminUserRepository } from './infrastructure/persistence/PgAdminUserRepository.js'

const PORT = process.env.PORT ?? 3000
const connectionString = process.env.DATABASE_URL
if (typeof connectionString !== 'string' || !connectionString.trim()) {
  throw new Error('DATABASE_URL must be set (e.g. in server/.env). Example: postgresql://user:password@localhost:5432/psychpaper')
}
const pool = new Pool({ connectionString })

const repo = new PgAdminUserRepository(pool)
const adminUserService = new AdminUserService(repo)
const app = createApp({ adminUserService, pool })

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
