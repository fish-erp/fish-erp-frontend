import { LoginBenefits, LoginForm } from "@/modules/auth/components/login-form";

export default function LoginPage() {
  return <main className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_.95fr]"><LoginBenefits /><section className="flex items-center justify-center bg-background px-5 py-12"><div className="page-enter w-full max-w-md rounded-3xl border bg-white p-6 soft-shadow sm:p-9"><div className="mb-8"><p className="font-semibold text-primary lg:hidden">Fish ERP</p><h1 className="mt-2 text-3xl font-bold">Chào mừng trở lại</h1><p className="mt-2 text-sm text-muted-foreground">Đăng nhập để tiếp tục quản trị hệ thống.</p></div><LoginForm /><p className="mt-7 text-center text-xs leading-5 text-muted-foreground">Chỉ tài khoản quản trị được phép truy cập Fish ERP.</p></div></section></main>;
}
