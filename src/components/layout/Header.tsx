"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NavigationItem } from "@/types/market";

interface HeaderProps {
  navigationItems: NavigationItem[];
  companyName?: string;
  divisionName?: string;
}

// Main navigation header component with logo, nav items, and user profile
export function Header({ 
  navigationItems, 
  companyName = "Company",
  divisionName = "Division"
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 glass-header">
      <div className="max-w-[1512px] mx-auto h-full px-4 lg:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-end gap-1 shrink-0">
          <Logo />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-4 xl:gap-8">
          {navigationItems.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}
        </nav>

        {/* User Profile - Desktop */}
        <div className="hidden md:flex items-center">
          <div className="border-2 border-[rgba(255,255,255,0.1)] px-2 py-1 flex items-center gap-1">
            <span className="text-sm whitespace-nowrap">
              <span className="font-medium text-white">{companyName}</span>
              <span className="text-[#fdff98]">/{divisionName} —</span>
            </span>
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 overflow-hidden shrink-0">
              <div className="w-full h-full bg-gray-700" />
            </div>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-white"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 right-0 bg-[rgba(14,14,15,0.98)] border-b border-[rgba(255,255,255,0.1)]">
          <nav className="flex flex-col p-4 gap-2">
            {navigationItems.map((item) => 
              item.disabled ? (
                <span
                  key={item.id}
                  className="px-3 py-2 text-sm uppercase tracking-wide font-mono text-[var(--text-muted)] opacity-40 cursor-not-allowed"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    px-3 py-2
                    text-sm uppercase tracking-wide font-mono
                    ${item.isActive 
                      ? "bg-[#fdff98] text-[#141416]" 
                      : "text-white"
                    }
                  `}
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>
          {/* Mobile User Info */}
          <div className="px-4 pb-4 border-t border-[rgba(255,255,255,0.1)] pt-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-800" />
              <span className="text-sm text-white">
                {companyName}/{divisionName}
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// Logo component with node42 branding
function Logo() {
  return (
    <div className="flex items-center gap-1.5">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#fdff98" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 17L12 22L22 17" stroke="#fdff98" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 12L12 17L22 12" stroke="#fdff98" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="text-lg font-semibold text-white tracking-tight">node42</span>
    </div>
  );
}

// Individual navigation item with icon support
function NavItem({ item }: { item: NavigationItem }) {
  // Disabled items are greyed out and not clickable
  if (item.disabled) {
    return (
      <span
        className="
          flex items-center gap-1
          px-2 py-1
          text-xs xl:text-sm uppercase tracking-wide font-mono
          whitespace-nowrap
          text-[var(--text-muted)] opacity-40 cursor-not-allowed
        "
        title="Coming soon"
      >
        {item.label}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      className={`
        flex items-center gap-1
        px-2 py-1
        text-xs xl:text-sm uppercase tracking-wide font-mono
        transition-colors duration-200
        whitespace-nowrap
        ${item.isActive 
          ? "bg-[var(--accent-primary)] text-[var(--text-dark)] rounded-full px-2 py-0.5" 
          : "text-[var(--text-primary)] hover:text-[var(--accent-primary)]"
        }
      `}
    >
      {item.label}
    </Link>
  );
}
