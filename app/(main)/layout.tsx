import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <main className="flex-1 w-full max-w-lg mx-auto bg-white dark:bg-gray-900 shadow-xl border-x border-gray-100 dark:border-gray-800 min-h-screen pb-24 relative">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
