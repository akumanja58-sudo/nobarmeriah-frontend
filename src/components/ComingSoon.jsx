'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell } from 'lucide-react';

export default function ComingSoon({ sport }) {
  const router = useRouter();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="w-24 h-24 mx-auto mb-6 bg-white rounded-full shadow-lg flex items-center justify-center">
          {sport?.icon?.startsWith('/') ? (
            <img 
              src={sport.icon} 
              alt={sport.name} 
              className="w-14 h-14 object-contain opacity-50"
            />
          ) : (
            <span className="text-5xl opacity-50">{sport?.icon || '🚧'}</span>
          )}
        </div>

        {/* Coming Soon Text */}
        <h1 className="text-4xl font-bold text-gray-800 font-condensed mb-3 tracking-wide">
          COMING SOON
        </h1>
        
        <p className="text-gray-500 font-condensed text-lg mb-2">
          {sport?.name || 'Olahraga ini'} akan segera hadir!
        </p>
        
        <p className="text-gray-400 text-sm mb-8">
          Kami sedang bekerja keras untuk menghadirkan fitur ini. Pantau terus NobarMeriah!
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.push('/')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-full transition-colors font-condensed"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </button>
          
          <button
            onClick={() => alert('Fitur notifikasi akan segera hadir!')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-full border border-gray-200 transition-colors font-condensed"
          >
            <Bell className="w-4 h-4" />
            Beritahu Saya
          </button>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="mt-12 flex items-center gap-2 text-gray-300">
        <div className="w-12 h-px bg-gray-300"></div>
        <span className="text-sm font-condensed">NobarMeriah</span>
        <div className="w-12 h-px bg-gray-300"></div>
      </div>
    </div>
  );
}
