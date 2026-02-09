import React from 'react';
import {
  LayoutDashboard, Users, Settings, Calendar, ClipboardList, Clock, Package,
  CircleDollarSign, FileText, LogOut, ChevronDown, ChevronRight, Menu, X,
  UserPlus, Truck, Briefcase, Send, History, CheckCircle, PackagePlus,
  PackageMinus, TrendingUp, TrendingDown, BarChart3, FileText as FileTextLucide,
  Skull, Building2, Bird, Warehouse
} from 'lucide-react';

interface IconProps {
  className?: string;
}

export const DashboardIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => <LayoutDashboard className={className} />;
export const UsersIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => <Users className={className} />;
export const SettingsIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => <Settings className={className} />;
export const CalendarIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => <Calendar className={className} />;
export const ClipboardIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => <ClipboardList className={className} />;
export const ClockIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => <Clock className={className} />;
export const BoxIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => <Package className={className} />;
export const CurrencyIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => <CircleDollarSign className={className} />;
export const DocumentIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => <FileText className={className} />;
export const LogoutIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => <LogOut className={className} />;
export const ChevronDownIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => <ChevronDown className={className} />;
export const ChevronRightIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => <ChevronRight className={className} />;
export const MenuIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => <Menu className={className} />;
export const CloseIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => <X className={className} />;
export const UserPlusIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => <UserPlus className={className} />;
export const TruckIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => <Truck className={className} />;
export const BriefcaseIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => <Briefcase className={className} />;
export const PaperAirplaneIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => <Send className={className} />;
export const HistoryIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => <History className={className} />;
export const CheckCircleIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => <CheckCircle className={className} />;
export const InboxInIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => <PackagePlus className={className} />;
export const InboxOutIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => <PackageMinus className={className} />;
export const TrendingUpIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => <TrendingUp className={className} />;
export const TrendingDownIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => <TrendingDown className={className} />;
export const ChartIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => <BarChart3 className={className} />;
export const FileTextIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => <FileTextLucide className={className} />;
export const SkullIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => <Skull className={className} />;
export const OfficeBuildingIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => <Building2 className={className} />;
export const ChickenIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => <Bird className={className} />;
export const WarehouseIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => <Warehouse className={className} />;
