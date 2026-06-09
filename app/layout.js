import './globals.css';

export const metadata = {
  title: 'WC26 Sentiment Pulse',
  description: 'Real-time social media sentiment tracking for the 2026 FIFA World Cup.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* We apply a dark mode base background directly to the body */}
      <body className="bg-black text-gray-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}