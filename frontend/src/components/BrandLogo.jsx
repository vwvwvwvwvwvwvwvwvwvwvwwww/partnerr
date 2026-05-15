export default function BrandLogo({ compact = false, light = false }) {
  return (
    <div className={`brand-logo${compact ? ' brand-logo--compact' : ''}${light ? ' brand-logo--light' : ''}`}>
      <div className="brand-logo__mark" aria-hidden="true">
        <svg viewBox="0 0 64 64">
          <rect x="6" y="6" width="52" height="52" rx="16" fill="#203226" />
          <path
            d="M10 44 C20 36, 30 34, 40 34 C48 34, 54 36, 58 40 L58 58 L10 58 Z"
            fill="#6e9f63"
          />
          <path
            d="M10 52 C20 45, 31 42, 42 42 C49 42, 55 44, 58 46 L58 58 L10 58 Z"
            fill="#8cb875"
          />
          <path
            d="M12 56 C22 50, 33 48, 44 48 C50 48, 55 49, 58 51 L58 58 L12 58 Z"
            fill="#d7b65b"
          />
          <path
            d="M16 38 C22 28, 31 20, 44 15"
            fill="none"
            stroke="#f4e7bf"
            strokeLinecap="round"
            strokeWidth="3.5"
          />
          <path
            d="M18 28 C23 33, 27 36, 34 39"
            fill="none"
            stroke="rgba(244,231,191,0.45)"
            strokeLinecap="round"
            strokeWidth="3"
          />
          <circle cx="45" cy="17" r="4.5" fill="#f0cb70" />
        </svg>
      </div>

      <div className="brand-logo__text">
        {!compact ? <strong className="brand-logo__name">Сельхоз ERP</strong> : null}
      </div>
    </div>
  );
}
