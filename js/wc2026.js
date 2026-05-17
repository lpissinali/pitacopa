// =============================================
// World Cup 2026 — Teams & Groups Data
// =============================================
// Format: 48 teams, 12 groups of 4 (A–L)
// Group stage: each team plays 3 games
// Top 2 + 8 best 3rd-place → Round of 32
// =============================================

const WC2026_TEAMS = {
  // Group A (Mexico City)
  A: [
    { id: "usa", name: "Estados Unidos", nameEn: "United States", flag: "🇺🇸", group: "A" },
    { id: "pan", name: "Panamá", nameEn: "Panama", flag: "🇵🇦", group: "A" },
    { id: "alb", name: "Albânia", nameEn: "Albania", flag: "🇦🇱", group: "A" },
    { id: "ukr", name: "Ucrânia", nameEn: "Ukraine", flag: "🇺🇦", group: "A" },
  ],
  // Group B
  B: [
    { id: "arg", name: "Argentina", nameEn: "Argentina", flag: "🇦🇷", group: "B" },
    { id: "chi", name: "Chile", nameEn: "Chile", flag: "🇨🇱", group: "B" },
    { id: "pol", name: "Polônia", nameEn: "Poland", flag: "🇵🇱", group: "B" },
    { id: "per", name: "Peru", nameEn: "Peru", flag: "🇵🇪", group: "B" },
  ],
  // Group C
  C: [
    { id: "mex", name: "México", nameEn: "Mexico", flag: "🇲🇽", group: "C" },
    { id: "eng", name: "Inglaterra", nameEn: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group: "C" },
    { id: "nig", name: "Nigéria", nameEn: "Nigeria", flag: "🇳🇬", group: "C" },
    { id: "uzb", name: "Uzbequistão", nameEn: "Uzbekistan", flag: "🇺🇿", group: "C" },
  ],
  // Group D
  D: [
    { id: "fra", name: "França", nameEn: "France", flag: "🇫🇷", group: "D" },
    { id: "mar", name: "Marrocos", nameEn: "Morocco", flag: "🇲🇦", group: "D" },
    { id: "jap", name: "Japão", nameEn: "Japan", flag: "🇯🇵", group: "D" },
    { id: "pue", name: "Porto Rico", nameEn: "Puerto Rico", flag: "🇵🇷", group: "D" },
  ],
  // Group E
  E: [
    { id: "bra", name: "Brasil", nameEn: "Brazil", flag: "🇧🇷", group: "E" },
    { id: "por", name: "Portugal", nameEn: "Portugal", flag: "🇵🇹", group: "E" },
    { id: "mex2", name: "Equador", nameEn: "Ecuador", flag: "🇪🇨", group: "E" },
    { id: "ksa", name: "Arábia Saudita", nameEn: "Saudi Arabia", flag: "🇸🇦", group: "E" },
  ],
  // Group F
  F: [
    { id: "ger", name: "Alemanha", nameEn: "Germany", flag: "🇩🇪", group: "F" },
    { id: "nld", name: "Holanda", nameEn: "Netherlands", flag: "🇳🇱", group: "F" },
    { id: "civ", name: "Costa do Marfim", nameEn: "Ivory Coast", flag: "🇨🇮", group: "F" },
    { id: "irl", name: "Irlanda", nameEn: "Ireland", flag: "🇮🇪", group: "F" },
  ],
  // Group G
  G: [
    { id: "esp", name: "Espanha", nameEn: "Spain", flag: "🇪🇸", group: "G" },
    { id: "col", name: "Colômbia", nameEn: "Colombia", flag: "🇨🇴", group: "G" },
    { id: "tur", name: "Turquia", nameEn: "Turkey", flag: "🇹🇷", group: "G" },
    { id: "cri", name: "Costa Rica", nameEn: "Costa Rica", flag: "🇨🇷", group: "G" },
  ],
  // Group H
  H: [
    { id: "prt", name: "Portugal H", nameEn: "Uruguay", flag: "🇺🇾", group: "H" },
    { id: "uru", name: "Uruguai", nameEn: "Uruguay", flag: "🇺🇾", group: "H" },
    { id: "bel", name: "Bélgica", nameEn: "Belgium", flag: "🇧🇪", group: "H" },
    { id: "irq", name: "Iraque", nameEn: "Iraq", flag: "🇮🇶", group: "H" },
  ],
  // Group I
  I: [
    { id: "can", name: "Canadá", nameEn: "Canada", flag: "🇨🇦", group: "I" },
    { id: "den", name: "Dinamarca", nameEn: "Denmark", flag: "🇩🇰", group: "I" },
    { id: "cmr", name: "Camarões", nameEn: "Cameroon", flag: "🇨🇲", group: "I" },
    { id: "geo", name: "Geórgia", nameEn: "Georgia", flag: "🇬🇪", group: "I" },
  ],
  // Group J
  J: [
    { id: "ita", name: "Itália", nameEn: "Italy", flag: "🇮🇹", group: "J" },
    { id: "cro", name: "Croácia", nameEn: "Croatia", flag: "🇭🇷", group: "J" },
    { id: "srb", name: "Sérvia", nameEn: "Serbia", flag: "🇷🇸", group: "J" },
    { id: "nzl", name: "Nova Zelândia", nameEn: "New Zealand", flag: "🇳🇿", group: "J" },
  ],
  // Group K
  K: [
    { id: "kor", name: "Coreia do Sul", nameEn: "South Korea", flag: "🇰🇷", group: "K" },
    { id: "aus", name: "Austrália", nameEn: "Australia", flag: "🇦🇺", group: "K" },
    { id: "egy", name: "Egito", nameEn: "Egypt", flag: "🇪🇬", group: "K" },
    { id: "tun", name: "Tunísia", nameEn: "Tunisia", flag: "🇹🇳", group: "K" },
  ],
  // Group L
  L: [
    { id: "ven", name: "Venezuela", nameEn: "Venezuela", flag: "🇻🇪", group: "L" },
    { id: "sen", name: "Senegal", nameEn: "Senegal", flag: "🇸🇳", group: "L" },
    { id: "par", name: "Paraguai", nameEn: "Paraguay", flag: "🇵🇾", group: "L" },
    { id: "gre", name: "Grécia", nameEn: "Greece", flag: "🇬🇷", group: "L" },
  ]
};

