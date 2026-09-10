"use client";

import { CalendarRange, Download, FileSpreadsheet, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Page } from "@/components/ui/page";
import { reportsService } from "../services/reports.service";

function toInputDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ReportsPage() {
  const today = new Date();
  const [from, setFrom] = useState(toInputDate(today));
  const [to, setTo] = useState(toInputDate(today));
  const [includePrice, setIncludePrice] = useState(false);
  const [downloading, setDownloading] = useState<"inventory" | "sales" | null>(null);

  const applyPreset = (preset: "today" | "week" | "month" | "year") => {
    const start = new Date(today);
    if (preset === "week") {
      const weekday = start.getDay() || 7;
      start.setDate(start.getDate() - weekday + 1);
    }
    if (preset === "month") start.setDate(1);
    if (preset === "year") { start.setMonth(0); start.setDate(1); }
    setFrom(toInputDate(start));
    setTo(toInputDate(today));
  };

  const download = async (kind: "inventory" | "sales") => {
    if (!from || !to || from > to) {
      toast.error("Khoảng ngày báo cáo không hợp lệ");
      return;
    }
    setDownloading(kind);
    try {
      await reportsService[kind]({ from, to, includePrice });
      toast.success("Đã tạo file báo cáo");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải báo cáo");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <Page title="Báo cáo và xuất Excel" description="Theo dõi nhập – xuất – tồn và bán hàng theo khoảng ngày.">
      <Card className="p-4 sm:p-6 shadow-xs rounded-2xl">
        <div className="flex items-center gap-2">
          <CalendarRange className="size-5 text-primary" />
          <h2 className="font-bold text-base">Khoảng thời gian báo cáo</h2>
        </div>

        {/* Quick Date Presets */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => applyPreset("today")}>
            Hôm nay
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => applyPreset("week")}>
            Tuần này
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => applyPreset("month")}>
            Tháng này
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => applyPreset("year")}>
            Năm nay
          </Button>
        </div>

        {/* Date pickers */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Từ ngày</span>
            <Input
              type="date"
              value={from}
              max={to}
              onChange={(event) => setFrom(event.target.value)}
              className="h-10 rounded-xl"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Đến ngày</span>
            <Input
              type="date"
              value={to}
              min={from}
              onChange={(event) => setTo(event.target.value)}
              className="h-10 rounded-xl"
            />
          </label>
        </div>

        {/* Checkbox option */}
        <label className="mt-4 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5 transition active:scale-[0.99]">
          <input
            type="checkbox"
            checked={includePrice}
            onChange={(event) => setIncludePrice(event.target.checked)}
            className="mt-0.5 size-4 rounded accent-primary"
          />
          <div>
            <strong className="block text-sm font-semibold">Hiển thị giá trong file Excel</strong>
            <span className="text-xs text-muted-foreground">
              Mặc định tắt để có thể gửi file số lượng cho người khác mà không để lộ giá nhập/bán.
            </span>
          </div>
        </label>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5 rounded-2xl shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileSpreadsheet className="size-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Nhập – xuất – tồn</h2>
              <p className="text-xs text-muted-foreground">Tồn đầu kỳ, nhập/xuất và tồn cuối kỳ</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Gồm sheet tổng hợp tồn kho và sheet chi tiết biến động theo ngày.
          </p>
          <Button
            className="mt-4 w-full h-11 rounded-xl gap-2 font-semibold"
            disabled={Boolean(downloading)}
            onClick={() => void download("inventory")}
          >
            {downloading === "inventory" ? (
              <LoaderCircle className="animate-spin size-4" />
            ) : (
              <Download className="size-4" />
            )}
            Tải file Nhập – Xuất – Tồn
          </Button>
        </Card>

        <Card className="p-5 rounded-2xl shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <FileSpreadsheet className="size-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Báo cáo bán hàng</h2>
              <p className="text-xs text-muted-foreground">Doanh thu và danh sách mặt hàng đã bán</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Danh sách chi tiết từng sản phẩm trong các hóa đơn đã hoàn thành.
          </p>
          <Button
            className="mt-4 w-full h-11 rounded-xl gap-2 font-semibold"
            disabled={Boolean(downloading)}
            onClick={() => void download("sales")}
          >
            {downloading === "sales" ? (
              <LoaderCircle className="animate-spin size-4" />
            ) : (
              <Download className="size-4" />
            )}
            Tải file Bán hàng
          </Button>
        </Card>
      </div>
    </Page>
  );
}
