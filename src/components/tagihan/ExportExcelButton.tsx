"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useApp } from "@/context/AppContext";
import { exportCruellFinanceReport } from "@/lib/export-excel";

export function ExportExcelButton() {
  const {
    coupleSpace,
    members,
    periods,
    transactions,
    deposits,
    targets,
    poolBalance,
  } = useApp();

  const handleExport = () => {
    exportCruellFinanceReport({
      coupleSpace,
      members,
      periods,
      transactions,
      deposits,
      targets,
      poolBalance,
    });
  };

  return (
    <Button
      type="button"
      variant="secondary"
      className="gap-2 text-[15px]"
      onClick={handleExport}
      disabled={periods.length === 0}
    >
      <Download className="h-5 w-5" />
      Export Excel
    </Button>
  );
}
