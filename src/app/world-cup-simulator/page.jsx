'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Trophy, Search, Users, Zap, ChevronRight, X, Play } from 'lucide-react';
import PreMatchModal from './PreMatch';
import MatchLive from './MatchLive';
import KnockoutStage, { generateBracket } from './Knockout';

// ============================================================
// GLOBAL STYLES
// ============================================================
const GLOBAL_STYLES = `
  @keyframes wcBallSpin{0%{transform:rotate(0) scale(1);opacity:1}20%{transform:rotate(360deg) scale(1.3)}50%{transform:rotate(1080deg) scale(1.15)}80%{transform:rotate(2000deg) scale(.95)}100%{transform:rotate(2520deg) scale(.7);opacity:.6}}
  @keyframes wcBallExplode{0%{transform:scale(.7);opacity:.6}40%{transform:scale(2);opacity:.4}100%{transform:scale(3);opacity:0}}
  @keyframes wcParticle{0%{transform:translate(-50%,-50%) scale(1);opacity:1}100%{transform:translate(var(--tx),var(--ty)) scale(0);opacity:0}}
  @keyframes wcRingPulse{0%{transform:scale(0);opacity:.8;border-width:4px}100%{transform:scale(3);opacity:0;border-width:1px}}
  @keyframes wcCardReveal{0%{opacity:0;transform:scale(.3) rotateY(90deg)}50%{opacity:1;transform:scale(1.08) rotateY(0)}70%{transform:scale(.96)}100%{transform:scale(1)}}
  @keyframes wcFlagPop{0%{opacity:0;transform:scale(0) rotate(-10deg)}60%{opacity:1;transform:scale(1.15) rotate(2deg)}100%{opacity:1;transform:scale(1) rotate(0)}}
  @keyframes wcNameSlide{0%{opacity:0;transform:translateY(20px)}100%{opacity:1;transform:translateY(0)}}
  @keyframes wcStarsFade{0%{opacity:0;transform:scale(.5)}100%{opacity:1;transform:scale(1)}}
  @keyframes wcBadgeBounce{0%{opacity:0;transform:scale(0) translateY(-10px)}60%{transform:scale(1.2)}100%{opacity:1;transform:scale(1)}}
  @keyframes wcFadeSlideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
  @keyframes wcSlideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
  @keyframes wcNotifIn{from{opacity:0;transform:translateY(-100%)}to{opacity:1;transform:translateY(0)}}
  @keyframes wcNotifOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-100%)}}
  @keyframes wcNotifProgress{from{width:100%}to{width:0%}}
`;

