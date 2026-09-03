"use client";

import { NextIntlClientProvider } from "next-intl";
import { useEffect, type ComponentProps } from "react";

import { timeZone, type Locale } from "@/i18n/config";
import QueryProvider from "@/providers/query-provider";
import { Toaster } from "sonner";
import { AuthProvider } from "@/modules/auth/components/auth-provider";

type IntlMessages = NonNullable<
  ComponentProps<typeof NextIntlClientProvider>["messages"]
>;

type AppProviderProps = Readonly<{
  children: React.ReactNode;
  locale: Locale;
  messages: IntlMessages;
}>;

export default function AppProvider({
  children,
  locale,
  messages,
}: AppProviderProps) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone={timeZone}
    >
      <QueryProvider><AuthProvider>{children}</AuthProvider><Toaster richColors position="top-right" /></QueryProvider>
    </NextIntlClientProvider>
  );
}
