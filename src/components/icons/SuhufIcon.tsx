import React from 'react';

const SuhufIcon: React.FC<{ className?: string; color?: string }> = ({ className = "w-5 h-5", color }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 2L11 13"/>
        <path d="M22 2L15 22L11 13L2 9L22 2Z"/>
    </svg>
);

export default SuhufIcon;