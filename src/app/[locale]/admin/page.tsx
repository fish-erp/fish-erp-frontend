import { redirect } from "@/i18n/navigation";
import { defaultLocale, isLocale } from "@/i18n/config";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({
    href: "/admin/users",
    locale: isLocale(locale) ? locale : defaultLocale,
  });
}