// Flat list of all teams
const ALL_TEAMS = Object.values(WC2026_TEAMS).flat();

// Group stage games — 3 rounds per group
// Each group: game 1 (T1 vs T2), game 2 (T3 vs T4), game 3 (T1 vs T3), game 4 (T2 vs T4), game 5 (T1 vs T4), game 6 (T2 vs T3)
function generateGroupGames() {
  const games = [];
  let gameId = 1;

  const groupStartDates = {
    A: "2026-06-11", B: "2026-06-12", C: "2026-06-12", D: "2026-06-13",
    E: "2026-06-13", F: "2026-06-14", G: "2026-06-14", H: "2026-06-15",
    I: "2026-06-15", J: "2026-06-16", K: "2026-06-16", L: "2026-06-17"
  };

  const matchups = [[0,1],[2,3],[0,2],[1,3],[0,3],[1,2]];

  Object.entries(WC2026_TEAMS).forEach(([group, teams]) => {
    matchups.forEach(([i, j], round) => {
      const date = new Date(groupStartDates[group]);
      date.setDate(date.getDate() + Math.floor(round / 2) * 3);
      games.push({
        id: `G${String(gameId++).padStart(3,'0')}`,
        group,
        stage: "group",
        round: Math.floor(round / 2) + 1,
        home: teams[i].id,
        homeName: teams[i].name,
        homeNameEn: teams[i].nameEn,
        homeFlag: teams[i].flag,
        away: teams[j].id,
        awayName: teams[j].name,
        awayNameEn: teams[j].nameEn,
        awayFlag: teams[j].flag,
        date: date.toISOString().split('T')[0],
        result: null
      });
    });
  });
  return games;
}

