'use client';

import SofaHeader from '@/components/SofaHeader';
import SofaFooter from '@/components/SofaFooter';
import BottomNav from '@/components/BottomNav';
import ComingSoon from '@/components/ComingSoon';

export default function HockeyPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <SofaHeader />
      
      <main className="flex-1">
        <ComingSoon 
          sport={{ 
            name: 'Hoki', 
            icon: '/icons/sports/hockey.png'
          }} 
        />
      </main>

      <SofaFooter />
      <BottomNav />
    </div>
  );
}