// ============================================================
// TEAMS DATA
// ============================================================
const TEAMS_RAW = [
  ["MEX", "Mexico", "CONCACAF", 3, "mx", "#006847", ["Ochoa|GK", "Edson Álvarez|MID", "Lozano|FWD", "Raúl Jiménez|FWD", "S. Giménez|FWD", "C. Montes|DEF", "J. Vásquez|DEF", "Pineda|MID", "Romo|MID", "Lainez|MID", "A. Vega|FWD"]],
  ["RSA", "South Africa", "CAF", 2, "za", "#FFB81C", ["R. Williams|GK", "Mokoena|MID", "P. Tau|FWD", "Zwane|MID", "Rayners|FWD", "Mvala|DEF", "Kekana|DEF", "Maswanganyi|MID", "Appollis|FWD", "Makgopa|FWD", "Mudau|DEF"]],
  ["KOR", "South Korea", "AFC", 3, "kr", "#C60C30", ["Kim S.|GK", "Son Heung-min|FWD", "Kim Min-jae|DEF", "Lee Kang-in|MID", "Hwang Hee-chan|FWD", "Hwang In-beom|MID", "Cho Gue-sung|FWD", "Lee Jae-sung|MID", "Oh Hyeon-gyu|FWD", "Bae Jun-ho|MID", "Kim Jin-su|DEF"]],
  ["DNK", "Denmark", "UEFA", 3, "dk", "#C8102E", ["Schmeichel|GK", "Christensen|DEF", "Kjær|DEF", "Maehle|DEF", "Højbjerg|MID", "Eriksen|MID", "Damsgaard|MID", "Skov Olsen|FWD", "Højlund|FWD", "Wind|FWD", "Kristiansen|DEF"]],
  ["CAN", "Canada", "CONCACAF", 2, "ca", "#FF0000", ["Borjan|GK", "A. Davies|DEF", "J. David|FWD", "Buchanan|MID", "Eustáquio|MID", "Larin|FWD", "Koné|MID", "Johnston|DEF", "Bombito|DEF", "Millar|FWD", "Shaffelburg|MID"]],
  ["ITA", "Italy", "UEFA", 4, "it", "#0066B3", ["Donnarumma|GK", "Bastoni|DEF", "Dimarco|DEF", "Calafiori|DEF", "Barella|MID", "Tonali|MID", "Pellegrini|MID", "Chiesa|FWD", "Retegui|FWD", "Raspadori|FWD", "Cambiaso|DEF"]],
  ["QAT", "Qatar", "AFC", 2, "qa", "#8A1538", ["Al Sheeb|GK", "Afif|FWD", "Almoez Ali|FWD", "Al-Haydos|MID", "Hatem|MID", "Boudiaf|MID", "P. Miguel|DEF", "A. Hassan|DEF", "Muntari|FWD", "Al-Rawi|DEF", "Alaaeldin|MID"]],
  ["SUI", "Switzerland", "UEFA", 3, "ch", "#D52B1E", ["Sommer|GK", "Xhaka|MID", "Akanji|DEF", "Embolo|FWD", "Okafor|FWD", "Zakaria|MID", "Ndoye|FWD", "Freuler|MID", "Elvedi|DEF", "Amdouni|FWD", "Vargas|MID"]],
  ["BRA", "Brazil", "CONMEBOL", 5, "br", "#FFDF00", ["Alisson|GK", "Vinícius Jr.|FWD", "Rodrygo|FWD", "Casemiro|MID", "Marquinhos|DEF", "Raphinha|FWD", "Endrick|FWD", "B. Guimarães|MID", "Paquetá|MID", "Militão|DEF", "Estêvão|FWD"]],
  ["MAR", "Morocco", "CAF", 4, "ma", "#C1272D", ["Bounou|GK", "Hakimi|DEF", "Ziyech|MID", "Amrabat|MID", "En-Nesyri|FWD", "I. Díaz|FWD", "Aguerd|DEF", "Ounahi|MID", "El Khannouss|MID", "Mazraoui|DEF", "Ezzalzouli|FWD"]],
  ["HAI", "Haiti", "CONCACAF", 1, "ht", "#00209F", ["Duverger|GK", "Pierrot|FWD", "Etienne Jr.|MID", "Nazon|FWD", "Arcus|DEF", "Alceus|DEF", "Adé|DEF", "Jean Jacques|MID", "Pierre|FWD", "Saba|MID", "François|FWD"]],
  ["SCO", "Scotland", "UEFA", 2, "gb-sct", "#003078", ["Gunn|GK", "Robertson|DEF", "McTominay|MID", "McGinn|MID", "Gilmour|MID", "C. Adams|FWD", "Tierney|DEF", "Doak|FWD", "Ferguson|MID", "Dykes|FWD", "Hendry|DEF"]],
  ["USA", "United States", "CONCACAF", 3, "us", "#002868", ["Turner|GK", "Pulisic|FWD", "McKennie|MID", "T. Adams|MID", "Reyna|MID", "Weah|FWD", "Dest|DEF", "Musah|MID", "Balogun|FWD", "Robinson|DEF", "Pepi|FWD"]],
  ["PAR", "Paraguay", "CONMEBOL", 2, "py", "#DA291C", ["A. Silva|GK", "Almirón|MID", "Enciso|FWD", "G. Gómez|DEF", "Villasanti|MID", "Á. Romero|FWD", "Sanabria|FWD", "Alderete|DEF", "R. Sosa|FWD", "Arce|FWD", "Cubas|MID"]],
  ["AUS", "Australia", "AFC", 2, "au", "#FFB81C", ["M. Ryan|GK", "Irvine|MID", "H. Souttar|DEF", "McGree|MID", "Duke|FWD", "Goodwin|FWD", "Mabil|FWD", "Maclaren|FWD", "Irankunda|FWD", "Behich|DEF", "Rowles|DEF"]],
  ["TUR", "Türkiye", "UEFA", 3, "tr", "#E30A17", ["Günok|GK", "Çalhanoğlu|MID", "Yıldız|FWD", "Güler|MID", "Aktürkoğlu|FWD", "Demiral|DEF", "Kökcü|MID", "Ünder|FWD", "Yılmaz|FWD", "Müldür|DEF", "Ayhan|DEF"]],
  ["GER", "Germany", "UEFA", 4, "de", "#2a2a2a", ["Neuer|GK", "Musiala|MID", "Wirtz|MID", "Havertz|FWD", "Kimmich|DEF", "Rüdiger|DEF", "Sané|FWD", "Füllkrug|FWD", "Gündoğan|MID", "Andrich|MID", "Tah|DEF"]],
  ["CUR", "Curaçao", "CONCACAF", 1, "cw", "#003DA5", ["E. Room|GK", "Ju. Bacuna|MID", "L. Bacuna|MID", "Gorré|MID", "Janga|FWD", "Martina|DEF", "Lachman|DEF", "Hooi|FWD", "Kuwas|FWD", "Kastaneer|FWD", "Nepomuceno|FWD"]],
  ["CIV", "Côte d'Ivoire", "CAF", 3, "ci", "#FF8200", ["Fofana|GK", "Kessié|MID", "Haller|FWD", "Adingra|FWD", "S. Fofana|MID", "Pépé|FWD", "Kossounou|DEF", "Aurier|DEF", "Sangaré|MID", "K. Konaté|FWD", "Diakité|FWD"]],
  ["ECU", "Ecuador", "CONMEBOL", 3, "ec", "#FFD100", ["Galíndez|GK", "Caicedo|MID", "E. Valencia|FWD", "Plata|MID", "Hincapié|DEF", "Estupiñán|DEF", "K. Páez|MID", "Sarmiento|MID", "F. Torres|DEF", "K. Rodríguez|FWD", "Yeboah|FWD"]],
  ["NED", "Netherlands", "UEFA", 4, "nl", "#FF6600", ["Verbruggen|GK", "Van Dijk|DEF", "De Jong|MID", "Gakpo|FWD", "X. Simons|MID", "Depay|FWD", "Dumfries|DEF", "Gravenberch|MID", "Reijnders|MID", "Brobbey|FWD", "Aké|DEF"]],
  ["JPN", "Japan", "AFC", 3, "jp", "#002B5C", ["Gonda|GK", "Mitoma|MID", "Kubo|MID", "Endo|MID", "Tomiyasu|DEF", "Doan|FWD", "Ueda|FWD", "Kamada|MID", "Furuhashi|FWD", "Itakura|DEF", "Ito|FWD"]],
  ["POL", "Poland", "UEFA", 3, "pl", "#DC143C", ["Szczęsny|GK", "Lewandowski|FWD", "Zieliński|MID", "Kiwior|DEF", "Szymański|MID", "Zalewski|MID", "Świderski|FWD", "Bednarek|DEF", "Frankowski|DEF", "Urbański|MID", "Piątek|FWD"]],
  ["TUN", "Tunisia", "CAF", 2, "tn", "#E70013", ["Dahmen|GK", "Skhiri|MID", "Msakni|FWD", "Mejbri|MID", "Laïdouni|MID", "Khazri|MID", "Jebali|FWD", "Talbi|DEF", "Bronn|DEF", "Dräger|DEF", "Jaziri|FWD"]],
  ["BEL", "Belgium", "UEFA", 4, "be", "#ED2939", ["Casteels|GK", "De Bruyne|MID", "Lukaku|FWD", "Doku|FWD", "Onana|MID", "Tielemans|MID", "Openda|FWD", "Trossard|FWD", "Faes|DEF", "Theate|DEF", "Bakayoko|FWD"]],
  ["EGY", "Egypt", "CAF", 3, "eg", "#C8102E", ["El Shenawy|GK", "M. Salah|FWD", "Marmoush|FWD", "Ashour|MID", "M. Mohamed|FWD", "Elneny|MID", "Trezeguet|MID", "I. Adel|FWD", "Hamdy|DEF", "Fatouh|DEF", "Kouka|FWD"]],
  ["IRN", "Iran", "AFC", 2, "ir", "#239F40", ["Beiranvand|GK", "Taremi|FWD", "Azmoun|FWD", "Jahanbakhsh|MID", "Gholizadeh|MID", "Ezatolahi|MID", "Moharrami|DEF", "Hajsafi|DEF", "Kanaani|DEF", "Nourollahi|MID", "Sayyadmanesh|FWD"]],
  ["NZL", "New Zealand", "OFC", 1, "nz", "#1a1a1a", ["Marinovic|GK", "C. Wood|FWD", "J. Bell|MID", "Cacace|DEF", "Stamenic|MID", "Boxall|DEF", "Greive|FWD", "Waine|FWD", "Garbett|MID", "S. Singh|MID", "Pijnaker|DEF"]],
  ["ESP", "Spain", "UEFA", 5, "es", "#AA151B", ["U. Simón|GK", "L. Yamal|FWD", "Pedri|MID", "Rodri|MID", "N. Williams|FWD", "Carvajal|DEF", "Gavi|MID", "D. Olmo|MID", "Cucurella|DEF", "Morata|FWD", "F. López|MID"]],
  ["CPV", "Cape Verde", "CAF", 1, "cv", "#003893", ["Vozinha|GK", "G. Rodrigues|FWD", "Zé Luís|FWD", "R. Mendes|FWD", "Monteiro|MID", "Rocha Santos|MID", "L. Costa|DEF", "Fortes|DEF", "J. Cabral|FWD", "N. Borges|MID", "Tavares|DEF"]],
  ["KSA", "Saudi Arabia", "AFC", 2, "sa", "#006C35", ["Al-Owais|GK", "Al-Dawsari|FWD", "Al-Buraikan|FWD", "Kanno|MID", "Al-Najei|MID", "Al-Shahrani|DEF", "Al-Ghannam|DEF", "A. Yahya|FWD", "Al-Boleahi|DEF", "Al-Malki|MID", "Al-Hamdan|FWD"]],
  ["URU", "Uruguay", "CONMEBOL", 4, "uy", "#5CBFEB", ["Rochet|GK", "Valverde|MID", "D. Núñez|FWD", "Suárez|FWD", "Bentancur|MID", "Ugarte|MID", "Giménez|DEF", "Pellistri|FWD", "Nández|DEF", "Olivera|DEF", "Araújo|FWD"]],
  ["FRA", "France", "UEFA", 5, "fr", "#002395", ["Maignan|GK", "Mbappé|FWD", "Griezmann|MID", "Dembélé|FWD", "Tchouaméni|MID", "Saliba|DEF", "Koundé|DEF", "Camavinga|MID", "Thuram|FWD", "Barcola|FWD", "T. Hernández|DEF"]],
  ["SEN", "Senegal", "CAF", 3, "sn", "#009639", ["É. Mendy|GK", "Mané|FWD", "Koulibaly|DEF", "I. Sarr|FWD", "Gueye|MID", "P.M. Sarr|MID", "N. Jackson|FWD", "B. Dia|FWD", "Ndiaye|FWD", "Diallo|DEF", "H. Diarra|MID"]],
  ["IRQ", "Iraq", "AFC", 2, "iq", "#007A3D", ["Jalal|GK", "Ali Adnan|DEF", "Mohanad Ali|FWD", "Amjad Attwan|MID", "Ibrahim Bayesh|MID", "Rebin Sulaka|DEF", "Aymen Hussein|FWD", "Safaa Hadi|DEF", "Ali Jasim|MID", "Ahmed Yasin|FWD", "Saad Natiq|MID"]],
  ["NOR", "Norway", "UEFA", 3, "no", "#EF2B2D", ["Nyland|GK", "Haaland|FWD", "Ødegaard|MID", "Berge|MID", "Sørloth|FWD", "Østigård|DEF", "Ryerson|DEF", "Nusa|MID", "Aursnes|MID", "Bobb|MID", "Meling|DEF"]],
  ["ARG", "Argentina", "CONMEBOL", 5, "ar", "#74ACDF", ["E. Martínez|GK", "Messi|FWD", "J. Álvarez|FWD", "L. Martínez|FWD", "E. Fernández|MID", "De Paul|MID", "Mac Allister|MID", "C. Romero|DEF", "Otamendi|DEF", "Garnacho|FWD", "Molina|DEF"]],
  ["ALG", "Algeria", "CAF", 2, "dz", "#006233", ["M'Bolhi|GK", "Mahrez|FWD", "Bennacer|MID", "Benrahma|FWD", "Slimani|FWD", "Bensebaini|DEF", "Aouar|MID", "Amoura|FWD", "Gouiri|FWD", "Mandi|DEF", "Zerrouki|MID"]],
  ["AUT", "Austria", "UEFA", 3, "at", "#ED2939", ["Pentz|GK", "Sabitzer|MID", "Baumgartner|FWD", "Laimer|MID", "Arnautović|FWD", "Danso|DEF", "Gregoritsch|FWD", "Seiwald|MID", "Posch|DEF", "Wimmer|FWD", "Schmid|MID"]],
  ["JOR", "Jordan", "AFC", 1, "jo", "#007A3D", ["Abulaila|GK", "Al-Tamari|MID", "Al-Naimat|FWD", "B. Faisal|MID", "Olwan|FWD", "B. Yaseen|DEF", "Al-Dardour|FWD", "Ersan|MID", "Al-Ajalin|DEF", "Nasib|DEF", "Al Rashdan|DEF"]],
  ["POR", "Portugal", "UEFA", 5, "pt", "#DA291C", ["D. Costa|GK", "C. Ronaldo|FWD", "B. Fernandes|MID", "B. Silva|MID", "R. Leão|FWD", "Vitinha|MID", "R. Dias|DEF", "Cancelo|DEF", "N. Mendes|DEF", "Jota|FWD", "G. Ramos|FWD"]],
  ["JAM", "Jamaica", "CONCACAF", 1, "jm", "#009B3A", ["Blake|GK", "Antonio|FWD", "Bailey|FWD", "Nicholson|FWD", "Lowe|DEF", "Powell|DEF", "Morrison|MID", "Ravel|MID", "Bell|DEF", "Gray|FWD", "Decordova-Reid|FWD"]],
  ["UZB", "Uzbekistan", "AFC", 2, "uz", "#1eb53a", ["Suyunov|GK", "Masharipov|MID", "Shomurodov|FWD", "Fayzullaev|FWD", "Khusanov|DEF", "Urunov|MID", "Iskanderov|MID", "Shukurov|MID", "Sergeev|FWD", "Ashurmatov|DEF", "Turgunboev|FWD"]],
  ["COL", "Colombia", "CONMEBOL", 4, "co", "#FCD116", ["Ospina|GK", "L. Díaz|FWD", "J. Rodríguez|MID", "R. Ríos|MID", "Lerma|MID", "D. Sánchez|DEF", "Y. Mina|DEF", "J. Arias|FWD", "Borré|FWD", "Córdoba|FWD", "Sinisterra|FWD"]],
  ["ENG", "England", "UEFA", 5, "gb-eng", "#cf1124", ["Pickford|GK", "Bellingham|MID", "Saka|FWD", "Kane|FWD", "Rice|MID", "Foden|MID", "Palmer|FWD", "Mainoo|MID", "Stones|DEF", "Shaw|DEF", "Gordon|FWD"]],
  ["CRO", "Croatia", "UEFA", 4, "hr", "#FF0000", ["Livaković|GK", "Modrić|MID", "Kovačić|MID", "Gvardiol|DEF", "Kramarić|FWD", "Brozović|MID", "Pašalić|MID", "Perišić|FWD", "Petković|FWD", "Majer|MID", "Matanović|FWD"]],
  ["GHA", "Ghana", "CAF", 2, "gh", "#FFD700", ["Ati-Zigi|GK", "Kudus|MID", "Partey|MID", "Semenyo|FWD", "J. Ayew|FWD", "I. Williams|FWD", "Lamptey|DEF", "Issahaku|FWD", "Nuamah|FWD", "Salisu|DEF", "Bukari|FWD"]],
  ["PAN", "Panama", "CONCACAF", 1, "pa", "#DA291C", ["Mejía|GK", "Murillo|DEF", "Carrasquilla|MID", "Bárcenas|MID", "Quintero|MID", "Blackburn|FWD", "Fajardo|FWD", "Escobar|DEF", "Davis|DEF", "Waterman|FWD", "Góndola|FWD"]],
];

