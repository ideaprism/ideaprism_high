import type { SchoolSlug } from '@/config/schools'

interface SchoolCrestProps {
  slug: SchoolSlug
  size?: number
  className?: string
}

export function SchoolCrest({ slug, size = 56, className }: SchoolCrestProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
    >
      {slug === 'daegwang' && <DaegwangMark />}
      {slug === 'mirae' && <MiraeMark />}
      {slug === 'samil' && <SamilMark />}
      {slug === 'boseong' && <BoseongMark />}
    </svg>
  )
}

function DaegwangMark() {
  return (
    <>
      <circle cx="32" cy="32" r="30" fill="#0C7A43" />
      <circle cx="32" cy="32" r="24" fill="none" stroke="#F4E7C5" strokeWidth="1.2" />
      <g fill="#C4161C" transform="translate(32 30)">
        <ellipse cx="0" cy="-9" rx="4.2" ry="7" />
        <ellipse cx="0" cy="-9" rx="4.2" ry="7" transform="rotate(72)" />
        <ellipse cx="0" cy="-9" rx="4.2" ry="7" transform="rotate(144)" />
        <ellipse cx="0" cy="-9" rx="4.2" ry="7" transform="rotate(216)" />
        <ellipse cx="0" cy="-9" rx="4.2" ry="7" transform="rotate(288)" />
      </g>
      <circle cx="32" cy="30" r="3.2" fill="#F4E7C5" />
      <text x="32" y="52" textAnchor="middle" fill="#F4E7C5" fontSize="8" fontFamily="serif">
        洸
      </text>
    </>
  )
}

function MiraeMark() {
  return (
    <>
      <rect x="2" y="2" width="60" height="60" rx="8" fill="#17233F" />
      <path d="M14 40 L32 16 L50 40" fill="none" stroke="#E7D7C3" strokeWidth="2.4" />
      <path d="M20 40 L32 24 L44 40" fill="none" stroke="#C45C4A" strokeWidth="2" />
      <circle cx="32" cy="40" r="2.2" fill="#E7D7C3" />
      <text x="32" y="54" textAnchor="middle" fill="#E7D7C3" fontSize="8" fontFamily="serif">
        微
      </text>
    </>
  )
}

function SamilMark() {
  return (
    <>
      <circle cx="32" cy="32" r="30" fill="#6E2B55" />
      <rect x="16" y="14" width="32" height="28" fill="none" stroke="#F8E8C8" strokeWidth="1.4" />
      <path d="M16 22 H48 M16 30 H48 M26.5 14 V42 M37.5 14 V42" stroke="#F8E8C8" strokeWidth="1" />
      <circle cx="32" cy="28" r="3" fill="#E2B423" />
      <text x="32" y="54" textAnchor="middle" fill="#F8E8C8" fontSize="8" fontFamily="serif">
        三一
      </text>
    </>
  )
}

function BoseongMark() {
  return (
    <>
      <path d="M32 4 L56 14 V34 C56 48 44 58 32 62 C20 58 8 48 8 34 V14 Z" fill="#7C1E2B" />
      <path d="M32 10 L50 17.5 V33.5 C50 44.5 41 52.5 32 56 C23 52.5 14 44.5 14 33.5 V17.5 Z" fill="none" stroke="#E7D3A1" strokeWidth="1.2" />
      <path d="M18 28 H46" stroke="#E7D3A1" strokeWidth="1.4" />
      <text x="32" y="26" textAnchor="middle" fill="#F8F1E4" fontSize="11" fontFamily="serif">
        普成
      </text>
      <text x="32" y="42" textAnchor="middle" fill="#E7D3A1" fontSize="7" fontFamily="serif">
        1906
      </text>
    </>
  )
}