// Knockout stage placeholders
const KNOCKOUT_GAMES = [
  // Round of 32 (16 games)
  ...Array.from({length: 16}, (_, i) => ({
    id: `R32-${String(i+1).padStart(2,'0')}`,
    stage: "round32",
    label: `Jogo ${i+1}`,
    labelEn: `Match ${i+1}`,
    home: "TBD", homeName: "A definir", homeNameEn: "TBD", homeFlag: "🏳️",
    away: "TBD", awayName: "A definir", awayNameEn: "TBD", awayFlag: "🏳️",
    date: "2026-07-01",
    result: null
  })),
  // Round of 16
  ...Array.from({length: 8}, (_, i) => ({
    id: `R16-${String(i+1).padStart(2,'0')}`,
    stage: "round16",
    label: `Oitavas ${i+1}`,
    labelEn: `R16 Match ${i+1}`,
    home: "TBD", homeName: "A definir", homeNameEn: "TBD", homeFlag: "🏳️",
    away: "TBD", awayName: "A definir", awayNameEn: "TBD", awayFlag: "🏳️",
    date: "2026-07-08",
    result: null
  })),
  // Quarterfinals
  ...Array.from({length: 4}, (_, i) => ({
    id: `QF-${i+1}`,
    stage: "quarterfinal",
    label: `Quartas ${i+1}`,
    labelEn: `Quarterfinal ${i+1}`,
    home: "TBD", homeName: "A definir", homeNameEn: "TBD", homeFlag: "🏳️",
    away: "TBD", awayName: "A definir", awayNameEn: "TBD", awayFlag: "🏳️",
    date: "2026-07-14",
    result: null
  })),
  // Semifinals
  { id: "SF-1", stage: "semifinal", label: "Semi 1", labelEn: "Semi 1", home: "TBD", homeName: "A definir", homeNameEn: "TBD", homeFlag: "🏳️", away: "TBD", awayName: "A definir", awayNameEn: "TBD", awayFlag: "🏳️", date: "2026-07-18", result: null },
  { id: "SF-2", stage: "semifinal", label: "Semi 2", labelEn: "Semi 2", home: "TBD", homeName: "A definir", homeNameEn: "TBD", homeFlag: "🏳️", away: "TBD", awayName: "A definir", awayNameEn: "TBD", awayFlag: "🏳️", date: "2026-07-19", result: null },
  // 3rd place
  { id: "3PL", stage: "third_place", label: "3º Lugar", labelEn: "3rd Place", home: "TBD", homeName: "A definir", homeNameEn: "TBD", homeFlag: "🏳️", away: "TBD", awayName: "A definir", awayNameEn: "TBD", awayFlag: "🏳️", date: "2026-07-22", result: null },
  // Final
  { id: "FIN", stage: "final", label: "Final", labelEn: "Final", home: "TBD", homeName: "A definir", homeNameEn: "TBD", homeFlag: "🏳️", away: "TBD", awayName: "A definir", awayNameEn: "TBD", awayFlag: "🏳️", date: "2026-07-26", result: null },
];

const GROUP_GAMES = generateGroupGames();
const ALL_GAMES = [...GROUP_GAMES, ...KNOCKOUT_GAMES];

function getGamesByGroup(group) {
  return GROUP_GAMES.filter(g => g.group === group);
}

function getTeamById(id) {
  return ALL_TEAMS.find(t => t.id === id);
}

function getTeamName(id, lang = 'pt') {
  const team = getTeamById(id);
  if (!team) return id;
  return lang === 'en' ? team.nameEn : team.name;
}

function formatDate(dateStr, lang = 'pt') {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US', { month: 'short', day: 'numeric' });
}

// Stage labels
const STAGE_LABELS = {
  pt: { group: "Fase de Grupos", round32: "Rodada de 32", round16: "Oitavas de Final", quarterfinal: "Quartas de Final", semifinal: "Semifinais", third_place: "3º Lugar", final: "Final" },
  en: { group: "Group Stage", round32: "Round of 32", round16: "Round of 16", quarterfinal: "Quarterfinals", semifinal: "Semifinals", third_place: "3rd Place", final: "Final" }
};

