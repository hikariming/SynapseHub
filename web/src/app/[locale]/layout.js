import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/react"
import { NextIntlClientProvider } from 'next-intl';
import ThemeProvider from '../components/ThemeProvider';
import '../globals.css';
import AuthGuard from '@/components/AuthGuard'

export const metadata = {
  title: {
    default: "SynapseHub - Learn Languages From your Interests",
    zh: "SynapseHub - 兴趣是最好的老师",
    ja: "SynapseHub - 興味から始める語学学習"
  },
  description: {
    default: "Explore and learn from diverse text materials worldwide. Enhance your language skills through interactive reading, translation, and learning experiences.",
    zh: "探索和学习来自世界各地的多样化文本素材。通过互动阅读、翻译和学习体验提升您的语言能力。",
    ja: "世界中の多様なテキスト文本を探索し、学習。インタラクティブな読解、翻訳、学習体験で語学力を向上させましょう。"
  },
  alternates: {
    languages: {
      'en-US': '/en',
      'zh-CN': '/zh',
      'ja-JP': '/jp'
    },
  },
};

export default async function RootLayout({ children, params }) {
  const locale = params.locale;
  
  let messages;
  try {
    messages = (await import(`../../../content/${locale}.json`)).default;
  } catch (error) {
    console.error('Error loading messages:', error);
    messages = (await import(`../../../content/en.json`)).default;
  }

  if (!messages) {
    messages = {};
  }

  return (
    <html lang={locale} className="light">
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <AuthGuard>
              {children}
            </AuthGuard>
            <Analytics />
            <SpeedInsights />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
 