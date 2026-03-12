import { Inter } from 'next/font/google';
import './globals.css';
import '../styles/animations.css';
import BottomNav from '@/components/BottomNav';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ScoreMeriah.com – Live Score, Jadwal Bola, Hasil Pertandingan & Klasemen Liga',
  description: 'Pantau live score bola terbaru di ScoreMeriah.com. Dapatkan update hasil pertandingan, jadwal bola hari ini, klasemen liga, dan statistik pertandingan secara real-time',
  keywords: 'score meriah, live score, prediksi bola, streaming bola, tebak skor, sepak bola indonesia',
  openGraph: {
    title: 'ScoreMeriah.com – Live Score, Jadwal Bola, Hasil Pertandingan & Klasemen Liga',
    description: 'Platform live score, streaming, dan prediksi pertandingan sepak bola terlengkap di Indonesia.',
    type: 'website',
    locale: 'id_ID',
    siteName: 'ScoreMeriah',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/images/ScoreMeriahLogo-Icon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
