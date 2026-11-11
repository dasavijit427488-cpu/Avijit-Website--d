import type { Metadata } from "next";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const metadata: Metadata = {
  title: "Admin Studio | Avijit Villa CMS",
  description: "Client Admin Dashboard to customize all website content, images, and database records",
};

export default function AdminPage() {
  return <AdminDashboard />;
}

