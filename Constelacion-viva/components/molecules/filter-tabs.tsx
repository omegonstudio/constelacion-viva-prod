"use client"

import { cn } from "@/lib/utils"

export type FilterOption = "todos" | "eventos" | "terapeutas"

interface FilterTabsProps {
  activeFilter: FilterOption
  onFilterChange: (filter: FilterOption) => void
}

const filters: { value: FilterOption; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "eventos", label: "Eventos" },
  { value: "terapeutas", label: "Terapeutas" },
]

export function FilterTabs({ activeFilter, onFilterChange }: FilterTabsProps) {
  return (
    <div className="flex flex-wrap gap-3 justify-center mb-12">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={cn(
            "font-sans text-sm font-medium px-6 py-2.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            activeFilter === filter.value
              ? "bg-primary text-white shadow-md"
              : "bg-muted text-foreground hover:bg-secondary",
          )}
          aria-pressed={activeFilter === filter.value}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}
