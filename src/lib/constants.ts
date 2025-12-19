import { NavigationItem, SidebarTab } from "@/types/market";

// Main navigation items for the header - matches Figma design
// Only Customer Insights is currently active; other modules are disabled/greyed out
export const navigationItems: NavigationItem[] = [
  { id: "products", label: "Products", href: "/products", isActive: false, disabled: true },
  { id: "markets", label: "Markets", href: "/markets", isActive: false, disabled: true },
  { id: "pmf", label: "Product-Market Fit", href: "/product-market-fit", isActive: false, disabled: true },
  { id: "radar", label: "Innovation Radar", href: "/innovation-radar", isActive: false, disabled: true },
  { id: "customer-insights", label: "Customer Insights", href: "/customers", isActive: true, disabled: false },
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

