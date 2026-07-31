# DB client access (example)

Copy to `secrets/db-access.md` and fill real values.  
`secrets/db-access.md` is gitignored — do not commit passwords.

## psychpaper_admin (team DB client — DBeaver, psql, etc.)

| Field | Value |
|-------|--------|
| Host | `<railway-or-host>` |
| Port | `5432` |
| Database | `psychpaper` |
| User | `psychpaper_admin` |
| Password | `<from 11_db_roles.sql after local replace>` |
| SSL | require (Railway) / disable (local Docker) |

Connection URI:

```text
postgresql://psychpaper_admin:<PASSWORD>@<HOST>:5432/psychpaper
```

## Notes

- Do **not** share the bootstrap `POSTGRES_USER` password with the team.
- App runtime uses `psychpaper_app` via `DATABASE_URL` only (server env / Railway variables).
- Create roles with `db-schema/11_db_roles.sql` after applying `schema.sql`.
