"use client";

import { useState } from "react";
import { WalletData } from "@/actions/wallet";
import { EditWalletDialog } from "@/components/wallet/edit-wallet-dialog";
import {
  Wallet,
  CreditCard,
  PiggyBank,
  Coins,
  Landmark,
  Banknote,
  Vault,
  Settings2,
} from "lucide-react";
import { formatVND } from "@/lib/utils";

interface WalletCardProps {
  wallet: WalletData;
  onRefresh?: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Wallet,
  CreditCard,
  PiggyBank,
  Coins,
  Landmark,
  Banknote,
  Vault,
};

export function WalletCard({ wallet, onRefresh }: WalletCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const IconComponent = ICON_MAP[wallet.icon] || Wallet;

  const formattedBalance = formatVND(wallet.balance || 0);

  return (
    <>
      <section
        aria-label={wallet.name}
        className="relative overflow-hidden rounded-[1.75rem] bg-hero p-5 text-hero-foreground shadow-lg sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex size-12 items-center justify-center rounded-2xl text-white shadow-md"
              style={{ backgroundColor: wallet.color }}
            >
              <IconComponent className="size-6" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] opacity-75">Ví chính</p>
              <h2 className="text-xl font-extrabold tracking-tight">{wallet.name}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsEditDialogOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-white/12 px-4 text-sm font-semibold hover:bg-white/20 cursor-pointer"
          >
            <Settings2 className="size-4" aria-hidden /> Cấu hình ví
          </button>
        </div>

        <p className="mt-8 text-xs font-bold uppercase tracking-[0.12em] opacity-75">Số dư hiện tại</p>
        <p className="mt-1 text-4xl font-extrabold tracking-tight sm:text-5xl">{formattedBalance}</p>
      </section>

      <EditWalletDialog
        wallet={wallet}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </>
  );
}
