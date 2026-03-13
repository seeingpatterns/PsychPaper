import { Pool } from 'pg'
import { createApp } from './app.js'
import { AdminUserService } from './application/admin-user/AdminUserService.js'
import { PgAdminUserRepository } from './infrastructure/persistence/PgAdminUserRepository.js'

const PORT = process.env.PORT ?? 3000
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const repo = new PgAdminUserRepository(pool)
const adminUserService = new AdminUserService(repo)
const app = createApp({ adminUserService, pool })

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
