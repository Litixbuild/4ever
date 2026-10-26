import type { Metadata } from "next";
import { AdminTabs } from "@/components/admin-tabs";
import { requireCurator } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireCurator();
  const supabase = await createClient();
  const { count } = await supabase.from("clips").select("id", { count: "exact", head: true }).eq("status", "pending");

  return (
    <div className="container page" style={{ gap: 28 }}>
      <div className="stack" style={{ gap: 14 }}>
        <div className="row-between">
          <div className="stack-sm" style={{ gap: 4 }}>
            <span className="eyebrow">Curator tools</span>
            <h1 className="h1" style={{ fontSize: 32 }}>
              Admin
            </h1>
          </div>
          <span className="pill pill-muted">{viewer.isAdmin ? "Admin" : "Curator"}</span>
        </div>
        <AdminTabs pending={count ?? 0} />
      </div>
      {children}
    </div>
  );
}
