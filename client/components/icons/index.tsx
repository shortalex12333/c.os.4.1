/**
 * Local Icon System Exports
 * Centralized exports for LOCAL UX icon system
 */

import React from 'react';

export { LocalIcon, preloadCriticalIcons } from './LocalIcon';
export type { IconProps } from './LocalIcon';

// Re-export commonly used icons as components for easier migration
import { LocalIcon } from './LocalIcon';

// Navigation icons
export const Menu = (props: any) => <LocalIcon name="menu" {...props} />;
export const X = (props: any) => <LocalIcon name="x" {...props} />;
export const ChevronDown = (props: any) => <LocalIcon name="chevron-down" {...props} />;
export const ChevronUp = (props: any) => <LocalIcon name="chevron-up" {...props} />;
export const ChevronLeft = (props: any) => <LocalIcon name="chevron-left" {...props} />;
export const ChevronRight = (props: any) => <LocalIcon name="chevron-right" {...props} />;
export const ArrowRight = (props: any) => <LocalIcon name="arrow-right" {...props} />;

// User & Account icons
export const User = (props: any) => <LocalIcon name="user" {...props} />;
export const Users = (props: any) => <LocalIcon name="users" {...props} />;
export const Eye = (props: any) => <LocalIcon name="eye" {...props} />;
export const EyeOff = (props: any) => <LocalIcon name="eye-off" {...props} />;

// Business & Features icons
export const Zap = (props: any) => <LocalIcon name="zap" {...props} />;
export const Target = (props: any) => <LocalIcon name="target" {...props} />;
export const Star = (props: any) => <LocalIcon name="star" {...props} />;
export const Trophy = (props: any) => <LocalIcon name="trophy" {...props} />;
export const Compass = (props: any) => <LocalIcon name="compass" {...props} />;
export const Crown = (props: any) => <LocalIcon name="crown" {...props} />;

// Security & Safety icons
export const Shield = (props: any) => <LocalIcon name="shield" {...props} />;
export const Lock = (props: any) => <LocalIcon name="lock" {...props} />;
export const Key = (props: any) => <LocalIcon name="key" {...props} />;
export const AlertTriangle = (props: any) => <LocalIcon name="alert-triangle" {...props} />;

// Technology & Data icons
export const Database = (props: any) => <LocalIcon name="database" {...props} />;
export const Server = (props: any) => <LocalIcon name="server" {...props} />;
export const HardDrive = (props: any) => <LocalIcon name="hard-drive" {...props} />;
export const Wifi = (props: any) => <LocalIcon name="wifi" {...props} />;
export const WifiOff = (props: any) => <LocalIcon name="wifi-off" {...props} />;
export const Network = (props: any) => <LocalIcon name="network" {...props} />;
export const Router = (props: any) => <LocalIcon name="router" {...props} />;

// Communication & Content icons
export const Phone = (props: any) => <LocalIcon name="phone" {...props} />;
export const Calendar = (props: any) => <LocalIcon name="calendar" {...props} />;
export const FileText = (props: any) => <LocalIcon name="file-text" {...props} />;
export const Search = (props: any) => <LocalIcon name="search" {...props} />;

// Status & Actions icons
export const Check = (props: any) => <LocalIcon name="check" {...props} />;
export const CheckCircle = (props: any) => <LocalIcon name="check-circle" {...props} />;
export const Clock = (props: any) => <LocalIcon name="clock" {...props} />;
export const TrendingUp = (props: any) => <LocalIcon name="trending-up" {...props} />;
export const BarChart3 = (props: any) => <LocalIcon name="bar-chart-3" {...props} />;
export const Award = (props: any) => <LocalIcon name="award" {...props} />;

// Navigation & Devices icons
export const Globe = (props: any) => <LocalIcon name="globe" {...props} />;
export const Smartphone = (props: any) => <LocalIcon name="smartphone" {...props} />;
export const Monitor = (props: any) => <LocalIcon name="monitor" {...props} />;
export const Cloud = (props: any) => <LocalIcon name="cloud" {...props} />;

// Utility icons
export const Loader2 = (props: any) => <LocalIcon name="loader-2" {...props} />;
export const Wind = (props: any) => <LocalIcon name="wind" {...props} />;
export const Settings = (props: any) => <LocalIcon name="settings" {...props} />;