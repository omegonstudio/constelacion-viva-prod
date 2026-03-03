import type React from "react";
import type { Metadata } from "next";
import { EB_Garamond, Poppins } from "next/font/google";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-eb-garamond",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Constelación Viva - Red de Terapeutas Holísticos",
  description:
    "Red de terapeutas holísticos en Buenos Aires y Córdoba. Conectamos personas con profesionales del bienestar integral.",
  keywords: [
    "terapeutas holísticos",
    "bienestar",
    "terapias alternativas",
    "Buenos Aires",
    "Córdoba",
    "eventos wellness",
  ],
  authors: [{ name: "Constelación Viva" }],
  openGraph: {
    title: "Constelación Viva - Red de Terapeutas Holísticos",
    description: "Conectamos personas con profesionales del bienestar integral",
    url: "https://constelacionviva.com",
    siteName: "Constelación Viva",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Constelación Viva - Red de Terapeutas Holísticos",
    description: "Conectamos personas con profesionales del bienestar integral",
  },
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${ebGaramond.variable} ${poppins.variable} antialiased`}
    >
      <head>
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-TCD2F5W8');
          `}
        </Script>

        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-SVY9ZJ7HLG"
          strategy="afterInteractive"
        />
        <Script id="gtag-config" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-SVY9ZJ7HLG');
          `}
        </Script>
      </head>
      <body>
        {/* Google Tag Manager (noscript) */}
        <noscript
          dangerouslySetInnerHTML={{
            __html:
              '<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TCD2F5W8" height="0" width="0" style="display:none;visibility:hidden"></iframe>',
          }}
        />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
