"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AtSign, Eye, EyeOff, LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/lib/api/errors";
import { useAuth } from "@/modules/auth/components/auth-provider";

const schema = z.object({ identifier: z.string().trim().min(3, "Vui lòng nhập email hoặc số điện thoại"), password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"), remember: z.boolean() });
type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { identifier: "", password: "", remember: true } });
  const submit = form.handleSubmit(async (values) => {
    try { await login(values); toast.success("Đăng nhập thành công"); router.replace("/admin/users"); }
    catch (error) { toast.error(error instanceof ApiError ? error.message : "Không thể đăng nhập"); }
  });
  return <form className="space-y-5" onSubmit={submit} noValidate>
    <div><label className="mb-2 block text-sm font-medium" htmlFor="identifier">Email hoặc số điện thoại</label><div className="relative"><AtSign className="absolute left-3 top-3.5 size-4 text-muted-foreground" /><Input id="identifier" type="text" autoComplete="username" placeholder="admin@example.com hoặc 0901234567" className="pl-10" {...form.register("identifier")} /></div>{form.formState.errors.identifier && <p className="mt-1.5 text-xs text-danger">{form.formState.errors.identifier.message}</p>}</div>
    <div><label className="mb-2 block text-sm font-medium" htmlFor="password">Mật khẩu</label><div className="relative"><LockKeyhole className="absolute left-3 top-3.5 size-4 text-muted-foreground" /><Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" className="px-10" {...form.register("password")} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} className="absolute right-2 top-2 rounded-lg p-2 text-muted-foreground hover:bg-muted">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div>{form.formState.errors.password && <p className="mt-1.5 text-xs text-danger">{form.formState.errors.password.message}</p>}</div>
    <label className="flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" className="size-4 accent-primary" {...form.register("remember")} />Duy trì đăng nhập trên thiết bị này</label>
    <Button size="lg" className="w-full" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? <><LoaderCircle className="animate-spin" />Đang đăng nhập</> : "Đăng nhập"}</Button>
  </form>;
}

export function LoginBenefits() {
  return <div className="relative hidden min-h-screen overflow-hidden bg-primary p-12 text-white lg:flex lg:flex-col lg:justify-between"><div className="absolute -right-20 -top-20 size-80 rounded-full bg-white/10 blur-2xl" /><div className="relative flex items-center gap-3 text-xl font-bold"><span className="grid size-11 place-items-center rounded-2xl bg-white/15"><ShieldCheck /></span>Fish ERP</div><div className="relative max-w-xl"><p className="text-sm font-semibold uppercase tracking-[.24em] text-white/70">Quản lý tập trung</p><h2 className="mt-4 text-4xl font-bold leading-tight">Vận hành kho thức ăn và thuốc cho cá rõ ràng, hiệu quả.</h2><p className="mt-5 max-w-lg leading-7 text-white/75">Nền tảng ERP dành cho đội ngũ quản trị, sẵn sàng mở rộng theo từng nghiệp vụ nuôi trồng thủy sản.</p></div><p className="relative text-sm text-white/60">Fish ERP · Administration Portal</p></div>;
}
