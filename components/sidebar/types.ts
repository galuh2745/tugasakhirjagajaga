export interface MenuItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
  children?: MenuItem[];
  isDisabled?: boolean;
  badge?: string;
}

export interface SidebarProps {
  className?: string;
}
