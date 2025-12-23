import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const PunctureIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 18V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M2 12H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M18 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const TowingIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M1 12H4L6 9H10L12 12H23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="6" cy="16" r="2" stroke="currentColor" strokeWidth="2"/>
    <circle cx="18" cy="16" r="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M8 16H16" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 12L14 6H20L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const EngineIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="3" y="8" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M7 8V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M17 8V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 8V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M7 18V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M17 18V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="13" r="2" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export const BatteryIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2" y="7" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M20 10H22V14H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 11V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M5 12H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M14 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const EmergencyIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 2L2 22H22L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 9V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="17" r="1" fill="currentColor"/>
  </svg>
);

export const ACIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="3" y="4" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M7 21H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 18V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M7 9H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M7 12H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const BrakesIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 3V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M21 12H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M7 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const OilIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 2C12 2 6 10 6 14C6 17.3137 8.68629 20 12 20C15.3137 20 18 17.3137 18 14C18 10 12 2 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 16C13.1046 16 14 15.1046 14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const WrenchIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