// ── WC 2026 Player Roster ─────────────────────────────────────────────────
// Notable players per qualified team — used for the Artilheiro dropdown
const WC2026_PLAYERS = [
  // Albania (alb)
  { name: "Armando Broja",       nameEn: "Armando Broja",       team: "alb" },
  { name: "Rey Manaj",           nameEn: "Rey Manaj",           team: "alb" },
  { name: "Sokol Cikalleshi",    nameEn: "Sokol Cikalleshi",    team: "alb" },
  // Argentina (arg)
  { name: "Lionel Messi",        nameEn: "Lionel Messi",        team: "arg" },
  { name: "Lautaro Martínez",    nameEn: "Lautaro Martínez",    team: "arg" },
  { name: "Julián Álvarez",      nameEn: "Julián Álvarez",      team: "arg" },
  { name: "Rodrigo De Paul",     nameEn: "Rodrigo De Paul",     team: "arg" },
  { name: "Alexis Mac Allister", nameEn: "Alexis Mac Allister", team: "arg" },
  // Australia (aus)
  { name: "Mathew Leckie",       nameEn: "Mathew Leckie",       team: "aus" },
  { name: "Mitchell Duke",       nameEn: "Mitchell Duke",       team: "aus" },
  { name: "Harry Souttar",       nameEn: "Harry Souttar",       team: "aus" },
  // Belgium (bel)
  { name: "Kevin De Bruyne",     nameEn: "Kevin De Bruyne",     team: "bel" },
  { name: "Romelu Lukaku",       nameEn: "Romelu Lukaku",       team: "bel" },
  { name: "Lois Openda",         nameEn: "Lois Openda",         team: "bel" },
  // Brazil (bra)
  { name: "Vinicius Jr.",        nameEn: "Vinicius Jr.",        team: "bra" },
  { name: "Rodrygo",             nameEn: "Rodrygo",             team: "bra" },
  { name: "Endrick",             nameEn: "Endrick",             team: "bra" },
  { name: "Raphinha",            nameEn: "Raphinha",            team: "bra" },
  { name: "Bruno Guimarães",     nameEn: "Bruno Guimarães",     team: "bra" },
  // Cameroon (cmr)
  { name: "Eric Maxim Choupo-Moting",           nameEn: "Eric Maxim Choupo-Moting",    team: "cmr" },
  { name: "André-Frank Zambo Anguissa",          nameEn: "André-Frank Zambo Anguissa",  team: "cmr" },
  { name: "Vincent Aboubakar",                   nameEn: "Vincent Aboubakar",           team: "cmr" },
  // Canada (can)
  { name: "Alphonso Davies",     nameEn: "Alphonso Davies",     team: "can" },
  { name: "Jonathan David",      nameEn: "Jonathan David",      team: "can" },
  { name: "Cyle Larin",          nameEn: "Cyle Larin",          team: "can" },
  // Chile (chi)
  { name: "Alexis Sánchez",      nameEn: "Alexis Sánchez",      team: "chi" },
  { name: "Eduardo Vargas",      nameEn: "Eduardo Vargas",      team: "chi" },
  // Colombia (col)
  { name: "Luis Díaz",           nameEn: "Luis Díaz",           team: "col" },
  { name: "James Rodríguez",     nameEn: "James Rodríguez",     team: "col" },
  { name: "Falcao García",       nameEn: "Radamel Falcao",      team: "col" },
  // Costa Rica (cri)
  { name: "Joel Campbell",       nameEn: "Joel Campbell",       team: "cri" },
  { name: "Bryan Ruiz",          nameEn: "Bryan Ruiz",          team: "cri" },
  // Croatia (cro)
  { name: "Luka Modrić",         nameEn: "Luka Modrić",         team: "cro" },
  { name: "Ivan Perišić",        nameEn: "Ivan Perišić",        team: "cro" },
  { name: "Mateo Kovačić",       nameEn: "Mateo Kovačić",       team: "cro" },
  // Denmark (den)
  { name: "Christian Eriksen",   nameEn: "Christian Eriksen",   team: "den" },
  { name: "Pierre-Emile Højbjerg", nameEn: "Pierre-Emile Højbjerg", team: "den" },
  { name: "Rasmus Højlund",      nameEn: "Rasmus Højlund",      team: "den" },
  // Ecuador (mex2 — team id used in data)
  { name: "Enner Valencia",      nameEn: "Enner Valencia",      team: "mex2" },
  { name: "Moisés Caicedo",      nameEn: "Moisés Caicedo",      team: "mex2" },
  { name: "Gonzalo Plata",       nameEn: "Gonzalo Plata",       team: "mex2" },
  // Egypt (egy)
  { name: "Mohamed Salah",       nameEn: "Mohamed Salah",       team: "egy" },
  { name: "Mostafa Mohamed",     nameEn: "Mostafa Mohamed",     team: "egy" },
  // England (eng)
  { name: "Jude Bellingham",     nameEn: "Jude Bellingham",     team: "eng" },
  { name: "Harry Kane",          nameEn: "Harry Kane",          team: "eng" },
  { name: "Phil Foden",          nameEn: "Phil Foden",          team: "eng" },
  { name: "Bukayo Saka",         nameEn: "Bukayo Saka",         team: "eng" },
  { name: "Cole Palmer",         nameEn: "Cole Palmer",         team: "eng" },
  // France (fra)
  { name: "Kylian Mbappé",       nameEn: "Kylian Mbappé",       team: "fra" },
  { name: "Antoine Griezmann",   nameEn: "Antoine Griezmann",   team: "fra" },
  { name: "Ousmane Dembélé",     nameEn: "Ousmane Dembélé",     team: "fra" },
  { name: "Marcus Thuram",       nameEn: "Marcus Thuram",       team: "fra" },
  // Georgia (geo)
  { name: "Khvicha Kvaratskhelia", nameEn: "Khvicha Kvaratskhelia", team: "geo" },
  { name: "Georges Mikautadze",  nameEn: "Georges Mikautadze",  team: "geo" },
  // Germany (ger)
  { name: "Florian Wirtz",       nameEn: "Florian Wirtz",       team: "ger" },
  { name: "Jamal Musiala",       nameEn: "Jamal Musiala",       team: "ger" },
  { name: "Kai Havertz",         nameEn: "Kai Havertz",         team: "ger" },
  { name: "Leroy Sané",          nameEn: "Leroy Sané",          team: "ger" },
  { name: "Niclas Füllkrug",     nameEn: "Niclas Füllkrug",     team: "ger" },
  // Greece (gre)
  { name: "Vangelis Pavlidis",   nameEn: "Vangelis Pavlidis",   team: "gre" },
  { name: "Kostas Tsimikas",     nameEn: "Kostas Tsimikas",     team: "gre" },
  // Iraq (irq)
  { name: "Amjad Attwan",        nameEn: "Amjad Attwan",        team: "irq" },
  { name: "Ayman Hussein",       nameEn: "Ayman Hussein",       team: "irq" },
  // Ireland (irl)
  { name: "Evan Ferguson",       nameEn: "Evan Ferguson",       team: "irl" },
  { name: "Troy Parrott",        nameEn: "Troy Parrott",        team: "irl" },
  // Italy (ita)
  { name: "Federico Chiesa",     nameEn: "Federico Chiesa",     team: "ita" },
  { name: "Nicolò Barella",      nameEn: "Nicolò Barella",      team: "ita" },
  { name: "Sandro Tonali",       nameEn: "Sandro Tonali",       team: "ita" },
  { name: "Lorenzo Pellegrini",  nameEn: "Lorenzo Pellegrini",  team: "ita" },
  // Ivory Coast (civ)
  { name: "Sébastien Haller",    nameEn: "Sébastien Haller",    team: "civ" },
  { name: "Franck Kessié",       nameEn: "Franck Kessié",       team: "civ" },
  { name: "Nicolas Pépé",        nameEn: "Nicolas Pépé",        team: "civ" },
  // Japan (jap)
  { name: "Takuma Asano",        nameEn: "Takuma Asano",        team: "jap" },
  { name: "Ritsu Doan",          nameEn: "Ritsu Doan",          team: "jap" },
  { name: "Daichi Kamada",       nameEn: "Daichi Kamada",       team: "jap" },
  // Morocco (mar)
  { name: "Achraf Hakimi",       nameEn: "Achraf Hakimi",       team: "mar" },
  { name: "Hakim Ziyech",        nameEn: "Hakim Ziyech",        team: "mar" },
  { name: "Youssef En-Nesyri",   nameEn: "Youssef En-Nesyri",   team: "mar" },
  // Mexico (mex)
  { name: "Hirving Lozano",      nameEn: "Hirving Lozano",      team: "mex" },
  { name: "Raúl Jiménez",        nameEn: "Raúl Jiménez",        team: "mex" },
  { name: "Edson Álvarez",       nameEn: "Edson Álvarez",       team: "mex" },
  { name: "Santiago Giménez",    nameEn: "Santiago Giménez",    team: "mex" },
  // Netherlands (nld)
  { name: "Virgil van Dijk",     nameEn: "Virgil van Dijk",     team: "nld" },
  { name: "Xavi Simons",         nameEn: "Xavi Simons",         team: "nld" },
  { name: "Cody Gakpo",          nameEn: "Cody Gakpo",          team: "nld" },
  { name: "Memphis Depay",       nameEn: "Memphis Depay",       team: "nld" },
  // New Zealand (nzl)
  { name: "Chris Wood",          nameEn: "Chris Wood",          team: "nzl" },
  // Nigeria (nig)
  { name: "Victor Osimhen",      nameEn: "Victor Osimhen",      team: "nig" },
  { name: "Alex Iwobi",          nameEn: "Alex Iwobi",          team: "nig" },
  { name: "Kelechi Iheanacho",   nameEn: "Kelechi Iheanacho",   team: "nig" },
  // Panama (pan)
  { name: "Ismael Díaz",         nameEn: "Ismael Díaz",         team: "pan" },
  { name: "Rolando Blackburn",   nameEn: "Rolando Blackburn",   team: "pan" },
  // Paraguay (par)
  { name: "Miguel Almirón",      nameEn: "Miguel Almirón",      team: "par" },
  { name: "Antonio Sanabria",    nameEn: "Antonio Sanabria",    team: "par" },
  // Peru (per)
  { name: "Gianluca Lapadula",   nameEn: "Gianluca Lapadula",   team: "per" },
  { name: "André Carrillo",      nameEn: "André Carrillo",      team: "per" },
  // Poland (pol)
  { name: "Robert Lewandowski",  nameEn: "Robert Lewandowski",  team: "pol" },
  { name: "Piotr Zieliński",     nameEn: "Piotr Zieliński",     team: "pol" },
  // Portugal (por)
  { name: "Cristiano Ronaldo",   nameEn: "Cristiano Ronaldo",   team: "por" },
  { name: "Bruno Fernandes",     nameEn: "Bruno Fernandes",     team: "por" },
  { name: "Rafael Leão",         nameEn: "Rafael Leão",         team: "por" },
  { name: "Bernardo Silva",      nameEn: "Bernardo Silva",      team: "por" },
  { name: "João Félix",          nameEn: "João Félix",          team: "por" },
  // Puerto Rico (pue)
  { name: "Yamil Asad",          nameEn: "Yamil Asad",          team: "pue" },
  // Saudi Arabia (ksa)
  { name: "Salem Al-Dawsari",    nameEn: "Salem Al-Dawsari",    team: "ksa" },
  { name: "Saleh Al-Shehri",     nameEn: "Saleh Al-Shehri",     team: "ksa" },
  // Senegal (sen)
  { name: "Sadio Mané",          nameEn: "Sadio Mané",          team: "sen" },
  { name: "Ismaïla Sarr",        nameEn: "Ismaïla Sarr",        team: "sen" },
  { name: "Boulaye Dia",         nameEn: "Boulaye Dia",         team: "sen" },
  // Serbia (srb)
  { name: "Dušan Vlahović",      nameEn: "Dušan Vlahović",      team: "srb" },
  { name: "Aleksandar Mitrović", nameEn: "Aleksandar Mitrović", team: "srb" },
  { name: "Sergej Milinković-Savić", nameEn: "Sergej Milinković-Savić", team: "srb" },
  // South Korea (kor)
  { name: "Son Heung-min",       nameEn: "Son Heung-min",       team: "kor" },
  { name: "Lee Kang-in",         nameEn: "Lee Kang-in",         team: "kor" },
  { name: "Hwang Hee-chan",      nameEn: "Hwang Hee-chan",      team: "kor" },
  // Spain (esp)
  { name: "Lamine Yamal",        nameEn: "Lamine Yamal",        team: "esp" },
  { name: "Pedri",               nameEn: "Pedri",               team: "esp" },
  { name: "Gavi",                nameEn: "Gavi",                team: "esp" },
  { name: "Dani Olmo",           nameEn: "Dani Olmo",           team: "esp" },
  { name: "Álvaro Morata",       nameEn: "Álvaro Morata",       team: "esp" },
  // Tunisia (tun)
  { name: "Issam Jebali",        nameEn: "Issam Jebali",        team: "tun" },
  { name: "Wahbi Khazri",        nameEn: "Wahbi Khazri",        team: "tun" },
  // Turkey (tur)
  { name: "Arda Güler",          nameEn: "Arda Güler",          team: "tur" },
  { name: "Hakan Çalhanoğlu",    nameEn: "Hakan Çalhanoğlu",    team: "tur" },
  { name: "Kenan Yıldız",        nameEn: "Kenan Yıldız",        team: "tur" },
  // Ukraine (ukr)
  { name: "Oleksandr Zinchenko", nameEn: "Oleksandr Zinchenko", team: "ukr" },
  { name: "Roman Yaremchuk",     nameEn: "Roman Yaremchuk",     team: "ukr" },
  { name: "Viktor Tsygankov",    nameEn: "Viktor Tsygankov",    team: "ukr" },
  // United States (usa)
  { name: "Christian Pulisic",   nameEn: "Christian Pulisic",   team: "usa" },
  { name: "Tyler Adams",         nameEn: "Tyler Adams",         team: "usa" },
  { name: "Gio Reyna",           nameEn: "Gio Reyna",           team: "usa" },
  { name: "Ricardo Pepi",        nameEn: "Ricardo Pepi",        team: "usa" },
  // Uruguay (uru)
  { name: "Federico Valverde",   nameEn: "Federico Valverde",   team: "uru" },
  { name: "Darwin Núñez",        nameEn: "Darwin Núñez",        team: "uru" },
  { name: "Luis Suárez",         nameEn: "Luis Suárez",         team: "uru" },
  // Uzbekistan (uzb)
  { name: "Eldor Shomurodov",    nameEn: "Eldor Shomurodov",    team: "uzb" },
  { name: "Otabek Shukurov",     nameEn: "Otabek Shukurov",     team: "uzb" },
  // Venezuela (ven)
  { name: "Yangel Herrera",      nameEn: "Yangel Herrera",      team: "ven" },
  { name: "Salomón Rondón",      nameEn: "Salomón Rondón",      team: "ven" },
];

