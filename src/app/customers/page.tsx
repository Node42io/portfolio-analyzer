"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/layout";
import { Card, SeverityBadge, SearchInput, SortButton, SortedByPill } from "@/components/ui";
import { navigationItems } from "@/lib/constants";
import { Customer } from "@/types/customer";
import { Loader2, Plus, Calendar, TrendingUp, BookOpen, CheckSquare, Info } from "lucide-react";

// Customers list page - shows all customers with insights summary
export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"insights" | "recent" | "az">("insights");

  // Fetch customers from API
  useEffect(() => {
    async function fetchCustomers() {
      try {
        const response = await fetch("/api/customers");
        if (response.ok) {
          const data = await response.json();
          setCustomers(data.customers || []);
        }
      } catch (err) {
        console.error("Error fetching customers:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCustomers();
  }, []);

  // Filter and sort customers
  const filteredCustomers = customers
    .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "insights") {
        const levelOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        return levelOrder[a.insightLevel] - levelOrder[b.insightLevel];
      }
      if (sortBy === "az") return a.name.localeCompare(b.name);
      return 0;
    });

  return (
    <div className="min-h-screen bg-[var(--surface-page)]">
      {/* Header */}
      <Header
        navigationItems={navigationItems.map((item) => ({
          ...item,
          isActive: item.id === "customer-insights",
        }))}
        companyName="Waldner"
        divisionName=""
      />

      {/* Main Content */}
      <main className="pt-24 px-6 max-w-[1512px] mx-auto pb-16">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-medium text-white mb-2">Your Customers</h1>
          <div className="flex items-center gap-2">
            <span className="text-base text-[var(--text-secondary)]">Total Customers</span>
            <span className="px-2 py-0.5 bg-[var(--secondary-400)] rounded-full text-sm text-[var(--accent-primary)]">
              {customers.length}
            </span>
          </div>
        </div>

        {/* Search and Sort Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search Customer..."
              className="w-[350px]"
            />
            <SortButton 
              label="Insights" 
              onClick={() => setSortBy("insights")} 
            />
            <SortButton 
              label="Recent" 
              onClick={() => setSortBy("recent")} 
            />
            <SortButton 
              label="A-Z" 
              onClick={() => setSortBy("az")} 
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-3 bg-[var(--text-primary)] text-[var(--text-dark)] rounded-[var(--radius-md)] font-medium hover:opacity-90 transition-opacity">
            <Plus className="w-5 h-5" />
            Add Customer
          </button>
        </div>

        {/* Sort Indicator */}
        <SortedByPill 
          sortBy={sortBy === "insights" ? "Insights" : sortBy === "recent" ? "Recent" : "A-Z"} 
          direction={sortBy === "insights" ? "(High to Low)" : "(Newest to older)"} 
          className="mb-6"
        />

        {/* Customers List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-[var(--accent-primary)] animate-spin" />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <Card className="p-8 text-center rounded-lg">
            <p className="text-[var(--text-muted)]">
              No customers found. Add your first customer to get started.
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredCustomers.map((customer) => (
              <CustomerCard key={customer.id} customer={customer} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// Customer card component with insights summary
function CustomerCard({ customer }: { customer: Customer }) {
  return (
    <Link href={`/customers/${customer.id}`}>
      <Card className="p-5 rounded-lg hover:border-[rgba(255,255,255,0.3)] transition-colors cursor-pointer">
        {/* Header row with badge and customer name */}
        <div className="flex items-center gap-3 mb-4">
          <SeverityBadge severity={customer.insightLevel} />
          <div className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
            <span className="font-mono uppercase">Insights Level</span>
            <Info className="w-4 h-4" />
          </div>
        </div>

        <h2 className="text-2xl font-medium text-white mb-4">Customer {customer.name}</h2>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4">
          {/* Updates Section */}
          <div className="p-4 bg-[var(--surface-page)] rounded-lg">
            <p className="text-label text-[var(--text-muted)] mb-4 uppercase">Updates</p>
            <div className="flex gap-8">
              <div>
                <div className="flex items-center gap-2 text-sm text-[var(--text-primary)] mb-2">
                  <Calendar className="w-4 h-4" />
                  Last update
                </div>
                <p className="text-xl font-medium text-white">{customer.lastUpdate}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-[var(--text-primary)] mb-2">
                  <TrendingUp className="w-4 h-4" />
                  Total Updates
                </div>
                <p className="text-xl font-medium text-white">{customer.totalUpdates}</p>
              </div>
            </div>
          </div>

          {/* Insights Section */}
          <div className="p-4 bg-[var(--surface-page)] rounded-lg col-span-2">
            <p className="text-label text-[var(--text-muted)] mb-4 uppercase">
              Insights ({customer.insightCount})
            </p>
            <div className="flex gap-8">
              <div className="flex-1 border-r border-[var(--border-default)] pr-4">
                <div className="flex items-center gap-2 text-sm text-[var(--text-primary)] mb-2">
                  <BookOpen className="w-4 h-4" />
                  New Learnings
                </div>
                <p className="text-xl font-medium text-[var(--accent-primary)]">{customer.newLearnings}</p>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-[var(--text-primary)] mb-2">
                  <CheckSquare className="w-4 h-4" />
                  Confirmed Assumptions
                </div>
                <p className="text-xl font-medium text-[var(--accent-primary)]">{customer.confirmedAssumptions}</p>
              </div>
            </div>
          </div>

          {/* Latest Insight Section */}
          <div className="p-4 bg-[var(--surface-page)] rounded-lg">
            <p className="text-label text-[var(--text-muted)] mb-4 uppercase">Latest Insight</p>
            <p className="text-sm text-[var(--text-primary)] line-clamp-3">{customer.latestInsight}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

