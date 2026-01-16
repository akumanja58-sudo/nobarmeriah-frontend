import { Inter } from 'next/font/google';
import './globals.css';
import '../styles/animations.css';
import BottomNav from '@/components/BottomNav';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'NobarMeriah - Live Score & Prediksi Bola',
  description: 'Platform live score, streaming, dan prediksi pertandingan sepak bola terlengkap di Indonesia. Tebak skor, kumpulkan poin, tukar hadiah menarik!',
  keywords: 'live score, prediksi bola, streaming bola, tebak skor, sepak bola indonesia',
  openGraph: {
    title: 'NobarMeriah - Live Score & Prediksi Bola',
    description: 'Platform live score, streaming, dan prediksi pertandingan sepak bola terlengkap di Indonesia.',
    type: 'website',
    locale: 'id_ID',
    siteName: 'NobarMeriah',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/images/NobarMeriahLogoIcon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
