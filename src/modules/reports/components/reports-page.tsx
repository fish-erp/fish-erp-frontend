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

  return <Page title="Báo cáo và xuất Excel" description="Theo dõi nhập – xuất – tồn và bán hàng theo khoảng ngày.">
    <Card className="p-5">
      <div className="flex items-center gap-2"><CalendarRange className="size-5 text-primary" /><h2 className="font-bold">Khoảng thời gian</h2></div>
      <div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => applyPreset("today")}>Hôm nay</Button><Button variant="outline" size="sm" onClick={() => applyPreset("week")}>Tuần này</Button><Button variant="outline" size="sm" onClick={() => applyPreset("month")}>Tháng này</Button><Button variant="outline" size="sm" onClick={() => applyPreset("year")}>Năm nay</Button></div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2"><label><span className="mb-1 block text-sm font-medium">Từ ngày</span><Input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} /></label><label><span className="mb-1 block text-sm font-medium">Đến ngày</span><Input type="date" value={to} min={from} onChange={(event) => setTo(event.target.value)} /></label></div>
      <label className="mt-5 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4"><input type="checkbox" checked={includePrice} onChange={(event) => setIncludePrice(event.target.checked)} className="mt-0.5 size-4 accent-primary" /><span><strong className="block text-sm">Hiển thị giá trong file</strong><span className="text-xs text-muted-foreground">Mặc định tắt để có thể gửi file số lượng cho người khác mà không lộ giá.</span></span></label>
    </Card>
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="p-5"><FileSpreadsheet className="size-8 text-primary" /><h2 className="mt-3 text-lg font-bold">Nhập – xuất – tồn</h2><p className="mt-1 text-sm text-muted-foreground">Gồm sheet tổng hợp tồn đầu/cuối kỳ và sheet chi tiết biến động.</p><Button className="mt-5 w-full" disabled={Boolean(downloading)} onClick={() => void download("inventory")}>{downloading === "inventory" ? <LoaderCircle className="animate-spin" /> : <Download className="size-4" />}Tải file nhập – xuất – tồn</Button></Card>
      <Card className="p-5"><FileSpreadsheet className="size-8 text-primary" /><h2 className="mt-3 text-lg font-bold">Bán hàng</h2><p className="mt-1 text-sm text-muted-foreground">Danh sách từng sản phẩm trong các hóa đơn đã hoàn thành.</p><Button className="mt-5 w-full" disabled={Boolean(downloading)} onClick={() => void download("sales")}>{downloading === "sales" ? <LoaderCircle className="animate-spin" /> : <Download className="size-4" />}Tải file bán hàng</Button></Card>
    </div>
  </Page>;
}
