import React from 'react';

const TelegramIcon: React.FC<{ className?: string; color?: string }> = ({ className = "w-5 h-5", color }) => (
    <svg className={className} viewBox="0 0 24 24" fill={color || "currentColor"} xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.69 6.5l-1.97 9.2c-.15.7-.58.88-1.18.55l-3.05-2.25-1.47 1.42c-.16.16-.3.3-.55.3l.2-3.13 5.4-4.87c.24-.22-.05-.34-.38-.13l-6.65 4.18-3.1-.97c-.68-.22-.7- .7.14-1.03l11.17-4.3c.58-.22.95.14.78.85z"/>
    </svg>
);

export default TelegramIcon;