const parseTeams = () => TEAMS_RAW.map(t => ({
  id: t[0], name: t[1], conf: t[2], stars: t[3], flagCode: t[4], color: t[5],
  players: t[6].map(p => { const [n, pos] = p.split("|"); return { name: n, pos }; })
}));

const flagUrl = (code) => `https://flagcdn.com/w40/${code}.png`;
const flagUrlLg = (code) => `https://flagcdn.com/w80/${code}.png`;
const CONF_COLORS = { UEFA: "#2563eb", CONMEBOL: "#16a34a", CAF: "#ea580c", AFC: "#dc2626", CONCACAF: "#7c3aed", OFC: "#0891b2" };
const POS_COLORS_BADGE = { GK: "bg-yellow-100 text-yellow-700", DEF: "bg-blue-100 text-blue-700", MID: "bg-green-100 text-green-700", FWD: "bg-red-100 text-red-700" };
const CONF_NAMES = { UEFA: "Eropa", CONMEBOL: "Am. Selatan", CAF: "Afrika", AFC: "Asia", CONCACAF: "Am. Utara", OFC: "Oseania" };
const GL = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

const Flag = ({ code, size = 20, className = "" }) => (
  <img src={flagUrl(code)} alt="" className={`inline-block object-cover rounded-sm ${className}`} style={{ width: size, height: Math.round(size * 0.75) }} />
);
const FlagLg = ({ code, size = 48, className = "" }) => (
  <img src={flagUrlLg(code)} alt="" className={`inline-block object-cover rounded ${className}`} style={{ width: size, height: Math.round(size * 0.75) }} />
);

// ============================================================
// DRAW ENGINE
// ============================================================
const performDraw = (allTeams) => {
  const shuffled = [...allTeams].sort(() => Math.random() - 0.5);
  const pot1 = shuffled.filter(t => t.stars >= 5).sort(() => Math.random() - 0.5);
  const pot2 = shuffled.filter(t => t.stars === 4).sort(() => Math.random() - 0.5);
  const pot3 = shuffled.filter(t => t.stars === 3).sort(() => Math.random() - 0.5);
  const pot4 = shuffled.filter(t => t.stars <= 2).sort(() => Math.random() - 0.5);
  while (pot1.length < 12) { const t = pot2.shift(); if (t) pot1.push(t); else break; }
  while (pot2.length < 12) { const t = pot3.shift(); if (t) pot2.push(t); else break; }
  while (pot3.length < 12) { const t = pot4.shift(); if (t) pot3.push(t); else break; }
  while (pot4.length < 12) { const t = pot3.pop(); if (t) pot4.push(t); else break; }
  const groups = {};
  GL.forEach(g => groups[g] = []);
  [pot1, pot2, pot3, pot4].forEach(pot => {
    [...pot].sort(() => Math.random() - 0.5).forEach((team, i) => { groups[GL[i % 12]].push(team); });
  });
  const drawOrder = [];
  [pot1, pot2, pot3, pot4].forEach((pot, potIdx) => {
    [...pot].sort(() => Math.random() - 0.5).forEach(team => {
      for (const [g, teams] of Object.entries(groups)) {
        if (teams.find(t => t.id === team.id)) { drawOrder.push({ team, group: g, pot: potIdx + 1 }); break; }
      }
    });
  });
  return { groups, drawOrder };
};

// ============================================================
// MATCH SIMULATION ENGINE (auto-sim for non-player matches)
// ============================================================
const simMatch = (teamA, teamB) => {
  const str = (t) => t.stars * 15 + Math.random() * 40;
  const sA = str(teamA), sB = str(teamB);
  const maxGoals = (s) => s > 70 ? 4 : s > 50 ? 3 : 2;
  let gA = 0, gB = 0;
  for (let i = 0; i < 10; i++) {
    if (Math.random() * 100 < sA * 0.5) gA = Math.min(gA + 1, maxGoals(sA));
    if (Math.random() * 100 < sB * 0.5) gB = Math.min(gB + 1, maxGoals(sB));
  }
  return { goalsA: gA, goalsB: gB };
};

// Generate ALL group fixtures (round-robin: 6 matches per group of 4)
const generateAllGroupFixtures = (groupTeams) => {
  const fixtures = [];
  for (let i = 0; i < groupTeams.length; i++) {
    for (let j = i + 1; j < groupTeams.length; j++) {
      fixtures.push({ home: groupTeams[i], away: groupTeams[j], result: null });
    }
  }
  return fixtures;
};

// Generate only player's 3 matches
const generatePlayerFixtures = (groupTeams, playerTeam) => {
  return groupTeams
    .filter(t => t.id !== playerTeam.id)
    .map(opp => ({ home: playerTeam, away: opp, result: null }));
};

// Auto-sim the non-player matches in the group (the other 3 matches)
const generateOtherFixtures = (groupTeams, playerTeam) => {
  const others = groupTeams.filter(t => t.id !== playerTeam.id);
  const fixtures = [];
  for (let i = 0; i < others.length; i++) {
    for (let j = i + 1; j < others.length; j++) {
      fixtures.push({ home: others[i], away: others[j], result: null });
    }
  }
  return fixtures;
};

// Calculate group standings from fixtures
const calcStandings = (groupTeams, fixtures) => {
  const table = {};
  groupTeams.forEach(t => {
    table[t.id] = { team: t, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, mp: 0 };
  });
  fixtures.forEach(f => {
    if (!f.result) return;
    const { goalsA, goalsB } = f.result;
    table[f.home.id].mp++; table[f.away.id].mp++;
    table[f.home.id].gf += goalsA; table[f.home.id].ga += goalsB;
    table[f.away.id].gf += goalsB; table[f.away.id].ga += goalsA;
    if (goalsA > goalsB) { table[f.home.id].w++; table[f.home.id].pts += 3; table[f.away.id].l++; }
    else if (goalsA < goalsB) { table[f.away.id].w++; table[f.away.id].pts += 3; table[f.home.id].l++; }
    else { table[f.home.id].d++; table[f.home.id].pts += 1; table[f.away.id].d++; table[f.away.id].pts += 1; }
  });
  return Object.values(table).sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
};

// ============================================================
// PARTICLES (for draw animation)
// ============================================================
const PARTICLES = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2;
  const dist = 60 + Math.random() * 40;
  return {
    tx: `${Math.cos(angle) * dist}px`, ty: `${Math.sin(angle) * dist}px`,
    color: ['#f59e0b', '#22c55e', '#ef4444', '#3b82f6'][i % 4], size: 6 + Math.random() * 6, delay: i * 0.02
  };
});

