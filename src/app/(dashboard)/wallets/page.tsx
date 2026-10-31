import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getWalletAction } from "@/actions/wallet";
import { WalletCard } from "@/components/wallet/wallet-card";
import { Info } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SectionLabel } from "@/components/ui/section-label";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  description: "Quản lý số dư Ví cá nhân chính",
};

export default async function WalletsPage() {
  const result = await getWalletAction();

  if (!result.success || !result.wallet) {
    redirect("/login");
  }

  const { wallet } = result;

  return (
    <div className="space-y-6">
      <PageHeader title="Ví cá nhân" description="Số dư Ví chính, đơn vị VND." back={{ href: "/profile", label: "Tôi" }} />

      {/* Main Wallet Card */}
      <WalletCard wallet={wallet} />

      <section className="rounded-[1.75rem] border border-border bg-card p-5 text-sm leading-relaxed text-muted-foreground shadow-xs">
        <SectionLabel icon={Info} className="mb-3">
          Cách số dư thay đổi
        </SectionLabel>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Mỗi khoản thu cộng vào, mỗi khoản chi trừ khỏi <strong className="text-foreground">{wallet.name}</strong>.</li>
          <li>Bấm “Cấu hình ví” để đặt lại số dư thực tế, đổi tên hoặc màu ví.</li>
        </ul>
      </section>
    </div>
  );
}
