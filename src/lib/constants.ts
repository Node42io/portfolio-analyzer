import { NavigationItem, SidebarTab } from "@/types/market";

// Main navigation items for the header - matches Figma design
export const navigationItems: NavigationItem[] = [
  { id: "products", label: "Products", href: "/products", isActive: false },
  { id: "markets", label: "Markets", href: "/markets", isActive: false },
  { id: "pmf", label: "Product-Market Fit", href: "/product-market-fit", isActive: false },
  { id: "radar", label: "Innovation Radar", href: "/innovation-radar", isActive: false },
  { id: "customer-insights", label: "Customer Insights", href: "/customers", isActive: true },
];

// Sidebar tabs for market detail view
export const marketDetailTabs: SidebarTab[] = [
  { id: "market-type", label: "Market Type Analysis" },
  { id: "market-phase", label: "Market Phase & Innovation areas" },
  { id: "competitors", label: "Competitors & Products" },
  { id: "user-needs", label: "User Needs" },
  { id: "value-chain", label: "Market Value Chain" },
  { id: "regulations", label: "Regulations" },
];

