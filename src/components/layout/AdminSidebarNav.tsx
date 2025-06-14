"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar';
import { LayoutDashboard, Users, CalendarDays, CalendarPlus, ListChecks, Settings } from 'lucide-react';

const navItems = [
  {
    label: "Overview",
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    label: 'Management',
    items: [
      { href: '/admin/users', label: 'User Management', icon: Users },
      { href: '/admin/timetables', label: 'Timetable Management', icon: CalendarDays },
      { href: '/admin/events', label: 'Pre-approved Events', icon: CalendarPlus },
    ]
  },
  {
    label: 'Monitoring',
    items: [
      { href: '/admin/requests', label: 'Request Logs', icon: ListChecks },
    ]
  },
  {
    label: 'System',
    items: [
      { href: '/admin/settings', label: 'Settings', icon: Settings, disabled: true },
    ]
  }
];

export default function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      <SidebarMenu className="flex-1">
        {navItems.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            {group.items.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))}
                    tooltip={item.label}
                    disabled={item.disabled}
                    aria-disabled={item.disabled}
                  >
                    <a>
                      <item.icon />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarGroup>
        ))}
      </SidebarMenu>
    </div>
  );
}
