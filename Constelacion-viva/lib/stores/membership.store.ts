import { apiFetch } from "@/lib/api"
import { create } from "zustand"

interface MembershipState {
  membership: Membership | null
  selectedPlan: number | null
  loading: boolean
  error: string | null

  // actions
  fetchMembership: () => Promise<void>
  selectPlan: (plan: number) => void
  checkout: () => Promise<string | null>
  resetSelection: () => void
}

export const useMembershipStore = create<MembershipState>((set, get) => ({
  membership: null,
  selectedPlan: null,
  loading: false,
  error: null,

  fetchMembership: async () => {
    set({ loading: true, error: null })
    try {
      const data = await apiFetch<Membership>("/therapist/membership")
      set({ membership: data, loading: false })
    } catch (err: any) {
      set({
        loading: false,
        error: err.message || "Error al cargar membresía",
      })
    }
  },

  selectPlan: (plan) => {
    set({ selectedPlan: plan })
  },

  resetSelection: () => {
    set({ selectedPlan: null })
  },

  checkout: async () => {
    const { selectedPlan } = get()
    if (!selectedPlan) return null

    set({ loading: true, error: null })

    try {
      const res = await apiFetch<{ checkout_url: string }>(
        "/therapist/membership/checkout",
        {
          method: "POST",
          body: JSON.stringify({ plan_months: selectedPlan }),
        }
      )

      set({ loading: false })
      return res.checkout_url
    } catch (err: any) {
      set({
        loading: false,
        error: err.message || "Error en checkout",
      })
      return null
    }
  },
}))


// lib/stores/membership.store.ts

export type MembershipStatus = "active" | "pending" | "inactive"

export interface Membership {
  status: MembershipStatus
  plan_months: number | null
  started_at: string | null
  expires_at: string | null
  grace_until: string | null
  warning: boolean
}