function SpinningBallReveal({ drawItem, isPlayerTeam, onComplete }) {
  const [phase, setPhase] = useState('spin');
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('explode'), 1200);
    const t2 = setTimeout(() => setPhase('reveal'), 1700);
    const t3 = setTimeout(() => onComplete(), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);
  return (
    <div className="mx-3 mt-3 mb-2">
      {phase === 'spin' && (
        <div className="flex flex-col items-center justify-center py-8">
          <div style={{ animation: 'wcBallSpin 1.2s cubic-bezier(0.4,0,0.2,1) forwards', fontSize: 56 }}>⚽</div>
          <p className="text-sm font-condensed text-gray-400 mt-4" style={{ animation: 'wcStarsFade 0.5s ease-out' }}>Mengundi...</p>
        </div>
      )}
      {phase === 'explode' && (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="relative" style={{ width: 80, height: 80 }}>
            <div className="absolute inset-0 flex items-center justify-center" style={{ animation: 'wcBallExplode 0.5s ease-out forwards', fontSize: 56 }}>⚽</div>
            <div className="absolute inset-0 flex items-center justify-center"><div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #f59e0b', animation: 'wcRingPulse 0.6s ease-out forwards' }} /></div>
            <div className="absolute inset-0 flex items-center justify-center"><div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #22c55e', animation: 'wcRingPulse 0.6s ease-out forwards', animationDelay: '0.1s' }} /></div>
            {PARTICLES.map((p, i) => (<div key={i} className="absolute" style={{ left: '50%', top: '50%', width: p.size, height: p.size, borderRadius: '50%', backgroundColor: p.color, animation: 'wcParticle 0.6s ease-out forwards', animationDelay: `${p.delay}s`, '--tx': p.tx, '--ty': p.ty }} />))}
          </div>
        </div>
      )}
      {phase === 'reveal' && (
        <div style={{ animation: 'wcCardReveal 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
          className={`rounded-xl p-5 text-center border-2 ${isPlayerTeam ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-500' : 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-400'}`}>
          {isPlayerTeam && <div style={{ animation: 'wcBadgeBounce 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards' }} className="inline-flex items-center gap-1 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold font-condensed mb-3">🎉 TIM KAMU!</div>}
          <p className={`text-[10px] font-condensed uppercase tracking-widest font-bold ${isPlayerTeam ? 'text-green-600' : 'text-yellow-600'}`}>Masuk Grup {drawItem.group}!</p>
          <div className="mt-3" style={{ animation: 'wcFlagPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards', animationDelay: '0.15s', opacity: 0 }}>
            <FlagLg code={drawItem.team.flagCode} size={72} className="mx-auto shadow-lg rounded" />
          </div>
          <p className="text-2xl font-bold font-condensed text-gray-900 mt-3" style={{ animation: 'wcNameSlide 0.4s ease-out forwards', animationDelay: '0.3s', opacity: 0 }}>{drawItem.team.name}</p>
          <div className="mt-1" style={{ animation: 'wcStarsFade 0.3s ease-out forwards', animationDelay: '0.5s', opacity: 0 }}>
            <span className="text-yellow-500 text-lg font-condensed">{'★'.repeat(drawItem.team.stars)}{'☆'.repeat(5 - drawItem.team.stars)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function WorldCupGamePage() {
  const router = useRouter();
  const [allTeams] = useState(parseTeams);
  // Phase: select | draw | tournament | knockout
  const [gamePhase, setGamePhase] = useState('select');
  // Select state
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [previewTeam, setPreviewTeam] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterConf, setFilterConf] = useState('ALL');
  const [filterStars, setFilterStars] = useState(0);
  // Draw state
  const [drawResult, setDrawResult] = useState(null);
  const [drawnTeams, setDrawnTeams] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawComplete, setDrawComplete] = useState(false);
  const [playerRevealed, setPlayerRevealed] = useState(false);
  const [currentDrawItem, setCurrentDrawItem] = useState(null);
  // Tournament state
  const [playerGroup, setPlayerGroup] = useState(null);
  const [playerFixtures, setPlayerFixtures] = useState([]);
  const [otherFixtures, setOtherFixtures] = useState([]);
  const [allGroupFixtures, setAllGroupFixtures] = useState({});
  const [showPreMatch, setShowPreMatch] = useState(false);
  const [preMatchOpponent, setPreMatchOpponent] = useState(null);
  const [preMatchLabel, setPreMatchLabel] = useState('');
  const [showMatchLive, setShowMatchLive] = useState(false);
  const [matchLiveConfig, setMatchLiveConfig] = useState(null);
  const [matchNotification, setMatchNotification] = useState(null);
  const [viewingGroup, setViewingGroup] = useState(null);
  // Knockout state
  const [knockoutBracket, setKnockoutBracket] = useState(null);
  const [knockoutMatch, setKnockoutMatch] = useState(null);
  const [koPreMatchLabel, setKoPreMatchLabel] = useState('');
  const knockoutRef = useRef(null);

  // ============================================================
  // SAVE / LOAD PROGRESS (localStorage)
  // ============================================================
  const SAVE_KEY = 'wc2026_save';

  // Load on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const save = JSON.parse(raw);
      if (save.gamePhase) setGamePhase(save.gamePhase);
      if (save.selectedTeam) setSelectedTeam(save.selectedTeam);
      if (save.drawResult) setDrawResult(save.drawResult);
      if (save.drawComplete) { setDrawComplete(true); setPlayerRevealed(true); setDrawnTeams(save.drawResult?.drawOrder || []); }
      if (save.playerGroup) setPlayerGroup(save.playerGroup);
      if (save.playerFixtures) setPlayerFixtures(save.playerFixtures);
      if (save.otherFixtures) setOtherFixtures(save.otherFixtures);
      if (save.allGroupFixtures) setAllGroupFixtures(save.allGroupFixtures);
      if (save.knockoutBracket) setKnockoutBracket(save.knockoutBracket);
    } catch (e) { console.warn('Failed to load save:', e); }
  }, []);

  // Auto-save on state changes
  useEffect(() => {
    // Don't save transient states or initial select
    if (gamePhase === 'select' && !selectedTeam) return;
    // Don't save during active match
    if (showMatchLive || showPreMatch) return;
    try {
      const save = {
        gamePhase,
        selectedTeam,
        drawResult,
        drawComplete,
        playerGroup,
        playerFixtures,
        otherFixtures,
        allGroupFixtures,
        knockoutBracket,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch (e) { console.warn('Failed to save:', e); }
  }, [gamePhase, selectedTeam, drawResult, drawComplete, playerGroup, playerFixtures, otherFixtures, allGroupFixtures, knockoutBracket, showMatchLive, showPreMatch]);

  // Clear save on restart
  const clearSave = () => {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { }
  };

  const filteredTeams = useMemo(() => {
    return allTeams.filter(t => {
      if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterConf !== 'ALL' && t.conf !== filterConf) return false;
      if (filterStars > 0 && t.stars !== filterStars) return false;
      return true;
    }).sort((a, b) => b.stars - a.stars || a.name.localeCompare(b.name));
  }, [allTeams, searchQuery, filterConf, filterStars]);

  const confirmTeam = () => {
    if (!selectedTeam) return;
    setDrawResult(performDraw(allTeams));
    setGamePhase('draw');
    setDrawnTeams([]);
    setDrawComplete(false);
    setPlayerRevealed(false);
    setCurrentDrawItem(null);
  };

  const getPlayerGroup = useCallback(() => {
    if (!drawResult || !selectedTeam) return null;
    for (const [g, teams] of Object.entries(drawResult.groups)) {
      if (teams.find(t => t.id === selectedTeam.id)) return g;
    }
    return null;
  }, [drawResult, selectedTeam]);

  // Draw handlers
  const drawNextTeam = () => {
    if (!drawResult || isDrawing) return;
    const nextIdx = drawnTeams.length;
    if (nextIdx >= drawResult.drawOrder.length) { setDrawComplete(true); return; }
    setIsDrawing(true);
    setCurrentDrawItem(drawResult.drawOrder[nextIdx]);
  };
  const handleDrawComplete = () => {
    if (!currentDrawItem) return;
    if (currentDrawItem.team.id === selectedTeam?.id) setPlayerRevealed(true);
    setDrawnTeams(prev => [...prev, currentDrawItem]);
    setCurrentDrawItem(null);
    setIsDrawing(false);
    if (drawnTeams.length + 1 >= drawResult.drawOrder.length) setDrawComplete(true);
  };
  const skipDraw = () => {
    if (!drawResult) return;
    setDrawnTeams(drawResult.drawOrder);
    setDrawComplete(true);
    setIsDrawing(false);
    setCurrentDrawItem(null);
    setPlayerRevealed(true);
  };
  const getDrawnGroupTeams = (g) => drawnTeams.filter(dt => dt.group === g);
  const isCurrentDrawPlayer = currentDrawItem?.team.id === selectedTeam?.id;

  // Start tournament
  const proceedToGame = () => {
    const pg = getPlayerGroup();
    setPlayerGroup(pg);
    const pgTeams = drawResult.groups[pg];
    const pFix = generatePlayerFixtures(pgTeams, selectedTeam);
    setPlayerFixtures(pFix);
    const oFix = generateOtherFixtures(pgTeams, selectedTeam);
    setOtherFixtures(oFix);
    // Generate fixtures for all groups but DON'T sim yet
    const allFix = {};
    GL.forEach(g => {
      const teams = drawResult.groups[g];
      allFix[g] = generateAllGroupFixtures(teams);
    });
    setAllGroupFixtures(allFix);
    setGamePhase('tournament');
  };

  // Next unplayed player match
  const nextPlayerMatch = useMemo(() => {
    return playerFixtures.find(f => !f.result) || null;
  }, [playerFixtures]);

  const playerMatchNumber = useMemo(() => {
    return playerFixtures.filter(f => f.result).length + 1;
  }, [playerFixtures]);

  const isPlayerMatch = (f) => f && selectedTeam && (f.home.id === selectedTeam.id || f.away.id === selectedTeam.id);

  // Open pre-match for player match
  const openPlayerMatch = () => {
    if (!nextPlayerMatch || !selectedTeam) return;
    const opp = nextPlayerMatch.home.id === selectedTeam.id ? nextPlayerMatch.away : nextPlayerMatch.home;
    setPreMatchOpponent(opp);
    setPreMatchLabel(`Grup ${playerGroup} - Match ${playerMatchNumber} of 3`);
    setShowPreMatch(true);
  };

  // Handle kick off — open live match simulation
  const handleKickOff = (matchConfig) => {
    setShowPreMatch(false);
    setMatchLiveConfig(matchConfig);
    setShowMatchLive(true);
  };

  // Handle match complete — group stage or knockout
  const handleMatchComplete = (finalScore) => {
    setShowMatchLive(false);
    setMatchLiveConfig(null);

    // KNOCKOUT MATCH
    if (knockoutMatch) {
      // Forward result to KnockoutStage via ref-like pattern
      // We need KnockoutStage to handle this - pass via callback
      if (knockoutRef.current) {
        knockoutRef.current(finalScore);
      }
      setKnockoutMatch(null);
      return;
    }

    // GROUP STAGE MATCH
    setPlayerFixtures(prev => prev.map(f => f === nextPlayerMatch ? { ...f, result: finalScore } : f));

    setOtherFixtures(prev => {
      const nextOther = prev.find(f => !f.result);
      if (!nextOther) return prev;
      const otherResult = simMatch(nextOther.home, nextOther.away);
      setTimeout(() => {
        setMatchNotification({ home: nextOther.home, away: nextOther.away, result: otherResult, phase: 'in' });
        setTimeout(() => {
          setMatchNotification(prev => prev ? { ...prev, phase: 'out' } : null);
          setTimeout(() => setMatchNotification(null), 400);
        }, 4000);
      }, 800);
      return prev.map(f => f === nextOther ? { ...f, result: otherResult } : f);
    });

    setAllGroupFixtures(prev => {
      const updated = { ...prev };
      GL.forEach(g => {
        if (g === playerGroup) return;
        const fixes = updated[g] || [];
        let simmed = 0;
        updated[g] = fixes.map(f => {
          if (!f.result && simmed < 2) { simmed++; return { ...f, result: simMatch(f.home, f.away) }; }
          return f;
        });
      });
      return updated;
    });
  };

  // Combine all fixtures for standings calculation
  const allPlayerGroupFixtures = useMemo(() => {
    return [...playerFixtures, ...otherFixtures];
  }, [playerFixtures, otherFixtures]);

  const standings = useMemo(() => {
    if (!playerGroup || !drawResult) return [];
    return calcStandings(drawResult.groups[playerGroup], allPlayerGroupFixtures);
  }, [playerGroup, drawResult, allPlayerGroupFixtures]);

  const allPlayerMatchesPlayed = playerFixtures.length > 0 && playerFixtures.every(f => f.result);

  // Viewing other groups
  const activeViewGroup = viewingGroup || playerGroup;
  const isViewingOwnGroup = activeViewGroup === playerGroup;

  const viewedGroupStandings = useMemo(() => {
    if (!drawResult || !activeViewGroup) return [];
    if (isViewingOwnGroup) return standings;
    const groupTeams = drawResult.groups[activeViewGroup];
    const groupFix = allGroupFixtures[activeViewGroup] || [];
    return calcStandings(groupTeams, groupFix);
  }, [drawResult, activeViewGroup, isViewingOwnGroup, standings, allGroupFixtures]);

  const viewedGroupFixtures = useMemo(() => {
    if (!activeViewGroup) return [];
    if (isViewingOwnGroup) return [];
    return (allGroupFixtures[activeViewGroup] || []).filter(f => f.result);
  }, [activeViewGroup, isViewingOwnGroup, allGroupFixtures]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />

      {/* HEADER */}
      <div className="bg-green-600 text-white">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => {
            if (gamePhase === 'draw') setGamePhase('select');
            else if (gamePhase === 'tournament') { if (confirm('Kembali ke undian? Progress akan hilang.')) setGamePhase('draw'); }
            else if (gamePhase === 'knockout') { if (confirm('Kembali ke fase grup?')) setGamePhase('tournament'); }
            else router.push('/');
          }} className="p-1 hover:bg-green-500 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold font-condensed">
              {gamePhase === 'select' ? '⚽ Pilih Tim Kamu' : gamePhase === 'draw' ? '🎱 Undian Grup' : gamePhase === 'knockout' ? '⚔️ Babak Knockout' : '🏆 Fase Grup'}
            </h1>
            <p className="text-xs text-green-200 font-condensed">FIFA World Cup 2026™</p>
          </div>
          <Trophy className="w-5 h-5 text-yellow-300" />
        </div>
        <div className="flex items-center gap-1 px-4 pb-3">
          {['Pilih Tim', 'Undian Grup', 'Turnamen'].map((step, i) => {
            const ci = ['select', 'draw', 'tournament'].indexOf(gamePhase);
            return (
              <div key={step} className="flex-1">
                <div className={`h-1 rounded-full ${i < ci ? 'bg-yellow-400' : i === ci ? 'bg-white' : 'bg-green-500'}`} />
                <p className={`text-[9px] mt-1 font-condensed text-center ${i === ci ? 'text-white font-bold' : 'text-green-300'}`}>{step}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ======== TEAM SELECTION ======== */}
      {gamePhase === 'select' && (
        <>
          {selectedTeam && (
            <div className="mx-3 mt-3 bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center gap-4">
                <FlagLg code={selectedTeam.flagCode} size={56} className="rounded shadow" />
                <div className="flex-1">
                  <p className="text-[10px] font-condensed text-green-200 uppercase tracking-wider">Tim Kamu</p>
                  <h3 className="text-xl font-bold font-condensed">{selectedTeam.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-yellow-300 text-sm font-condensed">{'★'.repeat(selectedTeam.stars)}{'☆'.repeat(5 - selectedTeam.stars)}</span>
                    <span className="text-xs font-condensed text-green-200">{selectedTeam.conf}</span>
                  </div>
                </div>
                <button onClick={confirmTeam} className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 px-5 py-2.5 rounded-full font-bold font-condensed text-sm shadow-md">LANJUT →</button>
              </div>
            </div>
          )}
          <div className="px-3 pt-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Cari negara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm font-condensed focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              <button onClick={() => setFilterConf('ALL')} className={`px-3 py-1.5 rounded-full text-xs font-semibold font-condensed whitespace-nowrap ${filterConf === 'ALL' ? 'bg-green-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>Semua</button>
              {Object.entries(CONF_NAMES).map(([k, v]) => (
                <button key={k} onClick={() => setFilterConf(filterConf === k ? 'ALL' : k)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold font-condensed whitespace-nowrap ${filterConf === k ? 'text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
                  style={filterConf === k ? { backgroundColor: CONF_COLORS[k] } : {}}>{v}</button>
              ))}
            </div>
            <div className="flex gap-1">
              <button onClick={() => setFilterStars(0)} className={`px-3 py-1.5 rounded-full text-xs font-semibold font-condensed ${filterStars === 0 ? 'bg-yellow-400 text-gray-900' : 'bg-white text-gray-600 border border-gray-200'}`}>Semua ★</button>
              {[5, 4, 3, 2, 1].map(s => (
                <button key={s} onClick={() => setFilterStars(filterStars === s ? 0 : s)} className={`px-2.5 py-1.5 rounded-full text-xs font-condensed ${filterStars === s ? 'bg-yellow-400 text-gray-900 font-bold' : 'bg-white text-gray-600 border border-gray-200'}`}>{s}★</button>
              ))}
            </div>
          </div>
          <p className="px-4 py-2 text-xs text-gray-400 font-condensed">{filteredTeams.length} tim</p>
          <div className="px-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredTeams.map(team => {
              const isSel = selectedTeam?.id === team.id;
              return (
                <div key={team.id} onClick={() => setSelectedTeam(team)}
                  className={`bg-white rounded-xl border-2 overflow-hidden cursor-pointer transition-all active:scale-[0.98] ${isSel ? 'border-green-500 shadow-lg shadow-green-500/20 ring-2 ring-green-200' : 'border-gray-100 hover:border-gray-300'}`}>
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-1 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: team.color }} />
                    <Flag code={team.flagCode} size={28} className="flex-shrink-0 shadow-sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900 font-condensed truncate">{team.name}</span>
                        {isSel && <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-[10px]">✓</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-yellow-500 text-xs font-condensed">{'★'.repeat(team.stars)}{'☆'.repeat(5 - team.stars)}</span>
                        <span className="text-[10px] font-semibold font-condensed" style={{ color: CONF_COLORS[team.conf] }}>{team.conf}</span>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setPreviewTeam(team); }} className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg">
                      <Users className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {selectedTeam && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 shadow-2xl z-40">
              <button onClick={confirmTeam} className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold font-condensed rounded-xl text-base shadow-lg">
                PILIH {selectedTeam.name.toUpperCase()} & MULAI UNDIAN <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* ======== GROUP DRAW ======== */}
      {gamePhase === 'draw' && drawResult && (
        <>
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white px-4 py-5 text-center">
            <p className="text-[10px] font-condensed text-gray-400 uppercase tracking-widest">FIFA World Cup 2026™</p>
            <h2 className="text-xl font-bold font-condensed mt-1">UNDIAN FASE GRUP</h2>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Flag code={selectedTeam?.flagCode} size={24} />
              <span className="font-condensed text-yellow-400 font-semibold">{selectedTeam?.name}</span>
              {playerRevealed && <span className="text-xs font-condensed text-green-400 bg-green-400/20 px-2 py-0.5 rounded-full">Grup {getPlayerGroup()}</span>}
              {!playerRevealed && !drawComplete && <span className="text-xs font-condensed text-gray-500 bg-gray-700 px-2 py-0.5 rounded-full">Menunggu undian...</span>}
            </div>
            <div className="mt-3 bg-gray-700/50 rounded-full px-4 py-1.5 inline-block">
              <span className="text-xs font-condensed text-gray-300">{drawComplete ? '✅ Undian Selesai!' : `${drawnTeams.length} / 48 tim`}</span>
            </div>
            <div className="mt-3 h-1.5 bg-gray-700 rounded-full overflow-hidden max-w-xs mx-auto">
              <div className="h-full bg-yellow-400 rounded-full transition-all duration-500" style={{ width: `${(drawnTeams.length / 48) * 100}%` }} />
            </div>
          </div>
          {currentDrawItem && <SpinningBallReveal key={`d-${drawnTeams.length}`} drawItem={currentDrawItem} isPlayerTeam={isCurrentDrawPlayer} onComplete={handleDrawComplete} />}
          {!drawComplete && !currentDrawItem && (
            <div className="flex items-center justify-center gap-3 px-4 py-4">
              <button onClick={drawNextTeam} disabled={isDrawing} className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold font-condensed rounded-full disabled:opacity-50 text-sm shadow-md">🎱 Berikutnya</button>
              <button onClick={skipDraw} className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-condensed rounded-full text-sm font-semibold">Skip ▸▸</button>
            </div>
          )}
          {/* Draw complete summary */}
          {drawComplete && (
            <div className="px-3 pt-3 pb-1 text-center space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mx-auto max-w-sm">
                <p className="text-sm font-condensed text-green-800"><strong>{selectedTeam?.name}</strong> masuk di <strong className="text-green-600">Grup {getPlayerGroup()}</strong>!</p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  {drawResult.groups[getPlayerGroup()]?.map(t => (
                    <div key={t.id} className="flex flex-col items-center">
                      <Flag code={t.flagCode} size={28} className="shadow" />
                      <span className="text-[9px] font-condensed text-gray-600 mt-1">{t.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={proceedToGame} className="inline-flex items-center gap-2 px-8 py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold font-condensed rounded-full shadow-lg text-base">
                <Zap className="w-5 h-5" /> MULAI TURNAMEN
              </button>
              <br />
              <button onClick={() => { clearSave(); setGamePhase('select'); setDrawResult(null); setDrawnTeams([]); setDrawComplete(false); setPlayerRevealed(false); }} className="text-sm text-gray-500 hover:text-gray-700 font-condensed">← Pilih Tim Lain</button>
            </div>
          )}
          {/* Group cards */}
          <div className="px-2 py-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {GL.map(g => {
              const gt = getDrawnGroupTeams(g);
              const isPG = playerRevealed && drawResult.groups[g]?.some(t => t.id === selectedTeam?.id);
              return (
                <div key={g} className={`bg-white rounded-xl border-2 overflow-hidden transition-all ${isPG ? 'border-green-500 shadow-md shadow-green-500/20' : 'border-gray-100'}`}>
                  <div className={`px-3 py-2 flex items-center justify-between ${isPG ? 'bg-green-50' : 'bg-gray-50'} border-b border-gray-100`}>
                    <span className={`text-xs font-bold font-condensed ${isPG ? 'text-green-600' : 'text-gray-500'}`}>GRUP {g}</span>
                    {isPG && <span className="text-[9px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-condensed font-bold">KAMU</span>}
                  </div>
                  <div className="min-h-[136px]">
                    {gt.map(dt => {
                      const isMe = dt.team.id === selectedTeam?.id;
                      return (
                        <div key={dt.team.id} className={`flex items-center gap-2 px-3 py-2 border-b border-gray-50 last:border-0 ${isMe ? 'bg-green-50' : ''}`} style={{ animation: 'wcFadeSlideIn 0.3s ease-out' }}>
                          <Flag code={dt.team.flagCode} size={22} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold font-condensed truncate ${isMe ? 'text-green-700' : 'text-gray-800'}`}>{dt.team.name} {isMe ? '⭐' : ''}</p>
                            <span className="text-yellow-500 text-[9px]">{'★'.repeat(dt.team.stars)}</span>
                          </div>
                        </div>
                      );
                    })}
                    {Array.from({ length: 4 - gt.length }).map((_, i) => (
                      <div key={`e-${i}`} className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-50 last:border-0">
                        <div className="w-6 h-4 rounded bg-gray-100 animate-pulse" /><div className="w-16 h-3 bg-gray-100 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ======== TOURNAMENT PHASE ======== */}
      {gamePhase === 'tournament' && drawResult && (
        <>
          {/* Team banner - wider on PC */}
          <div className="bg-gradient-to-r from-green-700 to-green-600 text-white px-4 lg:px-8 py-3 lg:py-4">
            <div className="flex items-center gap-3 lg:gap-4 max-w-5xl mx-auto">
              <span className="lg:hidden"><FlagLg code={selectedTeam?.flagCode} size={28} /></span>
              <span className="hidden lg:inline-block"><FlagLg code={selectedTeam?.flagCode} size={44} /></span>
              <div>
                <p className="font-bold font-condensed lg:text-xl">{selectedTeam?.name}</p>
                <p className="text-xs lg:text-sm font-condensed text-green-200">Grup {playerGroup} • FIFA World Cup 2026™</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-[10px] lg:text-xs font-condensed text-green-200">Match</p>
                <p className="font-bold font-condensed lg:text-xl">{playerFixtures.filter(f => f.result).length} / 3</p>
              </div>
            </div>
          </div>

          {/* PC 2-column layout / Mobile stacked */}
          <div className="max-w-5xl mx-auto lg:grid lg:grid-cols-[1fr_340px] lg:gap-6 lg:px-6 lg:py-6">

            {/* LEFT COLUMN: Match Card + Your Matches + Other Results */}
            <div>
              {/* Next Player Match or Done */}
              <div className="px-3 pt-3 lg:px-0 lg:pt-0">
                {!allPlayerMatchesPlayed && nextPlayerMatch && (
                  <div className="rounded-xl lg:rounded-2xl border-2 border-green-500 overflow-hidden">
                    {/* Stadium-like gradient header on PC */}
                    <div className="bg-green-50 p-4 lg:bg-gradient-to-br lg:from-green-800 lg:via-green-700 lg:to-emerald-800 lg:p-8 lg:text-white">
                      <p className="text-[10px] lg:text-xs font-condensed uppercase tracking-wider font-bold text-green-600 lg:text-green-300 mb-2 lg:mb-4">
                        🎮 Match {playerMatchNumber} of 3
                      </p>
                      <div className="flex items-center justify-center gap-4 lg:gap-10">
                        <div className="text-center">
                          <span className="lg:hidden"><Flag code={nextPlayerMatch.home.flagCode} size={36} /></span>
                          <span className="hidden lg:inline-block"><FlagLg code={nextPlayerMatch.home.flagCode} size={72} className="shadow-lg" /></span>
                          <p className="text-xs lg:text-base font-bold font-condensed mt-1 lg:mt-3">{nextPlayerMatch.home.name}</p>
                          <p className="text-yellow-500 text-[9px] lg:text-sm">{'★'.repeat(nextPlayerMatch.home.stars)}</p>
                        </div>
                        <span className="text-2xl lg:text-4xl font-bold font-condensed text-gray-300 lg:text-white/30">VS</span>
                        <div className="text-center">
                          <span className="lg:hidden"><Flag code={nextPlayerMatch.away.flagCode} size={36} /></span>
                          <span className="hidden lg:inline-block"><FlagLg code={nextPlayerMatch.away.flagCode} size={72} className="shadow-lg" /></span>
                          <p className="text-xs lg:text-base font-bold font-condensed mt-1 lg:mt-3">{nextPlayerMatch.away.name}</p>
                          <p className="text-yellow-500 text-[9px] lg:text-sm">{'★'.repeat(nextPlayerMatch.away.stars)}</p>
                        </div>
                      </div>
                      <button onClick={openPlayerMatch}
                        className="w-full lg:max-w-xs lg:mx-auto mt-3 lg:mt-6 py-3.5 lg:py-4 bg-green-600 lg:bg-yellow-400 lg:text-gray-900 hover:bg-green-700 lg:hover:bg-yellow-300 text-white font-bold font-condensed rounded-xl flex items-center justify-center gap-2 shadow-md text-base lg:text-lg lg:rounded-full">
                        <Play className="w-5 h-5" /> PERSIAPAN PERTANDINGAN
                      </button>
                    </div>
                  </div>
                )}

                {allPlayerMatchesPlayed && (
                  <div className="rounded-xl lg:rounded-2xl border-2 border-yellow-400 bg-yellow-50 p-4 lg:p-8 text-center">
                    <p className="text-lg lg:text-2xl font-bold font-condensed text-gray-900">🏁 Fase Grup Selesai!</p>
                    {standings[0]?.team.id === selectedTeam?.id || standings[1]?.team.id === selectedTeam?.id ? (
                      <>
                        <p className="text-sm lg:text-base font-condensed text-gray-600 mt-1">🎉 Selamat! Tim kamu lolos ke babak knockout!</p>
                        <button onClick={() => {
                          // Generate all group standings for bracket
                          const allStandings = {};
                          GL.forEach(g => {
                            const teams = drawResult.groups[g];
                            const fixes = g === playerGroup ? allPlayerGroupFixtures : (allGroupFixtures[g] || []);
                            allStandings[g] = calcStandings(teams, fixes);
                          });
                          const bracket = generateBracket(allStandings, selectedTeam);
                          setKnockoutBracket(bracket);
                          setGamePhase('knockout');
                        }}
                          className="mt-3 lg:mt-4 px-6 lg:px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold font-condensed rounded-full shadow-md lg:text-base flex items-center gap-2 mx-auto">
                          ⚔️ Lanjut ke Babak Knockout <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-sm lg:text-base font-condensed text-gray-600 mt-1">😢 Sayang, tim kamu finis di posisi {standings.findIndex(s => s.team.id === selectedTeam?.id) + 1} dan tidak lolos.</p>
                        <button onClick={() => {
                          clearSave();
                          setGamePhase('select');
                          setSelectedTeam(null);
                          setDrawResult(null);
                          setDrawnTeams([]);
                          setPlayerFixtures([]);
                          setOtherFixtures([]);
                          setAllGroupFixtures({});
                          setKnockoutBracket(null);
                        }}
                          className="mt-3 lg:mt-4 px-6 lg:px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-bold font-condensed rounded-full shadow-md lg:text-base flex items-center gap-2 mx-auto">
                          🔄 Main Lagi dari Awal
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Your Matches */}
              <div className="px-3 pt-4 lg:px-0 lg:pt-5">
                <h3 className="text-sm lg:text-base font-bold font-condensed text-gray-700 mb-2">🎮 Pertandingan Kamu</h3>
                <div className="space-y-2 lg:space-y-3">
                  {playerFixtures.map((f, i) => {
                    const played = !!f.result;
                    const isHome = f.home.id === selectedTeam?.id;
                    const myGoals = played ? (isHome ? f.result.goalsA : f.result.goalsB) : null;
                    const oppGoals = played ? (isHome ? f.result.goalsB : f.result.goalsA) : null;
                    const won = played && myGoals > oppGoals;
                    const draw = played && myGoals === oppGoals;
                    return (
                      <div key={i} className={`bg-white rounded-xl lg:rounded-2xl border-2 p-3 lg:p-4 ${played ? (won ? 'border-green-200' : draw ? 'border-yellow-200' : 'border-red-200') : 'border-green-400'}`}>
                        <p className="text-[10px] lg:text-xs font-condensed text-gray-400 mb-1">Match {i + 1}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 lg:gap-3 flex-1">
                            <span className="lg:hidden"><Flag code={f.home.flagCode} size={20} /></span>
                            <span className="hidden lg:inline-block"><Flag code={f.home.flagCode} size={28} /></span>
                            <span className={`text-xs lg:text-sm font-semibold font-condensed ${f.home.id === selectedTeam?.id ? 'text-green-700' : 'text-gray-800'}`}>{f.home.name}</span>
                          </div>
                          {played ? (
                            <div className={`px-3 lg:px-4 py-1 lg:py-1.5 rounded-lg ${won ? 'bg-green-600' : draw ? 'bg-yellow-500' : 'bg-red-500'}`}>
                              <span className="text-sm lg:text-base font-bold font-condensed text-white">{f.result.goalsA} - {f.result.goalsB}</span>
                            </div>
                          ) : (
                            <span className="text-xs lg:text-sm text-gray-400 font-condensed px-3">vs</span>
                          )}
                          <div className="flex items-center gap-2 lg:gap-3 flex-1 justify-end">
                            <span className={`text-xs lg:text-sm font-semibold font-condensed ${f.away.id === selectedTeam?.id ? 'text-green-700' : 'text-gray-800'}`}>{f.away.name}</span>
                            <span className="lg:hidden"><Flag code={f.away.flagCode} size={20} /></span>
                            <span className="hidden lg:inline-block"><Flag code={f.away.flagCode} size={28} /></span>
                          </div>
                        </div>
                        {played && (
                          <p className={`text-[10px] lg:text-xs font-bold font-condensed text-center mt-1 ${won ? 'text-green-600' : draw ? 'text-yellow-600' : 'text-red-500'}`}>
                            {won ? '✅ Menang!' : draw ? '🤝 Seri' : '❌ Kalah'}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Other Group Matches */}
              {otherFixtures.some(f => f.result) && (
                <div className="px-3 pt-4 pb-4 lg:px-0 lg:pt-5">
                  <h3 className="text-sm lg:text-base font-bold font-condensed text-gray-700 mb-2">📺 Hasil Pertandingan Lain</h3>
                  <div className="space-y-2">
                    {otherFixtures.filter(f => f.result).map((f, i) => (
                      <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 lg:p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="lg:hidden"><Flag code={f.home.flagCode} size={18} /></span>
                            <span className="hidden lg:inline-block"><Flag code={f.home.flagCode} size={24} /></span>
                            <span className="text-xs lg:text-sm font-semibold font-condensed text-gray-700">{f.home.name}</span>
                          </div>
                          <div className="px-3 py-1 bg-gray-800 rounded-lg">
                            <span className="text-xs lg:text-sm font-bold font-condensed text-white">{f.result.goalsA} - {f.result.goalsB}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-1 justify-end">
                            <span className="text-xs lg:text-sm font-semibold font-condensed text-gray-700">{f.away.name}</span>
                            <span className="lg:hidden"><Flag code={f.away.flagCode} size={18} /></span>
                            <span className="hidden lg:inline-block"><Flag code={f.away.flagCode} size={24} /></span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN (PC only sidebar, mobile below) */}
            <div>
              <div className="px-3 pt-4 lg:px-0 lg:pt-0 lg:sticky lg:top-4 space-y-3">
                {/* Group Selector Tabs */}
                <div>
                  <h3 className="text-sm lg:text-base font-bold font-condensed text-gray-700 mb-2">📊 Klasemen</h3>
                  <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                    {GL.map(g => {
                      const isActive = activeViewGroup === g;
                      const isMyGroup = g === playerGroup;
                      return (
                        <button key={g} onClick={() => setViewingGroup(g === playerGroup ? null : g)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold font-condensed whitespace-nowrap transition-all flex-shrink-0 ${isActive ? 'bg-green-600 text-white shadow-md' : isMyGroup ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
                            }`}>
                          {g}{isMyGroup ? ' ⭐' : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Standings Table */}
                {(() => {
                  const groupFixtures = !isViewingOwnGroup ? (allGroupFixtures[activeViewGroup] || []) : [];
                  const groupHasResults = !isViewingOwnGroup && groupFixtures.some(f => f.result);
                  return (
                    <>
                      <div className="bg-white rounded-xl lg:rounded-2xl border border-gray-200 overflow-hidden lg:shadow-sm">
                        <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center justify-between">
                          <span className="text-xs lg:text-sm font-bold font-condensed text-gray-600">Grup {activeViewGroup} {isViewingOwnGroup ? '(Grup Kamu)' : ''}</span>
                          {!isViewingOwnGroup && !groupHasResults && <span className="text-[10px] font-condensed text-gray-400">Belum dimainkan</span>}
                        </div>
                        <div className="grid grid-cols-[1fr_30px_30px_30px_40px_30px_40px] gap-0 px-3 py-1.5 border-b border-gray-100">
                          <span className="text-[10px] lg:text-xs font-bold text-gray-400 font-condensed">TIM</span>
                          <span className="text-[10px] lg:text-xs font-bold text-gray-400 font-condensed text-center">M</span>
                          <span className="text-[10px] lg:text-xs font-bold text-gray-400 font-condensed text-center">W</span>
                          <span className="text-[10px] lg:text-xs font-bold text-gray-400 font-condensed text-center">L</span>
                          <span className="text-[10px] lg:text-xs font-bold text-gray-400 font-condensed text-center">GD</span>
                          <span className="text-[10px] lg:text-xs font-bold text-gray-400 font-condensed text-center">GF</span>
                          <span className="text-[10px] lg:text-xs font-bold text-gray-400 font-condensed text-center">PTS</span>
                        </div>
                        {viewedGroupStandings.map((row, i) => {
                          const isMe = row.team.id === selectedTeam?.id;
                          const isQualified = i < 2 && row.mp > 0;
                          return (
                            <div key={row.team.id} className={`grid grid-cols-[1fr_30px_30px_30px_40px_30px_40px] gap-0 px-3 py-2.5 lg:py-3 border-b border-gray-50 last:border-0 ${isMe ? 'bg-green-50' : ''}`}>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] lg:text-xs font-bold font-condensed w-4 ${isQualified ? 'text-green-600' : 'text-gray-400'}`}>{i + 1}</span>
                                <Flag code={row.team.flagCode} size={18} />
                                <span className={`text-xs lg:text-sm font-semibold font-condensed truncate ${isMe ? 'text-green-700' : 'text-gray-800'}`}>{row.team.name}</span>
                              </div>
                              <span className="text-xs text-gray-500 font-condensed text-center">{row.mp}</span>
                              <span className="text-xs text-gray-500 font-condensed text-center">{row.w}</span>
                              <span className="text-xs text-gray-500 font-condensed text-center">{row.l}</span>
                              <span className="text-xs text-gray-500 font-condensed text-center">{row.gf - row.ga > 0 ? '+' : ''}{row.gf - row.ga}</span>
                              <span className="text-xs text-gray-500 font-condensed text-center">{row.gf}</span>
                              <span className="text-xs font-bold font-condensed text-center text-gray-900">{row.pts}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Fixtures for viewed group */}
                      {groupHasResults && (
                        <div>
                          <h4 className="text-xs lg:text-sm font-bold font-condensed text-gray-500 mb-1.5">Hasil Pertandingan</h4>
                          <div className="space-y-1.5">
                            {viewedGroupFixtures.map((f, i) => (
                              <div key={i} className="bg-white rounded-lg border border-gray-100 px-3 py-2 flex items-center justify-between">
                                <div className="flex items-center gap-1.5 flex-1">
                                  <Flag code={f.home.flagCode} size={16} />
                                  <span className="text-[11px] font-semibold font-condensed text-gray-700 truncate">{f.home.name}</span>
                                </div>
                                <div className="px-2 py-0.5 bg-gray-800 rounded text-[11px] font-bold font-condensed text-white mx-1">
                                  {f.result.goalsA} - {f.result.goalsB}
                                </div>
                                <div className="flex items-center gap-1.5 flex-1 justify-end">
                                  <span className="text-[11px] font-semibold font-condensed text-gray-700 truncate">{f.away.name}</span>
                                  <Flag code={f.away.flagCode} size={16} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

          </div>
        </>
      )}

      {/* ======== KNOCKOUT PHASE ======== */}
      {gamePhase === 'knockout' && knockoutBracket && selectedTeam && (
        <>
          {/* Header */}
          <div className="bg-gradient-to-r from-green-700 to-green-600 text-white px-4 lg:px-8 py-3 lg:py-4">
            <div className="flex items-center gap-3 lg:gap-4 max-w-5xl mx-auto">
              <span className="lg:hidden"><FlagLg code={selectedTeam.flagCode} size={28} /></span>
              <span className="hidden lg:inline-block"><FlagLg code={selectedTeam.flagCode} size={44} /></span>
              <div>
                <p className="font-bold font-condensed lg:text-xl">{selectedTeam.name}</p>
                <p className="text-xs lg:text-sm font-condensed text-green-200">⚔️ Babak Knockout • FIFA World Cup 2026™</p>
              </div>
            </div>
          </div>
          <KnockoutStage
            bracket={knockoutBracket}
            playerTeam={selectedTeam}
            resultCallbackRef={knockoutRef}
            onStartMatch={(match, round) => {
              const opp = match.home.id === selectedTeam.id ? match.away : match.home;
              setPreMatchOpponent(opp);
              setPreMatchLabel(`${round.toUpperCase()} — Knockout`);
              setKnockoutMatch({ match, round });
              setShowPreMatch(true);
            }}
            onRestart={() => {
              clearSave();
              setGamePhase('select');
              setSelectedTeam(null);
              setDrawResult(null);
              setDrawnTeams([]);
              setPlayerFixtures([]);
              setOtherFixtures([]);
              setAllGroupFixtures({});
              setKnockoutBracket(null);
            }}
          />
        </>
      )}

      {/* ======== TEAM PREVIEW MODAL ======== */}
      {previewTeam && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onClick={() => setPreviewTeam(null)}>
          <div className="bg-white w-full max-w-md max-h-[85vh] rounded-t-2xl sm:rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()} style={{ animation: 'wcSlideUp 0.3s ease-out' }}>
            <div className="relative bg-gradient-to-br from-green-600 to-green-700 px-6 py-6 text-center text-white">
              <button onClick={() => setPreviewTeam(null)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"><X className="w-4 h-4" /></button>
              <FlagLg code={previewTeam.flagCode} size={64} className="mx-auto shadow-lg rounded" />
              <h3 className="text-xl font-bold font-condensed mt-3">{previewTeam.name}</h3>
              <div className="flex items-center justify-center gap-4 mt-2 text-sm">
                <span className="text-yellow-300 font-condensed">{'★'.repeat(previewTeam.stars)}{'☆'.repeat(5 - previewTeam.stars)}</span>
                <span className="bg-white/20 px-3 py-0.5 rounded-full font-condensed text-xs">{previewTeam.conf}</span>
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-condensed mb-3">Squad ({previewTeam.players.length})</h4>
              <div className="space-y-1.5">
                {previewTeam.players.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-lg">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-condensed ${POS_COLORS_BADGE[p.pos]}`}>{p.pos}</span>
                    <span className="text-sm font-medium text-gray-800">{p.name}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => { setSelectedTeam(previewTeam); setPreviewTeam(null); }} className="w-full mt-4 py-3 bg-green-600 hover:bg-green-700 text-white font-bold font-condensed rounded-xl">
                PILIH {previewTeam.name.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======== MATCH NOTIFICATION POPUP ======== */}
      {matchNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-sm"
          style={{ animation: matchNotification.phase === 'in' ? 'wcNotifIn 0.4s ease-out forwards' : 'wcNotifOut 0.4s ease-in forwards' }}>
          <div className="bg-gray-900 text-white rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
            <div className="bg-gray-800 px-3 py-1.5 flex items-center gap-2">
              <span className="text-[10px]">📺</span>
              <span className="text-[10px] font-condensed text-gray-400 uppercase tracking-wider flex-1">Hasil Pertandingan Lain</span>
              <span className="text-[10px] font-condensed text-gray-500">Grup {playerGroup}</span>
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <Flag code={matchNotification.home.flagCode} size={22} />
                <span className="text-sm font-bold font-condensed truncate">{matchNotification.home.name}</span>
              </div>
              <div className="px-3 py-1 bg-white/10 rounded-lg mx-2">
                <span className="text-lg font-bold font-condensed">{matchNotification.result.goalsA} - {matchNotification.result.goalsB}</span>
              </div>
              <div className="flex items-center gap-2 flex-1 justify-end">
                <span className="text-sm font-bold font-condensed truncate">{matchNotification.away.name}</span>
                <Flag code={matchNotification.away.flagCode} size={22} />
              </div>
            </div>
            <div className="h-0.5 bg-green-500" style={{ animation: 'wcNotifProgress 4s linear forwards' }} />
          </div>
        </div>
      )}

      {/* ======== PRE-MATCH MODAL ======== */}
      {showPreMatch && preMatchOpponent && (
        <PreMatchModal
          myTeam={selectedTeam}
          opponent={preMatchOpponent}
          matchLabel={preMatchLabel}
          onClose={() => setShowPreMatch(false)}
          onStartMatch={handleKickOff}
        />
      )}

      {/* ======== LIVE MATCH MODAL ======== */}
      {showMatchLive && matchLiveConfig && (() => {
        const match = knockoutMatch ? knockoutMatch.match : nextPlayerMatch;
        if (!match) return null;
        return (
          <MatchLive
            homeTeam={match.home}
            awayTeam={match.away}
            matchConfig={matchLiveConfig}
            isHome={match.home.id === selectedTeam?.id}
            onComplete={handleMatchComplete}
            isKnockout={!!knockoutMatch}
            skipIntro={true}
          />
        );
      })()}
    </div>
  );
}