// ── Flag rendering helper (uses flag-icons CSS library) ───────────────────
// Works on all platforms including Windows 10 where emoji flags show as "BR".
// Input: flag emoji ("🇧🇷") or 2-letter ISO code ("BR" or "br").
// Output: <span class="fi fi-br"></span>
function flagHtml(emojiOrCode, cls = '') {
  if (!emojiOrCode) return '';
  const extra = cls ? ` ${cls}` : '';
  // 2-letter code passed directly
  if (/^[A-Za-z]{2}$/.test(emojiOrCode)) {
    return `<span class="fi fi-${emojiOrCode.toLowerCase()}"${extra ? ` class="${extra.trim()}"` : ''}></span>`;
  }
  // Regional Indicator pair (most flags: 🇺🇸 🇧🇷 etc.)
  const pts = [...emojiOrCode].map(c => c.codePointAt(0));
  if (pts[0] >= 0x1F1E6 && pts[0] <= 0x1F1FF && pts.length >= 2) {
    const code = pts.slice(0, 2).map(p => String.fromCharCode(p - 0x1F1E6 + 97)).join('');
    return `<span class="fi fi-${code}"></span>`;
  }
  // Subdivision flags (England 🏴󠁧󠁢󠁥󠁮󠁧󠁿 etc.)
  const SUBDIVISIONS = { '🏴󠁧󠁢󠁥󠁮󠁧󠁿': 'gb-eng', '🏴󠁧󠁢󠁳󠁣󠁴󠁿': 'gb-sct', '🏴󠁧󠁢󠁷󠁬󠁳󠁿': 'gb-wls' };
  const sub = SUBDIVISIONS[emojiOrCode];
  if (sub) return `<span class="fi fi-${sub}"></span>`;
  // Fallback: just return the emoji as-is
  return emojiOrCode;
}

