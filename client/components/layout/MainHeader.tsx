import React from 'react';

interface MainHeaderProps {
  isMobile?: boolean;
  isDarkMode?: boolean;
  isChatMode?: boolean;
}

export function MainHeader({ isMobile = false, isDarkMode = false, isChatMode = false }: MainHeaderProps) {

  return (
    <div
      className="flex items-center px-6 py-4 main_header_container"
      style={{
        padding: isMobile ? '12px 16px' : '16px 24px',
        minHeight: isMobile ? '60px' : '72px',
        background: 'transparent',
        justifyContent: isMobile ? 'center' : 'space-between'
      }}
    >
      {/* CelesteOS Static Branding */}
      <div className="celeste_branding_static">
        <div className="flex flex-col items-center">
          {/* CelesteOS Text - Static */}
          <h1
            className="celeste_title"
            style={{
              fontSize: isMobile ? '20px' : '24px',
              fontWeight: 400,
              lineHeight: isMobile ? '24px' : '28px',
              fontFamily: 'Eloquia Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937',
              margin: 0
            }}
          >
            Celeste
            <span
              className="celeste_os_suffix"
              style={{
                color: '#2563eb',
                fontWeight: 500
              }}
            >
              OS
            </span>
          </h1>

          {/* Bridge Subheader - Static */}
          <div
            className="bridge_subheader"
            style={{
              fontSize: isMobile ? '10px' : '11px',
              fontWeight: 500,
              lineHeight: isMobile ? '12px' : '14px',
              fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              color: isDarkMode
                ? 'rgba(246, 247, 251, 0.65)'
                : 'rgba(31, 41, 55, 0.6)',
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: '1.2px',
              marginTop: isMobile ? '2px' : '4px'
            }}
          >
            BRIDGE
          </div>
        </div>
      </div>
    </div>
  );
}