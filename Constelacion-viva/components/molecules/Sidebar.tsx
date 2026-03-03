"use client"

import React, { useEffect } from "react"

import {
  Home,
  CreditCard,
  User,
  ImageIcon,
  BookOpen,
  LogOut,

} from "lucide-react"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/atoms/logo"
import { useAuth } from "@/lib/useAuth"

// Sidebar Navigation Items
const navItems = [
    { icon: Home, label: "Inicio", href: "/" },
    { icon: CreditCard, label: "Membresía", tab: "membership" },
    { icon: User, label: "Perfil", tab: "profile" },
    { icon: ImageIcon, label: "Fotos", tab: "photos" },
    { icon: BookOpen, label: "Cursos", tab: "courses" },
  ]

export function Sidebar({
    activeTab,
    setActiveTab,
    className,
  }: {
    activeTab: string
    setActiveTab: (tab: string) => void
    className?: string
  }) {
    const router = useRouter()
    const { user, logout } = useAuth()

    return (
      <aside
        className={`flex h-full w-64 flex-col border-r border-border bg-card ${className}`}
      >
        {/* Logo centrado */}
        <div className="flex items-center justify-center py-8 border-b border-border">
          <Logo />
        </div>
  
        {/* Nav vertical */}
        <nav className="flex flex-col gap-1 p-4">
          {navItems.map((item) => {
            const isActive = item.tab === activeTab
  
            return (
              <button
                key={item.label}
                onClick={() => {
                  if (item.href) {
                    router.push(item.href)
                  } else if (item.tab) {
                    setActiveTab(item.tab)
                  }
                }}
                className={`
                  flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium
                  transition-colors
                  ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                  }
                `}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
  
        {/* Spacer */}
        <div className="flex-1" />
  
        {/* Footer */}
        <div className="border-t border-border p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            disabled
            onClick={logout}

          >
            <LogOut className="mr-3 h-5 w-5" />
            Cerrar sesión
          </Button>
        </div>
      </aside>
    )
  }
  