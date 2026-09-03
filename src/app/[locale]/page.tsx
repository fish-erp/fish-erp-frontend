import { redirect } from "@/i18n/navigation";
import { defaultLocale } from "@/i18n/config";

export default function HomePage() { redirect({ href: "/login", locale: defaultLocale }); }
