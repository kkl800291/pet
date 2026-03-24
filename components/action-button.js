"use client";

export function ActionButton({ children, onClick, href, variant = 'primary', type = 'button', disabled }) {
  const className = `btn btn-${variant}`;
  if (href) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} className={className} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
