'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MenuItem } from './types';
import { ChevronDownIcon, ChevronRightIcon } from './icons';

interface SidebarMenuItemProps {
  item: MenuItem;
  isExpanded: boolean;
  onToggle: () => void;
  isCollapsed?: boolean;
}

const SidebarMenuItem: React.FC<SidebarMenuItemProps> = ({ item, isExpanded, onToggle, isCollapsed = false }) => {
  const pathname = usePathname();
  const hasChildren = item.children && item.children.length > 0;
  
  // Check if current path matches this item or any of its children
  const isActive = pathname === item.href;
  const isChildActive = item.children?.some(child => pathname === child.href) || false;
  const shouldHighlight = isActive || isChildActive;

  // Base styles
  const baseItemStyles = `
    flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} w-full ${isCollapsed ? 'px-2' : 'px-4'} py-3 rounded-lg
    transition-all duration-200 ease-in-out
    text-sm font-medium
  `;

  // Active/inactive styles
  const activeStyles = `bg-blue-50 text-blue-700 ${isCollapsed ? '' : 'border-l-4 border-blue-600'}`;
  const inactiveStyles = 'text-gray-700 hover:bg-gray-100 hover:text-gray-900';
  const disabledStyles = 'text-gray-400 cursor-not-allowed opacity-60';

  // Collapsed mode - show only icons with tooltip
  if (isCollapsed) {
    const content = (
      <div
        className={`${baseItemStyles} ${item.isDisabled ? disabledStyles : (shouldHighlight ? activeStyles : inactiveStyles)} relative`}
        title={item.label}
      >
        {item.icon && <span className="shrink-0">{item.icon}</span>}
        {item.badge && /^\d+$/.test(item.badge) && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
            {item.badge}
          </span>
        )}
      </div>
    );

    if (item.isDisabled) {
      return <div className="mb-1">{content}</div>;
    }

    if (item.href) {
      return (
        <div className="mb-1 relative">
          <Link href={item.href}>{content}</Link>
        </div>
      );
    }

    return (
      <div className="mb-1">
        <button onClick={onToggle} className="w-full">{content}</button>
      </div>
    );
  }

  // Render disabled item (Coming Soon)
  if (item.isDisabled) {
    return (
      <div className="mb-1">
        <div
          className={`${baseItemStyles} ${disabledStyles}`}
          title="Coming Soon"
        >
          <div className="flex items-center gap-3">
            {item.icon && <span className="shrink-0">{item.icon}</span>}
            <span>{item.label}</span>
          </div>
          {item.badge && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
              {item.badge}
            </span>
          )}
          {hasChildren && (
            <ChevronRightIcon className="w-4 h-4 ml-2 text-gray-400" />
          )}
        </div>
        
        {/* Disabled children */}
        {hasChildren && isExpanded && (
          <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-4">
            {item.children?.map((child) => (
              <div
                key={child.id}
                className={`${baseItemStyles} ${disabledStyles} py-2`}
              >
                <div className="flex items-center gap-3">
                  {child.icon && <span className="shrink-0">{child.icon}</span>}
                  <span className="text-sm">{child.label}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Render item with children (expandable)
  if (hasChildren) {
    return (
      <div className="mb-1">
        <button
          onClick={onToggle}
          className={`${baseItemStyles} ${shouldHighlight ? activeStyles : inactiveStyles}`}
        >
          <div className="flex items-center gap-3">
            {item.icon && <span className="shrink-0">{item.icon}</span>}
            <span>{item.label}</span>
          </div>
          <div className="flex items-center gap-2">
            {item.badge && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                {item.badge}
              </span>
            )}
            {isExpanded ? (
              <ChevronDownIcon className="w-4 h-4 transition-transform" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 transition-transform" />
            )}
          </div>
        </button>
        
        {/* Children items */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-4">
            {item.children?.map((child) => (
              <SidebarChildItem key={child.id} item={child} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Render single item (link)
  return (
    <div className="mb-1">
      <Link
        href={item.href || '#'}
        className={`${baseItemStyles} ${isActive ? activeStyles : inactiveStyles}`}
      >
        <div className="flex items-center gap-3">
          {item.icon && <span className="shrink-0">{item.icon}</span>}
          <span>{item.label}</span>
        </div>
        {item.badge && (
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
            /^\d+$/.test(item.badge) 
              ? 'bg-red-500 text-white min-w-5 text-center' 
              : 'bg-amber-100 text-amber-700'
          }`}>
            {item.badge}
          </span>
        )}
      </Link>
    </div>
  );
};

interface SidebarChildItemProps {
  item: MenuItem;
}

const SidebarChildItem: React.FC<SidebarChildItemProps> = ({ item }) => {
  const pathname = usePathname();
  const isActive = pathname === item.href;

  const baseStyles = `
    flex items-center gap-3 w-full px-4 py-2 rounded-lg
    transition-all duration-200 ease-in-out
    text-sm
  `;

  const activeStyles = 'bg-blue-50 text-blue-700 font-medium';
  const inactiveStyles = 'text-gray-600 hover:bg-gray-100 hover:text-gray-900';
  const disabledStyles = 'text-gray-400 cursor-not-allowed opacity-60';

  if (item.isDisabled) {
    return (
      <div className={`${baseStyles} ${disabledStyles}`}>
        {item.icon && <span className="shrink-0">{item.icon}</span>}
        <span>{item.label}</span>
        {item.badge && (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700 ml-auto">
            {item.badge}
          </span>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href || '#'}
      className={`${baseStyles} ${isActive ? activeStyles : inactiveStyles}`}
    >
      {item.icon && <span className="shrink-0">{item.icon}</span>}
      <span>{item.label}</span>
      {item.badge && (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700 ml-auto">
          {item.badge}
        </span>
      )}
    </Link>
  );
};

interface SidebarMenuProps {
  items: MenuItem[];
  isCollapsed?: boolean;
}

export const SidebarMenu: React.FC<SidebarMenuProps> = ({ items, isCollapsed = false }) => {
  const pathname = usePathname();
  
  // Auto-expand menus that contain the current active route
  const getInitialExpandedState = () => {
    const expanded: Record<string, boolean> = {};
    items.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some(child => pathname === child.href);
        expanded[item.id] = hasActiveChild;
      }
    });
    return expanded;
  };

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(getInitialExpandedState);

  const toggleItem = (itemId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  return (
    <nav className="space-y-1">
      {items.map((item) => (
        <SidebarMenuItem
          key={item.id}
          item={item}
          isExpanded={expandedItems[item.id] || false}
          onToggle={() => toggleItem(item.id)}
          isCollapsed={isCollapsed}
        />
      ))}
    </nav>
  );
};

export default SidebarMenu;
