'use client';

import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

export default function SofaFooter() {
  const footerLinks = {
    'Sepak Bola': [
      'UEFA Champions League',
      'Premier League',
      'Serie A',
      'LaLiga',
      'Bundesliga',
      'FIFA World Cup',
      'Peringkat FIFA',
      'Peringkat UEFA',
    ],
    'Bola Basket': [
      'NBA',
      'Euroleague',
      'Stoiximan GBL',
      'Liga ACB',
      'Lega A Basket',
      'Turkish Basketball Super League',
    ],
    'Tenis': [
      'Australian Open',
      'Brisbane',
      'Peringkat ATP',
      'Peringkat WTA',
      'Davis Cup',
      'Roland Garros',
      'Wimbledon',
      'ATP',
    ],
    'Trending': [
      'NFL',
      'NHL',
      'UFC',
      'MLB',
      'NPL',
      'EHF Champions League',
      'ESEA',
    ],
    'Skor sepak bola': [
      'Real Madrid - Levante',
      'Albacete - Real Madrid',
      'R. Racing Club - Barcelona',
      'Man Utd - Man City',
      'Liverpool - Burnley',
      'Chelsea - Arsenal',
      'Forest - Arsenal',
      'Newcastle - Man City',
    ],
    'Skor bola basket': [
      'Lakers - Hawks',
      'Kings - Lakers',
      'Lakers - Hornets',
      'Warriors - Knicks',
      'Warriors - Hawks',
      'Warriors - Trail Blazers',
      'Pacers - Celtics',
      'Nuggets - Bucks',
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Youtube, href: '#', label: 'TikTok' },
  ];

  const bottomLinks = [
    'Kebijakan Privasi',
    'Kebijakan Cookie',
    'Kebijakan Aksesibilitas',
    'Syarat & Ketentuan',
    'GDPR & Jurnalisme',
    'Impresum',
  ];

  const navLinks = ['IKLAN', 'KONTAK', 'TORNEO BY NOBARMERIAH', 'NOBARMERIAH NEWS'];

  return (
    <>
      {/* ============================================================ */}
      {/* DESKTOP FOOTER - Hijau */}
      {/* ============================================================ */}
      <footer className="hidden lg:block bg-green-600 text-white">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* About Section */}
          <div className="mb-8">
            <h3 className="text-lg font-bold font-condensed mb-4">Tentang</h3>
            <p className="text-green-100 text-sm leading-relaxed max-w-4xl">
              Skor Live Sepak Bola di NobarMeriah Livescore menghadirkan liputan Live dari lebih dari 500 liga, piala,
              dan turnamen di seluruh dunia dengan update real-time untuk hasil, statistik, klasemen, cuplikan
              video, dan jadwal. Semua laga Live dari tiap liga Sepak Bola punya update cepat dan akurat untuk
              menit, skor, paruh waktu dan hasil akhir, pencetak gol dan assist, kartu, pergantian pemain, serta
              statistik laga.
            </p>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="font-bold font-condensed mb-3 text-white">{category}</h4>
                <ul className="space-y-1.5">
                  {links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-green-100 hover:text-white transition-colors font-condensed"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-green-500">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Logo & App Buttons */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                    <img
                      src="/images/NobarMeriahLogoIcon.png"
                      alt="NobarMeriah"
                      className="w-6 h-6 object-contain"
                      onError={(e) => { e.target.innerHTML = '⚽'; }}
                    />
                  </div>
                  <span className="text-lg font-bold font-condensed">NobarMeriah</span>
                </div>

                {/* App Store Buttons */}
                <div className="flex items-center gap-2">
                  <a
                    href="#"
                    className="flex items-center gap-2 bg-black text-white px-3 py-1.5 rounded-lg hover:bg-gray-900 transition-colors"
                  >
                    <span className="text-lg">▶</span>
                    <div className="text-left">
                      <p className="text-[10px] leading-none">GET IT ON</p>
                      <p className="text-xs font-semibold font-condensed">Google Play</p>
                    </div>
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-2 bg-black text-white px-3 py-1.5 rounded-lg hover:bg-gray-900 transition-colors"
                  >
                    <span className="text-lg">🍎</span>
                    <div className="text-left">
                      <p className="text-[10px] leading-none">Download on the</p>
                      <p className="text-xs font-semibold font-condensed">App Store</p>
                    </div>
                  </a>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="flex items-center gap-4 text-sm">
                {navLinks.map((link) => (
                  <a key={link} href="#" className="hover:text-green-200 transition-colors font-condensed">
                    {link}
                  </a>
                ))}
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    className="w-8 h-8 flex items-center justify-center hover:bg-green-500 rounded-full transition-colors"
                    aria-label={social.label}
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Copyright Footer */}
        <div className="border-t border-green-500 bg-green-700">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Feedback */}
              <div className="flex items-center gap-2 text-sm text-green-100">
                <span>😊</span>
                <span className="font-condensed">Kalau gak asik, BERHENTI</span>
              </div>

              {/* Copyright */}
              <p className="text-sm text-green-100 font-condensed">
                © 2026 NobarMeriah – Hak cipta dilindungi undang-undang.
              </p>

              {/* Policy Links */}
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-green-200">
                {bottomLinks.map((link, index) => (
                  <span key={link} className="flex items-center gap-3">
                    <a href="#" className="hover:text-white transition-colors font-condensed">
                      {link}
                    </a>
                    {index < bottomLinks.length - 1 && <span className="text-green-400">|</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* ============================================================ */}
      {/* MOBILE FOOTER - Hijau (sama dengan desktop) + spacing */}
      {/* ============================================================ */}
      <footer className="lg:hidden">
        {/* Spacing sebelum footer */}
        <div className="h-6 bg-gray-100"></div>

        {/* Main Footer - Hijau */}
        <div className="bg-green-600 text-white">
          {/* About Section */}
          <div className="px-4 py-6">
            <h3 className="text-base font-bold font-condensed mb-3">Tentang</h3>
            <p className="text-green-100 text-sm leading-relaxed">
              Skor Live Sepak Bola di NobarMeriah Livescore menghadirkan liputan Live dari lebih dari 500 liga, piala,
              dan turnamen di seluruh dunia dengan update real-time untuk hasil, statistik, klasemen, cuplikan video,
              dan jadwal. Semua laga Live dari tiap liga Sepak Bola punya update cepat dan akurat untuk menit, skor,
              paruh waktu dan hasil akhir, pencetak gol dan assist, kartu, pergantian pemain, serta statistik laga.
              Cuplikan video tersedia untuk liga paling populer seperti La Liga dan Copa del Rey (Spanyol), Serie A
              dan Coppa Italia (Italia), Bundesliga dan DFB Pokal (Jerman), Ligue 1 (Prancis), serta UEFA Champions
              League, Europa League, dan turnamen internasional seperti World Championship dan European Championship.
            </p>
          </div>

          {/* Links Grid - 2 Columns Mobile */}
          <div className="px-4 pb-6">
            <div className="grid grid-cols-2 gap-x-6 gap-y-6">
              {Object.entries(footerLinks).slice(0, 6).map(([category, links]) => (
                <div key={category}>
                  <h4 className="font-bold font-condensed mb-2 text-white text-sm">{category}</h4>
                  <ul className="space-y-1">
                    {links.map((link) => (
                      <li key={link}>
                        <a
                          href="#"
                          className="text-sm text-green-100 hover:text-white transition-colors font-condensed"
                        >
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Nav Links - Stacked */}
          <div className="border-t border-green-500">
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link}
                  href="#"
                  className="block text-sm font-bold font-condensed text-white hover:text-green-200 transition-colors"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>

          {/* Logo & App Buttons */}
          <div className="bg-green-700 px-4 py-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <img
                  src="/images/NobarMeriahLogoIcon.png"
                  alt="NobarMeriah"
                  className="w-6 h-6 object-contain"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
              <span className="text-lg font-bold font-condensed">NobarMeriah</span>
            </div>

            {/* App Store Buttons */}
            <div className="flex items-center gap-2 mb-4">
              <a
                href="#"
                className="flex items-center gap-2 bg-black text-white px-3 py-2 rounded-lg"
              >
                <span className="text-xl">▶</span>
                <div className="text-left">
                  <p className="text-[9px] leading-none text-gray-400">GET IT ON</p>
                  <p className="text-xs font-semibold font-condensed">Google Play</p>
                </div>
              </a>
              <a
                href="#"
                className="flex items-center gap-2 bg-black text-white px-3 py-2 rounded-lg"
              >
                <span className="text-xl">🍎</span>
                <div className="text-left">
                  <p className="text-[9px] leading-none text-gray-400">Download on the</p>
                  <p className="text-xs font-semibold font-condensed">App Store</p>
                </div>
              </a>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-8 h-8 flex items-center justify-center text-white hover:text-green-200 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Copyright Footer */}
          <div className="bg-green-800 px-4 py-4">
            {/* Feedback */}
            <div className="flex items-center gap-2 text-sm text-green-100 mb-4">
              <span className="text-lg">🔞</span>
              <span className="font-condensed">Kalau gak asik, BERHENTI</span>
            </div>

            {/* Policy Links - Stacked */}
            <div className="space-y-2 mb-4">
              {bottomLinks.map((link) => (
                <a
                  key={link}
                  href="#"
                  className="block text-sm text-green-200 hover:text-white transition-colors font-condensed"
                >
                  {link}
                </a>
              ))}
            </div>

            {/* Copyright */}
            <p className="text-sm text-green-200 font-condensed">
              © 2026 NobarMeriah – Hak cipta dilindungi undang-undang.
            </p>
          </div>
        </div>

        {/* Extra spacing for bottom nav */}
        <div className="h-16 bg-green-800"></div>
      </footer>
    </>
  );
}
