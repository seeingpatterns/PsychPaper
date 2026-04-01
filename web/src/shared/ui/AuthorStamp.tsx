type AuthorStampProps = {
  name: string
  role: string
  /** 없으면 점선 프레임(사진 넣을 자리) */
  photoUrl?: string
  className?: string
}

export function AuthorStamp({ name, role, photoUrl, className = '' }: AuthorStampProps) {
  return (
    <div className={`author-stamp ${className}`.trim()}>
      <div className="author-stamp-frame">
        {photoUrl ? (
          <img className="author-stamp-img" src={photoUrl} alt="" width={56} height={56} />
        ) : (
          <div
            className="author-stamp-placeholder"
            role="img"
            aria-label={`${name} 프로필 사진을 넣을 수 있습니다`}
          >
            <svg
              className="author-stamp-placeholder-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0115 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
            <span className="author-stamp-placeholder-label">사진</span>
          </div>
        )}
      </div>
      <div className="author-stamp-meta">
        <p className="author-stamp-name">{name}</p>
        <p className="author-stamp-role">{role}</p>
      </div>
    </div>
  )
}