// Helper: build artilheiro select options grouped by team
function buildPlayerOptions(selectEl, lang, savedValue) {
  if (typeof WC2026_PLAYERS === 'undefined') return;
  // Group players by team
  const byTeam = {};
  WC2026_PLAYERS.forEach(p => {
    const team = ALL_TEAMS.find(t => t.id === p.team);
    if (!team) return;
    const key  = team.id;
    if (!byTeam[key]) byTeam[key] = { team, players: [] };
    byTeam[key].players.push(p);
  });
  // Sort teams alphabetically by localised name
  const sorted = Object.values(byTeam).sort((a, b) => {
    const na = lang === 'en' ? a.team.nameEn : a.team.name;
    const nb = lang === 'en' ? b.team.nameEn : b.team.name;
    return na.localeCompare(nb);
  });
  sorted.forEach(({ team, players }) => {
    const og = document.createElement('optgroup');
    og.label = team.flag + ' ' + (lang === 'en' ? team.nameEn : team.name);
    players.sort((a, b) => (lang === 'en' ? a.nameEn : a.name).localeCompare(lang === 'en' ? b.nameEn : b.name))
      .forEach(p => {
        const opt = document.createElement('option');
        const playerName = lang === 'en' ? p.nameEn : p.name;
        opt.value = playerName;
        opt.textContent = playerName;
        og.appendChild(opt);
      });
    selectEl.appendChild(og);
  });
  if (savedValue) selectEl.value = savedValue;
}
