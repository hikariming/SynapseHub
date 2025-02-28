import { notFound } from "next/navigation";
import { getRequestConfig } from 'next-intl/server';

const locales: string[] = ['en', 'jp', 'zh'];

export const metadata = {
  title: {
    en: "SynapseHub - Learn From your Interests",
    zh: "SynapseHub - 兴趣是最好的老师",
    jp: "SynapseHub - 興味から始める語学学習"
  },
  description: {
    en: "Discover and learn from global text materials. Enhance your language skills through reading, translation and interactive learning.",
    zh: "发现和学习全球文本素材。通过阅读、翻译和互动学习提升您的语言能力。",
    jp: "グローバルなテキスト文本を発見し、学習。読解、翻訳、インタラクティブな学習で語学力を向上させましょう。"
  },
  alternates: {
    languages: {
      'en': '/en',
      'zh': '/zh',
      'jp': '/jp'
    },
  },
};

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as any)) notFound();

  return {
    messages: (await import(`../content/${locale}.json`)).default,
    metadata: metadata[locale as keyof typeof metadata] || metadata.en
  };
});

export function getAlternateLinks(currentPath: string) {
  return locales.map(locale => ({
    hrefLang: locale,
    href: `/${locale}${currentPath}`
  }));
}