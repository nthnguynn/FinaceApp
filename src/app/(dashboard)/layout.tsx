import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { PendingTransactionsProvider } from "@/components/bank-sync/pending-transactions-provider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <PendingTransactionsProvider>
      <div className="relative flex min-h-dvh flex-col bg-background text-foreground selection:bg-primary/20">
        <Navbar userName={session.name} />
        {/* pb lớn trên di động để nội dung cuối trang không bị thanh tab + nút "Thêm" nổi che */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-[calc(11rem+env(safe-area-inset-bottom))] pt-2 sm:px-6 lg:pb-12 lg:pt-8">
          {children}
        </main>
      </div>
    </PendingTransactionsProvider>
  );
}
