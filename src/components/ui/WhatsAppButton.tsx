import React, { useState } from 'react';
import { useCMS } from '@/hooks/useCMS';

export default function WhatsAppButton() {
  const [hovered, setHovered] = useState(false);
  const { settings } = useCMS(['settings']);

  const number = (settings['whatsapp'] || '250794890144').replace(/\D/g, '');
  const url = `https://wa.me/${number}?text=Hello%2C%20I%20need%20help%20with%20EternaRest%20Memorial%20Services.`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Support on WhatsApp"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position:       'fixed',
        bottom:         '28px',
        right:          '28px',
        zIndex:         9999,
        display:        'flex',
        alignItems:     'center',
        gap:            '10px',
        textDecoration: 'none',
      }}
    >
      {/* Tooltip */}
      <span
        style={{
          background:    '#1a1a1a',
          color:         '#fff',
          padding:       '6px 12px',
          borderRadius:  '6px',
          fontSize:      '13px',
          fontFamily:    'Arial, sans-serif',
          whiteSpace:    'nowrap',
          boxShadow:     '0 2px 8px rgba(0,0,0,0.25)',
          opacity:       hovered ? 1 : 0,
          transform:     hovered ? 'translateX(0)' : 'translateX(8px)',
          transition:    'opacity 0.2s ease, transform 0.2s ease',
          pointerEvents: 'none',
        }}
      >
        Chat with Support
      </span>

      {/* Button */}
      <span
        style={{
          width:          '56px',
          height:         '56px',
          background:     '#25D366',
          borderRadius:   '50%',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          boxShadow:      hovered
            ? '0 6px 24px rgba(37,211,102,0.55)'
            : '0 4px 14px rgba(37,211,102,0.40)',
          transform:      hovered ? 'scale(1.12)' : 'scale(1)',
          transition:     'transform 0.2s ease, box-shadow 0.2s ease',
          flexShrink:     0,
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="30" height="30" fill="#fff">
          <path d="M16.003 3.2C9.006 3.2 3.2 9.006 3.2 16.003c0 2.26.59 4.47 1.713 6.42L3.2 28.8l6.53-1.693a12.72 12.72 0 006.273 1.652h.006c6.997 0 12.8-5.803 12.8-12.8C28.809 9.006 23.003 3.2 16.003 3.2zm5.803 17.524c-.317-.16-1.877-.926-2.168-1.03-.29-.104-.5-.16-.71.16-.21.317-.813 1.03-.996 1.24-.183.21-.367.237-.684.08-.317-.157-1.34-.493-2.553-1.573-.943-.84-1.58-1.877-1.764-2.194-.183-.317-.02-.487.138-.644.14-.14.317-.367.476-.55.158-.183.21-.317.316-.527.104-.21.053-.394-.027-.55-.08-.157-.71-1.717-.973-2.35-.257-.616-.516-.533-.71-.543l-.603-.01c-.21 0-.55.08-.837.394-.29.317-1.1 1.073-1.1 2.617 0 1.543 1.127 3.034 1.283 3.244.157.21 2.217 3.386 5.374 4.745.75.323 1.337.516 1.793.66.754.237 1.44.203 1.983.123.604-.09 1.877-.766 2.143-1.507.263-.74.263-1.373.184-1.507-.08-.13-.29-.21-.607-.367z"/>
        </svg>
      </span>

      {/* Pulse ring */}
      <style>{`
        @keyframes wa-pulse {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.7); opacity: 0;   }
        }
        .wa-pulse-ring {
          position: absolute;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(37, 211, 102, 0.4);
          animation: wa-pulse 1.8s ease-out infinite;
          pointer-events: none;
        }
        @media (max-width: 640px) {
          .wa-float-btn span:last-child {
            width: 48px !important;
            height: 48px !important;
          }
        }
      `}</style>
      <span className="wa-pulse-ring" style={{ position: 'absolute', right: '28px', bottom: '28px' }} />
    </a>
  );
}
