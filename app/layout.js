import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata = {
  title: 'WC26 Sentiment Pulse',
  description: 'Real-time social media sentiment tracking for the 2026 FIFA World Cup.',
};

export default function RootLayout({ children }) {
  // Suppress hydration warning on HTML is required for next-themes
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50 text-gray-900 dark:bg-black dark:text-gray-100 min-h-screen antialiased transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}