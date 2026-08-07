import { Link } from 'react-router-dom'

type AdminNavProps = {
  onLogout?: () => void
  logoutDisabled?: boolean
}

export default function AdminNav({ onLogout, logoutDisabled = false }: AdminNavProps) {
  return (
    <nav className="mb-6 flex items-center gap-3 text-sm">
      <Link to="/admin" className="underline">
        Dashboard
      </Link>
      <Link to="/admin/users" className="underline">
        Admin Users
      </Link>
      <Link to="/admin/articles" className="underline">
        Articles
      </Link>
      {onLogout ? (
        <button type="button" onClick={onLogout} disabled={logoutDisabled} className="underline">
          Logout
        </button>
      ) : (
        <button type="button" disabled title="Placeholder" className="underline">
          Logout
        </button>
      )}
    </nav>
  )
}
