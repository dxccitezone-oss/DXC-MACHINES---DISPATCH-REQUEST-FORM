import React, { useState } from 'react';
import {
  BarChart3,
  Boxes,
  Building2,
  ClipboardList,
  Eye,
  FilePlus2,
  LayoutDashboard,
  Menu,
  Settings,
  X,
} from 'lucide-react';
import type { PortalPage } from '../types/gatepass';

interface LayoutProps {
  currentPage: PortalPage;
  hasSelectedGatePass: boolean;
  onNavigate: (page: PortalPage) => void;
  onNewGatePass: () => void;
  children: React.ReactNode;
}

const PAGE_TITLES: Record<PortalPage, string> = {
  dashboard: 'Dashboard',
  'new-gatepass': 'Dispatch Request Form',
  'gatepass-list': 'Gate Pass List',
  'gatepass-details': 'Gate Pass Details',
  reports: 'Reports',
  departments: 'Department Master',
  'stock-master': 'Stock / Item Master',
  settings: 'Settings',
};

export function Layout({
  currentPage,
  hasSelectedGatePass,
  onNavigate,
  onNewGatePass,
  children,
}: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: Array<{
    id: PortalPage;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    hidden?: boolean;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-gatepass', label: 'Dispatch Request Form', icon: FilePlus2 },
    { id: 'gatepass-list', label: 'Gate Pass List', icon: ClipboardList },
    {
      id: 'gatepass-details',
      label: 'Gate Pass Details',
      icon: Eye,
      hidden: !hasSelectedGatePass && currentPage !== 'gatepass-details',
    },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'departments', label: 'Department Master', icon: Building2 },
    { id: 'stock-master', label: 'Stock / Item Master', icon: Boxes },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (id: PortalPage) => {
    setMobileMenuOpen(false);
    if (id === 'new-gatepass') {
      onNewGatePass();
    } else {
      onNavigate(id);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#EAECF3]">
      {/* Top Navigation Bar */}
      <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-6 border-b border-[#C3C9DC] bg-[#FFFFFF] px-4 sm:px-6 h-14">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="lg:hidden rounded border border-[#CBD0E0] p-1.5 text-[#2B3352] hover:bg-[#F3F5FA]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="text-base font-extrabold tracking-tight text-[#2B3352] whitespace-nowrap shrink-0"
          >
            DXC Machines
          </button>
        </div>

        <nav className="hidden xl:flex items-center gap-5 text-xs font-semibold text-[#4A5168]">
          <button
            type="button"
            onClick={() => handleNavClick('dashboard')}
            className={`whitespace-nowrap shrink-0 hover:text-[#1C2130] ${
              currentPage === 'dashboard' ? 'text-[#2B3352] underline underline-offset-4' : ''
            }`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('new-gatepass')}
            className={`whitespace-nowrap shrink-0 hover:text-[#1C2130] ${
              currentPage === 'new-gatepass' ? 'text-[#2B3352] underline underline-offset-4' : ''
            }`}
          >
            Entry Form
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('gatepass-list')}
            className={`whitespace-nowrap shrink-0 hover:text-[#1C2130] ${
              currentPage === 'gatepass-list' ? 'text-[#2B3352] underline underline-offset-4' : ''
            }`}
          >
            Gate Passes
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('reports')}
            className={`whitespace-nowrap shrink-0 hover:text-[#1C2130] ${
              currentPage === 'reports' ? 'text-[#2B3352] underline underline-offset-4' : ''
            }`}
          >
            Reports
          </button>
        </nav>

      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex relative">
        {/* Desktop Sidebar */}
        <aside className="no-print hidden lg:flex lg:flex-col lg:w-60 shrink-0 border-r border-[#C5CBE0] bg-[#F4F5FA] py-4 px-3 justify-between">
          <div className="space-y-1">
            {navItems
              .filter((item) => !item.hidden)
              .map((item) => {
                const Icon = item.icon;
                const active = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-2.5 rounded px-3 py-2 text-xs font-semibold transition-colors text-left ${
                      active
                        ? 'bg-[#2B3352] text-white'
                        : 'text-[#363D54] hover:bg-[#E4E7F2] hover:text-[#1C2130]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
          </div>

          <div className="border-t border-[#D8DCEB] pt-3 px-2 text-[11px] text-[#5A627A]">
            <div className="font-semibold text-[#2E354A]">{PAGE_TITLES[currentPage]}</div>
          </div>
        </aside>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="no-print lg:hidden fixed inset-0 z-40 flex">
            <div
              className="fixed inset-0 bg-black/40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="relative z-10 w-64 bg-[#F4F5FA] border-r border-[#C5CBE0] p-4 space-y-1.5 overflow-y-auto">
              <div className="pb-3 mb-2 border-b border-[#D8DCEB] flex items-center justify-between">
                <span className="text-sm font-extrabold text-[#2B3352]">Navigation</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-[#4A5168]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {navItems
                .filter((item) => !item.hidden)
                .map((item) => {
                  const Icon = item.icon;
                  const active = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center gap-2.5 rounded px-3 py-2.5 text-xs font-semibold text-left ${
                        active
                          ? 'bg-[#2B3352] text-white'
                          : 'text-[#363D54] hover:bg-[#E4E7F2]'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
            </aside>
          </div>
        )}

        {/* Viewport Content */}
        <main className="flex-1 min-w-0 p-3 sm:p-5 lg:p-6">
          <div className="mx-auto max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
