import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// =========================================================================
// การตั้งค่า API และ FIREBASE
// =========================================================================
const CONFIG = {
    API_FOOTBALL_KEY: process.env.API_FOOTBALL_KEY || 'YOUR_RAPIDAPI_FOOTBALL_KEY',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY',
    FIREBASE_DB_URL: 'https://fcmanager-64edb-default-rtdb.asia-southeast1.firebasedatabase.app',
    GITHUB_RAW_BASE: 'https://raw.githubusercontent.com/YOUR_USERNAME/cm-manager-assets/main/crests/',
    OUTPUT_DIR: './output_uefa_54',
    CRESTS_DIR: './output_uefa_54/crests',
    ENABLE_AI_IMAGE_GEN: false
};

// =========================================================================
// ฐานข้อมูลลีกสูงสุดครบทั้ง 54 ประเทศสมาชิก UEFA (720+ สโมสรจริงเต็มตารางลีก)
// =========================================================================
const UEFA_54_NATIONS = [
    {
        code: 'ENG', country: 'England', league: 'Premier League', apiLeagueId: 39, leagueSize: 20, ucl: 4, uel: 2, uecl: 1,
        seedClubs: ['Manchester City', 'Arsenal', 'Liverpool', 'Aston Villa', 'Tottenham Hotspur', 'Chelsea', 'Newcastle United', 'Manchester United', 'West Ham United', 'Crystal Palace', 'Brighton & Hove Albion', 'AFC Bournemouth', 'Fulham', 'Wolverhampton Wanderers', 'Everton', 'Brentford', 'Nottingham Forest', 'Leicester City', 'Ipswich Town', 'Southampton']
    },
    {
        code: 'ESP', country: 'Spain', league: 'La Liga', apiLeagueId: 140, leagueSize: 20, ucl: 4, uel: 2, uecl: 1,
        seedClubs: ['Real Madrid', 'FC Barcelona', 'Girona FC', 'Atletico Madrid', 'Athletic Bilbao', 'Real Sociedad', 'Real Betis', 'Villarreal CF', 'Valencia CF', 'Deportivo Alaves', 'CA Osasuna', 'Getafe CF', 'Celta Vigo', 'Sevilla FC', 'RCD Mallorca', 'UD Las Palmas', 'Rayo Vallecano', 'CD Leganes', 'Real Valladolid', 'RCD Espanyol']
    },
    {
        code: 'ITA', country: 'Italy', league: 'Serie A', apiLeagueId: 135, leagueSize: 20, ucl: 4, uel: 2, uecl: 1,
        seedClubs: ['Inter Milan', 'AC Milan', 'Juventus', 'Atalanta BC', 'Bologna FC', 'AS Roma', 'SS Lazio', 'ACF Fiorentina', 'Torino FC', 'SSC Napoli', 'Genoa CFC', 'AC Monza', 'Hellas Verona', 'US Lecce', 'Udinese Calcio', 'Cagliari Calcio', 'Empoli FC', 'Parma Calcio', 'Como 1907', 'Venezia FC']
    },
    {
        code: 'GER', country: 'Germany', league: 'Bundesliga', apiLeagueId: 78, leagueSize: 18, ucl: 4, uel: 2, uecl: 1,
        seedClubs: ['Bayer Leverkusen', 'VfB Stuttgart', 'Bayern Munich', 'RB Leipzig', 'Borussia Dortmund', 'Eintracht Frankfurt', 'TSG Hoffenheim', '1. FC Heidenheim', 'Werder Bremen', 'SC Freiburg', 'FC Augsburg', 'VfL Wolfsburg', '1. FSV Mainz 05', 'Borussia Monchengladbach', '1. FC Union Berlin', 'VfL Bochum', 'FC St. Pauli', 'Holstein Kiel']
    },
    {
        code: 'FRA', country: 'France', league: 'Ligue 1', apiLeagueId: 61, leagueSize: 18, ucl: 3, uel: 2, uecl: 1,
        seedClubs: ['Paris Saint-Germain', 'AS Monaco', 'Stade Brestois 29', 'Lille OSC', 'OGC Nice', 'Olympique Lyonnais', 'RC Lens', 'Olympique de Marseille', 'Stade de Reims', 'Stade Rennais', 'Toulouse FC', 'Montpellier HSC', 'RC Strasbourg', 'FC Nantes', 'Le Havre AC', 'AJ Auxerre', 'Angers SCO', 'AS Saint-Etienne']
    },
    {
        code: 'NED', country: 'Netherlands', league: 'Eredivisie', apiLeagueId: 88, leagueSize: 18, ucl: 2, uel: 2, uecl: 1,
        seedClubs: ['PSV Eindhoven', 'Feyenoord', 'FC Twente', 'AZ Alkmaar', 'Ajax Amsterdam', 'NEC Nijmegen', 'FC Utrecht', 'Sparta Rotterdam', 'Go Ahead Eagles', 'Fortuna Sittard', 'SC Heerenveen', 'PEC Zwolle', 'Almere City FC', 'Heracles Almelo', 'RKC Waalwijk', 'Willem II', 'FC Groningen', 'NAC Breda']
    },
    {
        code: 'POR', country: 'Portugal', league: 'Primeira Liga', apiLeagueId: 94, leagueSize: 18, ucl: 2, uel: 1, uecl: 2,
        seedClubs: ['Sporting CP', 'SL Benfica', 'FC Porto', 'SC Braga', 'Vitoria de Guimaraes', 'Moreirense FC', 'FC Arouca', 'FC Famalicao', 'Casa Pia AC', 'SC Farense', 'Rio Ave FC', 'Gil Vicente FC', 'GD Estoril Praia', 'CF Estrela Amadora', 'Boavista FC', 'CD Santa Clara', 'CD Nacional', 'AVS Futebol SAD']
    },
    {
        code: 'BEL', country: 'Belgium', league: 'Pro League', apiLeagueId: 144, leagueSize: 16, ucl: 1, uel: 1, uecl: 2,
        seedClubs: ['Club Brugge', 'Union Saint-Gilloise', 'RSC Anderlecht', 'Cercle Brugge', 'KRC Genk', 'Royal Antwerp FC', 'KAA Gent', 'KV Mechelen', 'Sint-Truidense VV', 'Standard Liege', 'KVC Westerlo', 'OH Leuven', 'Sporting Charleroi', 'KV Kortrijk', 'Beerschot VA', 'FCV Dender EH']
    },
    {
        code: 'TUR', country: 'Turkey', league: 'Super Lig', apiLeagueId: 203, leagueSize: 19, ucl: 1, uel: 2, uecl: 1,
        seedClubs: ['Galatasaray', 'Fenerbahce', 'Trabzonspor', 'Istanbul Basaksehir', 'Kasimpasa', 'Besiktas', 'Sivasspor', 'Alanyaspor', 'Caykur Rizespor', 'Antalyaspor', 'Gaziantep FK', 'Adana Demirspor', 'Samsunspor', 'Kayserispor', 'Hatayspor', 'Konyaspor', 'Eyupspor', 'Goztepe', 'Bodrum FK']
    },
    {
        code: 'CZE', country: 'Czech Republic', league: 'Czech First League', apiLeagueId: 345, leagueSize: 16, ucl: 1, uel: 1, uecl: 2,
        seedClubs: ['Sparta Prague', 'Slavia Prague', 'Viktoria Plzen', 'Banik Ostrava', 'FK Mlada Boleslav', '1. FC Slovacko', 'Slovan Liberec', 'Sigma Olomouc', 'FC Hradec Kralove', 'FK Teplice', 'Bohemians 1905', 'FK Jablonec', 'FK Pardubice', 'MFK Karvina', 'SK Dynamo Ceske Budejovice', 'FK Dukla Prague']
    },
    {
        code: 'SCO', country: 'Scotland', league: 'Scottish Premiership', apiLeagueId: 179, leagueSize: 12, ucl: 1, uel: 1, uecl: 2,
        seedClubs: ['Celtic FC', 'Rangers FC', 'Heart of Midlothian', 'Kilmarnock FC', 'St Mirren FC', 'Dundee FC', 'Aberdeen FC', 'Hibernian FC', 'Motherwell FC', 'St Johnstone FC', 'Ross County FC', 'Dundee United']
    },
    {
        code: 'SUI', country: 'Switzerland', league: 'Swiss Super League', apiLeagueId: 207, leagueSize: 12, ucl: 1, uel: 1, uecl: 2,
        seedClubs: ['BSC Young Boys', 'FC Lugano', 'Servette FC', 'FC Zurich', 'FC St. Gallen', 'FC Winterthur', 'FC Luzern', 'FC Basel', 'Yverdon-Sport FC', 'Grasshopper Club Zurich', 'FC Lausanne-Sport', 'FC Sion']
    },
    {
        code: 'AUT', country: 'Austria', league: 'Austrian Bundesliga', apiLeagueId: 218, leagueSize: 12, ucl: 1, uel: 1, uecl: 2,
        seedClubs: ['SK Sturm Graz', 'Red Bull Salzburg', 'LASK Linz', 'SK Rapid Wien', 'TSV Hartberg', 'SK Austria Klagenfurt', 'Wolfsberger AC', 'FK Austria Wien', 'FC Blau-Weiss Linz', 'SCR Altach', 'WSG Tirol', 'Grazer AK']
    },
    {
        code: 'NOR', country: 'Norway', league: 'Eliteserien', apiLeagueId: 103, leagueSize: 16, ucl: 1, uel: 1, uecl: 2,
        seedClubs: ['FK Bodo/Glimt', 'SK Brann', 'Tromso IL', 'Viking FK', 'Molde FK', 'Lillestrom SK', 'Stromsgodset IF', 'Sarpsborg 08', 'Rosenborg BK', 'Odds BK', 'HamKam', 'FK Haugesund', 'Sandefjord Fotball', 'Fredrikstad FK', 'KFUM Oslo', 'Kristiansund BK']
    },
    {
        code: 'GRE', country: 'Greece', league: 'Super League Greece', apiLeagueId: 197, leagueSize: 14, ucl: 1, uel: 1, uecl: 2,
        seedClubs: ['PAOK FC', 'AEK Athens', 'Olympiacos FC', 'Panathinaikos FC', 'Aris Thessaloniki', 'PAS Lamia', 'Asteras Tripolis', 'Atromitos FC', 'Panserraikos FC', 'OFI Crete', 'Volos NFC', 'Panetolikos FC', 'Levadiakos FC', 'Athens Kallithea']
    },
    {
        code: 'DEN', country: 'Denmark', league: 'Danish Superliga', apiLeagueId: 119, leagueSize: 12, ucl: 1, uel: 1, uecl: 2,
        seedClubs: ['FC Midtjylland', 'Brondby IF', 'FC Copenhagen', 'FC Nordsjaelland', 'AGF Aarhus', 'Silkeborg IF', 'Viborg FF', 'Randers FC', 'Vejle Boldklub', 'Lyngby Boldklub', 'Sonderjyske', 'AaB Aalborg']
    },
    {
        code: 'ISR', country: 'Israel', league: 'Israeli Premier League', apiLeagueId: 383, leagueSize: 14, ucl: 1, uel: 0, uecl: 3,
        seedClubs: ['Maccabi Tel Aviv', 'Maccabi Haifa', 'Hapoel Beer Sheva', 'Hapoel Haifa', 'Maccabi Bnei Reineh', 'Bnei Sakhnin', 'Hapoel Jerusalem', 'Maccabi Petah Tikva', 'Maccabi Netanya', 'FC Ashdod', 'Beitar Jerusalem', 'Hapoel Hadera', 'Ironi Kiryat Shmona', 'Ironi Tiberias']
    },
    {
        code: 'UKR', country: 'Ukraine', league: 'Ukrainian Premier League', apiLeagueId: 333, leagueSize: 16, ucl: 1, uel: 1, uecl: 2,
        seedClubs: ['Shakhtar Donetsk', 'Dynamo Kyiv', 'Kryvbas Kryvyi Rih', 'Dnipro-1', 'Polissya Zhytomyr', 'Rukh Lviv', 'LNZ Cherkasy', 'FC Oleksandriya', 'Vorskla Poltava', 'Zorya Luhansk', 'Kolos Kovalivka', 'Chornomorets Odesa', 'Veres Rivne', 'Obolon Kyiv', 'Inhulets Petrove', 'Karpaty Lviv']
    },
    {
        code: 'SRB', country: 'Serbia', league: 'Serbian SuperLiga', apiLeagueId: 286, leagueSize: 16, ucl: 1, uel: 1, uecl: 2,
        seedClubs: ['Red Star Belgrade', 'Partizan Belgrade', 'FK TSC Backa Topola', 'FK Vojvodina', 'Radnicki 1923', 'FK Cukaricki', 'Mladost Lucani', 'Napredak Krusevac', 'Novi Pazar', 'Spartak Subotica', 'FK Vozdovac', 'Radnicki Nis', 'IMT Novi Beograd', 'Zeleznicar Pancevo', 'OFK Beograd', 'Jedinstvo Ub']
    },
    {
        code: 'CRO', country: 'Croatia', league: 'HNL', apiLeagueId: 210, leagueSize: 10, ucl: 1, uel: 0, uecl: 3,
        seedClubs: ['Dinamo Zagreb', 'HNK Rijeka', 'Hajduk Split', 'NK Osijek', 'NK Lokomotiva Zagreb', 'NK Varazdin', 'HNK Gorica', 'NK Istra 1961', 'NK Slaven Belupo', 'HNK Sibenik']
    },
    {
        code: 'POL', country: 'Poland', league: 'Ekstraklasa', apiLeagueId: 106, leagueSize: 18, ucl: 1, uel: 0, uecl: 3,
        seedClubs: ['Jagiellonia Bialystok', 'Slask Wroclaw', 'Legia Warsaw', 'Pogon Szczecin', 'Lech Poznan', 'Gornik Zabrze', 'Rakow Czestochowa', 'Zaglebie Lubin', 'Widzew Lodz', 'Piast Gliwice', 'Stal Mielec', 'Puszcza Niepolomice', 'Cracovia', 'Korona Kielce', 'Radomiak Radom', 'Lechia Gdansk', 'GKS Katowice', 'Motor Lublin']
    },
    {
        code: 'CYP', country: 'Cyprus', league: 'Cypriot First Division', apiLeagueId: 318, leagueSize: 14, ucl: 1, uel: 0, uecl: 3,
        seedClubs: ['APOEL Nicosia', 'AEK Larnaca', 'Omonia Nicosia', 'Aris Limassol', 'Pafos FC', 'Anorthosis Famagusta', 'Apollon Limassol', 'AEL Limassol', 'Nea Salamis Famagusta', 'Ethnikos Achna', 'Karmiotissa FC', 'Omonia Aradippou', 'EN Paralimni', 'Omonia 29M']
    },
    {
        code: 'HUN', country: 'Hungary', league: 'NB I', apiLeagueId: 271, leagueSize: 12, ucl: 1, uel: 0, uecl: 3,
        seedClubs: ['Ferencvarosi TC', 'Paksi FC', 'Puskas Akademia', 'Fehervar FC', 'Debreceni VSC', 'Kecskemeti TE', 'Diosgyori VTK', 'MTK Budapest', 'Zalaegerszegi TE', 'Ujpest FC', 'Nyiregyhaza Spartacus', 'Esztergom ETO FC Gyori']
    },
    {
        code: 'SWE', country: 'Sweden', league: 'Allsvenskan', apiLeagueId: 113, leagueSize: 16, ucl: 1, uel: 0, uecl: 3,
        seedClubs: ['Malmo FF', 'IF Elfsborg', 'BK Hacken', 'Djurgardens IF', 'IFK Varnamo', 'Kalmar FF', 'Hammarby IF', 'IK Sirius', 'IFK Norrkoping', 'Mjallby AIF', 'AIK Stockholm', 'Halmstads BK', 'IFK Goteborg', 'IF Brommapojkarna', 'Vasteras SK', 'GAIS']
    },
    {
        code: 'ROU', country: 'Romania', league: 'Liga I', apiLeagueId: 283, leagueSize: 16, ucl: 1, uel: 0, uecl: 3,
        seedClubs: ['FCSB', 'CFR Cluj', 'Universitatea Craiova', 'Farul Constanta', 'Sepsi OSK', 'Rapid Bucharest', 'UTA Arad', 'Otelul Galati', 'FC Hermannstadt', 'Universitatea Cluj', 'Petrolul Ploiesti', 'Politehnica Iasi', 'FC Botosani', 'Dinamo Bucharest', 'Unirea Slobozia', 'Gloria Buzau']
    },
    {
        code: 'BUL', country: 'Bulgaria', league: 'First League', apiLeagueId: 172, leagueSize: 16, ucl: 1, uel: 0, uecl: 3,
        seedClubs: ['Ludogorets Razgrad', 'Cherno More Varna', 'CSKA Sofia', 'Levski Sofia', 'Lokomotiv Plovdiv', 'CSKA 1948 Sofia', 'Krumovgrad', 'Arda Kardzhali', 'Botev Plovdiv', 'Slavia Sofia', 'Beroe Stara Zagora', 'Hebar Pazardzhik', 'Lokomotiv Sofia', 'Botev Vratsa', 'Spartak Varna', 'Septemvri Sofia']
    },
    {
        code: 'AZE', country: 'Azerbaijan', league: 'Premyer Liqa', apiLeagueId: 419, leagueSize: 10, ucl: 1, uel: 0, uecl: 3,
        seedClubs: ['Qarabag FK', 'Zira FK', 'Sabah FC', 'Sumgayit FK', 'Neftchi Baku', 'Turan Tovuz', 'Araz-Nakhchivan', 'Kapaz PFK', 'Sabail FK', 'Shamakhi FK']
    },
    {
        code: 'SVK', country: 'Slovakia', league: 'Nike Liga', apiLeagueId: 332, leagueSize: 12, ucl: 1, uel: 0, uecl: 3,
        seedClubs: ['Slovan Bratislava', 'DAC 1904 Dunajska Streda', 'Spartak Trnava', 'MSK Zilina', 'MFK Ruzomberok', 'FK Zeleziarne Podbrezova', 'AS Trencin', 'MFK Dukla Banska Bystrica', 'MFK Skalica', 'FC Kosice', 'MFK Zemplin Michalovce', 'KFC Komarno']
    },
    {
        code: 'SVN', country: 'Slovenia', league: 'PrvaLiga', apiLeagueId: 373, leagueSize: 10, ucl: 1, uel: 0, uecl: 3,
        seedClubs: ['NK Celje', 'NK Maribor', 'Olimpija Ljubljana', 'NK Bravo', 'FC Koper', 'NS Mura', 'NK Domzale', 'NK Radomlje', 'ND Primorje', 'NK Nafta 1903']
    },
    {
        code: 'MDA', country: 'Moldova', league: 'Super Liga', apiLeagueId: 394, leagueSize: 8, ucl: 1, uel: 0, uecl: 3,
        seedClubs: ['Petrocub Hincesti', 'Sheriff Tiraspol', 'Zimbru Chisinau', 'Milsami Orhei', 'CSF Balti', 'Dacia Buiucani', 'FC Floresti', 'CSF Spartanii Sportul']
    },
    {
        code: 'KOS', country: 'Kosovo', league: 'Superleague of Kosovo', apiLeagueId: 664, leagueSize: 10, ucl: 1, uel: 0, uecl: 3,
        seedClubs: ['FC Ballkani', 'KF Llapi', 'FC Drita', 'KF Malisheva', 'FC Prishtina', 'KF Dukagjini', 'SC Gjilani', 'KF Feronikeli 74', 'FC Suhareka', 'KF Ferizaj']
    },
    {
        code: 'KAZ', country: 'Kazakhstan', league: 'Premier League', apiLeagueId: 389, leagueSize: 13, ucl: 1, uel: 0, uecl: 3,
        seedClubs: ['FC Ordabasy', 'FC Astana', 'FC Aktobe', 'Kairat Almaty', 'Kyzylzhar SK', 'Kaisar Kyzylorda', 'FC Atyrau', 'FC Tobol', 'Zhenis Astana', 'Zhetysu Taldykorgan', 'Shakhter Karagandy', 'FC Turan', 'Elimai Semey']
    },
    {
        code: 'FIN', country: 'Finland', league: 'Veikkausliiga', apiLeagueId: 244, leagueSize: 12, ucl: 1, uel: 0, uecl: 3,
        seedClubs: ['HJK Helsinki', 'KuPS Kuopio', 'VPS Vaasa', 'SJK Seinajoki', 'FC Honka', 'FC Inter Turku', 'AC Oulu', 'FC Haka', 'FC Lahti', 'IFK Mariehamn', 'FC Ilves', 'Ekenas IF']
    },
    {
        code: 'IRL', country: 'Republic of Ireland', league: 'Premier Division', apiLeagueId: 357, leagueSize: 10, ucl: 1, uel: 0, uecl: 3,
        seedClubs: ['Shamrock Rovers', 'Derry City', 'St Patricks Athletic', 'Shelbourne FC', 'Dundalk FC', 'Bohemian FC', 'Drogheda United', 'Sligo Rovers', 'Galway United', 'Waterford FC']
    },
    {
        code: 'ARM', country: 'Armenia', league: 'Premier League', apiLeagueId: 342, leagueSize: 11, ucl: 1, uel: 0, uecl: 3,
        seedClubs: ['FC Pyunik', 'FC Noah', 'Ararat-Armenia', 'Urartu FC', 'Alashkert FC', 'FC Ararat Yerevan', 'FC West Armenia', 'FC Shirak', 'FC Van', 'BKMA Yerevan', 'FC Gandzasar']
    },
    {
        code: 'LVA', country: 'Latvia', league: 'Virsliga', apiLeagueId: 365, leagueSize: 10, ucl: 1, uel: 0, uecl: 3,
        seedClubs: ['FC RFS', 'Riga FC', 'FK Auda', 'Valmiera FC', 'FK Liepaja', 'FS Jelgava', 'BFC Daugavpils', 'FK Tukums 2000', 'FK Metta', 'Grobinas SC']
    },
    {
        code: 'FRO', country: 'Faroe Islands', league: 'Betri Deildin', apiLeagueId: 367, leagueSize: 10, ucl: 1, uel: 0, uecl: 3,
        seedClubs: ['KI Klaksvik', 'Vikingur Gota', 'HB Torshavn', 'B36 Torshavn', '07 Vestur', 'EB/Streymur', 'B68 Toftir', 'IF Fuglafjordur', 'NSI Runavik', 'Skala IF']
    },
    {
        code: 'BIH', country: 'Bosnia & Herzegovina', league: 'Premijer Liga', apiLeagueId: 315, leagueSize: 12, ucl: 1, uel: 0, uecl: 3,
        seedClubs: ['FK Borac Banja Luka', 'HSK Zrinjski Mostar', 'FK Velez Mostar', 'FK Sarajevo', 'HSK Posusje', 'FK Zeljeznicar', 'NK Siroki Brijeg', 'FK Sloga Meridian', 'FK Igman Konjic', 'NK GOSK Gabela', 'FK Sloboda Tuzla', 'FK Radnik Bijeljina']
    },
    {
        code: 'LIE', country: 'Liechtenstein', league: 'Liechtenstein Championship', apiLeagueId: 0, leagueSize: 7, ucl: 0, uel: 0, uecl: 1,
        seedClubs: ['FC Vaduz', 'USV Eschen/Mauren', 'FC Balzers', 'FC Ruggell', 'FC Schaan', 'FC Triesen', 'FC Triesenberg']
    },
    {
        code: 'ISL', country: 'Iceland', league: 'Besta deild karla', apiLeagueId: 164, leagueSize: 12, ucl: 1, uel: 0, uecl: 3,
        seedClubs: ['Vikingur Reykjavik', 'Valur Reykjavik', 'Stjarnan', 'Breidablik', 'FH Hafnarfjordur', 'KR Reykjavik', 'KA Akureyri', 'Fylkir', 'HK Kopavogur', 'Fram Reykjavik', 'IA Akranes', 'Vestri']
    },
    {
        code: 'NIR', country: 'Northern Ireland', league: 'NIFL Premiership', apiLeagueId: 408, leagueSize: 12, ucl: 1, uel: 0, uecl: 3,
        seedClubs: ['Larne FC', 'Linfield FC', 'Cliftonville FC', 'Crusaders FC', 'Glentoran FC', 'Coleraine FC', 'Carrick Rangers', 'Dungannon Swifts', 'Loughgall FC', 'Glenavon FC', 'Ballymena United', 'Portadown FC']
    },
    {
        code: 'LUX', country: 'Luxembourg', league: 'National Division', apiLeagueId: 261, leagueSize: 16, ucl: 1, uel: 0, uecl: 3,
        seedClubs: ['FC Differdange 03', 'Swift Hesperange', 'F91 Dudelange', 'Progres Niederkorn', 'Jeunesse Esch', 'UNA Strassen', 'Victoria Rosport', 'Union Titus Petange', 'FC Mondercange', 'Racing FC Union Luxembourg', 'FC Wiltz 71', 'US Mondorf-les-Bains', 'CS Fola Esch', 'SC Bettembourg', 'FC Rodange 91', 'US Hostert']
    },
    {
        code: 'LTU', country: 'Lithuania', league: 'A Lyga', apiLeagueId: 362, leagueSize: 10, ucl: 1, uel: 0, uecl: 3,
        seedClubs: ['FK Panevezys', 'FK Zalgiris Vilnius', 'FA Siauliai', 'FK Kauno Zalgiris', 'FC Hegelmann', 'FK Banga Gargzdai', 'FK Suduva', 'DFK Dainava', 'FC Dziugas Telsiai', 'FK TransINVEST']
    },
    {
        code: 'MLT', country: 'Malta', league: 'Maltese Premier League', apiLeagueId: 393, leagueSize: 12, ucl: 1, uel: 0, uecl: 3,
        seedClubs: ['Hamrun Spartans', 'Floriana FC', 'Sliema Wanderers', 'Marsaxlokk FC', 'Birkirkara FC', 'Naxxar Lions', 'Hibernians FC', 'Balzan FC', 'Gzira United', 'Mosta FC', 'Melita FC', 'Zabbar St. Patrick']
    },
    {
        code: 'GEO', country: 'Georgia', league: 'Erovnuli Liga', apiLeagueId: 327, leagueSize: 10, ucl: 1, uel: 0, uecl: 3,
        seedClubs: ['Dinamo Batumi', 'Dinamo Tbilisi', 'Torpedo Kutaisi', 'FC Dila Gori', 'FC Samgurali Tskaltubo', 'FC Iberia 1999', 'FC Gagra', 'FC Telavi', 'FC Samtredia', 'FC Kolkheti-1913 Poti']
    },
    {
        code: 'ALB', country: 'Albania', league: 'Kategoria Superiore', apiLeagueId: 310, leagueSize: 10, ucl: 1, uel: 0, uecl: 3,
        seedClubs: ['KF Egnatia', 'Partizani Tirana', 'KF Vllaznia', 'Skenderbeu Korce', 'KF Tirana', 'KF Teuta', 'FC Dinamo City', 'KF Laci', 'AF Elbasani', 'KF Bylis']
    },
    {
        code: 'EST', country: 'Estonia', league: 'Meistriliiga', apiLeagueId: 329, leagueSize: 10, ucl: 1, uel: 0, uecl: 3,
        seedClubs: ['FC Flora Tallinn', 'FCI Levadia Tallinn', 'JK Tallinna Kalev', 'Paide Linnameeskond', 'Nomme Kalju FC', 'JK Vaprus Parnu', 'FC Kuressaare', 'JK Narva Trans', 'Tartu JK Tammeka', 'FC Nomme United']
    },
    {
        code: 'BLR', country: 'Belarus', league: 'Vysshaya Liga', apiLeagueId: 116, leagueSize: 16, ucl: 1, uel: 0, uecl: 3,
        seedClubs: ['Dinamo Minsk', 'Neman Grodno', 'Torpedo-BelAZ Zhodino', 'Isloch Minsk Raion', 'BATE Borisov', 'FC Gomel', 'Slavia Mozyr', 'FC Slutsk', 'FC Minsk', 'Dynamo Brest', 'FC Smorgon', 'Naftan Novopolotsk', 'Shakhtyor Soligorsk', 'Arsenal Dzerzhinsk', 'Dnepr Mogilev', 'FC Vitebsk']
    },
    {
        code: 'MKD', country: 'North Macedonia', league: '1. MFL', apiLeagueId: 371, leagueSize: 12, ucl: 1, uel: 0, uecl: 3,
        seedClubs: ['FC Struga', 'KF Shkendija', 'KF Shkupi', 'GFK Tikves', 'FK Sileks', 'FK Gostivar', 'FK Rabotnicki', 'AP Brera Strumica', 'FK Voska Sport', 'FK Vardar', 'KF Besa Dobri Dol', 'FK Pelister']
    },
    {
        code: 'AND', country: 'Andorra', league: 'Primera Divisio', apiLeagueId: 312, leagueSize: 10, ucl: 1, uel: 0, uecl: 2,
        seedClubs: ['UE Santa Coloma', 'Inter Club d\'Escaldes', 'Atletic Club d\'Escaldes', 'FC Santa Coloma', 'Penya Encarnada', 'FC Ordino', 'FC Pas de la Casa', 'CF Esperanca d\'Andorra', 'FS La Massana', 'FC Rangers']
    },
    {
        code: 'WAL', country: 'Wales', league: 'Cymru Premier', apiLeagueId: 110, leagueSize: 12, ucl: 1, uel: 0, uecl: 2,
        seedClubs: ['The New Saints', 'Connah\'s Quay Nomads', 'Bala Town', 'Cardiff Metropolitan University', 'Newtown AFC', 'Caernarfon Town', 'Penybont FC', 'Haverfordwest County', 'Barry Town United', 'Aberystwyth Town', 'Flint Town United', 'Briton Ferry Llansawel']
    },
    {
        code: 'MNE', country: 'Montenegro', league: '1. CFL', apiLeagueId: 355, leagueSize: 10, ucl: 1, uel: 0, uecl: 2,
        seedClubs: ['FK Decic', 'FK Mornar Bar', 'FK Buducnost Podgorica', 'FK Sutjeska Niksic', 'FK Jezero', 'OFK Petrovac', 'FK Arsenal Tivat', 'FK Jedinstvo Bijelo Polje', 'FK Bokelj', 'FK Otrant-Olympic']
    },
    {
        code: 'GIB', country: 'Gibraltar', league: 'Gibraltar Football League', apiLeagueId: 758, leagueSize: 11, ucl: 1, uel: 0, uecl: 2,
        seedClubs: ['Lincoln Red Imps', 'St Joseph\'s FC', 'FCB Magpies', 'Europa Point FC', 'Mons Calpe SC', 'Manchester 62 FC', 'Lynx FC', 'Glacis United', 'Lions Gibraltar', 'College 1975 FC', 'Europa FC']
    },
    {
        code: 'SMR', country: 'San Marino', league: 'Campionato Sammarinese', apiLeagueId: 404, leagueSize: 16, ucl: 1, uel: 0, uecl: 2,
        seedClubs: ['AC Virtus', 'SP La Fiorita', 'SP Tre Penne', 'SS Cosmos', 'SS Murata', 'AC Juvenes/Dogana', 'FC Fiorentino', 'SP Tre Fiori', 'SS San Giovanni', 'SS Folgore', 'FC Domagnano', 'SC Faetano', 'AC Libertas', 'SS Pennarossa', 'SP Cailungo', 'San Marino Academy U22']
    }
];

// =========================================================================
// 1. ฟังก์ชันดึงรายชื่อสโมสรจริงครบตามจำนวนทีมในลีกสูงสุดของประเทศนั้นๆ
// =========================================================================
async function fetchRealClubsForNation(nation) {
    if (CONFIG.API_FOOTBALL_KEY && CONFIG.API_FOOTBALL_KEY !== 'YOUR_RAPIDAPI_FOOTBALL_KEY' && nation.apiLeagueId > 0) {
        try {
            const res = await fetch(`https://v3.football.api-sports.io/teams?league=${nation.apiLeagueId}&season=2025`, {
                headers: { 'x-apisports-key': CONFIG.API_FOOTBALL_KEY }
            });
            const json = await res.json();
            if (json.response && json.response.length >= nation.leagueSize) {
                return json.response.slice(0, nation.leagueSize).map(item => ({
                    name: item.team.name,
                    short: item.team.code || item.team.name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase(),
                    founded: item.team.founded || 1900,
                    stadium: item.venue?.name || `${item.team.name} Arena`
                }));
            }
        } catch (err) {
            console.warn(`⚠️ ดึง API ของ ${nation.country} ไม่สำเร็จ ใช้รายชื่อเต็มตารางในสคริปต์แทน`);
        }
    }

    // ใช้รายชื่อจริงครบทั้งตารางลีกสูงสุดของแต่ละประเทศ (720+ ทีม)
    return nation.seedClubs.map(clubName => ({
        name: clubName,
        short: clubName.replace(/^(FC|AC|SC|FK|NK|KF|UE|AS|SS|RC|SL|BSC|RSC|HNK|SP|UD|CD|CA|RCD|CF|GD|AVS|KRC|KAA|KV|OH|KVC|FCV|TSG|VfB|VfL|1\.|SC|OGC|AJ|PEC|NEC|RKC|ADO|SBV|MKS|GKS|KS|ZKS|TS|BKS)\s+/i, '')
                       .replace(/[^A-Za-z]/g, '')
                       .slice(0, 3)
                       .toUpperCase()
                       .padEnd(3, 'X'),
        founded: 1885 + (hashSeed(clubName) % 115),
        stadium: `${clubName} Stadium`
    }));
}

// =========================================================================
// 2. ระบบสร้างภาพตราสโมสร AI + FALLBACK SVG GENERATOR อัตโนมัติ 100%
// =========================================================================
function hashSeed(str) {
    const hex = crypto.createHash('md5').update(str).digest('hex');
    return parseInt(hex.slice(0, 8), 16);
}

function generateClubColors(seed) {
    const palette = [
        ['#dc2626', '#ffffff'], ['#1d4ed8', '#facc15'], ['#15803d', '#ffffff'],
        ['#0f172a', '#ef4444'], ['#f8fafc', '#1e3a8a'], ['#ea580c', '#000000'],
        ['#6d28d9', '#facc15'], ['#b91c1c', '#facc15'], ['#0284c7', '#ffffff'],
        ['#facc15', '#0f172a'], ['#7c2d12', '#38bdf8'], ['#065f46', '#fde047'],
        ['#991b1b', '#e2e8f0'], ['#1e40af', '#ffffff'], ['#047857', '#facc15']
    ];
    return palette[seed % palette.length];
}

function buildProceduralSVGCrest(club) {
    const seed = hashSeed(club.id + club.name);
    const [c1, c2] = [club.color, club.textColor];
    const shieldType = seed % 4;
    const patternType = (seed >> 2) % 5;
    const emblemType = (seed >> 5) % 4;

    let shieldPath = 'M50 6 L90 20 L90 52 C90 76 72 90 50 96 C28 90 10 76 10 52 L10 20 Z';
    if (shieldType === 1) shieldPath = 'M50 6 A44 44 0 1 0 50 94 A44 44 0 1 0 50 6 Z';
    else if (shieldType === 2) shieldPath = 'M14 10 H86 L82 58 C78 78 62 90 50 96 C38 90 22 78 18 58 Z';
    else if (shieldType === 3) shieldPath = 'M50 5 L92 18 L86 64 L50 96 L14 64 L8 18 Z';

    let patternSvg = `<rect x="0" y="0" width="100" height="100" fill="${c1}"/>`;
    if (patternType === 1) {
        patternSvg += `<rect x="22" y="0" width="14" height="100" fill="${c2}" opacity="0.88"/>
                       <rect x="44" y="0" width="12" height="100" fill="${c2}" opacity="0.88"/>
                       <rect x="64" y="0" width="14" height="100" fill="${c2}" opacity="0.88"/>`;
    } else if (patternType === 2) {
        patternSvg += `<rect x="50" y="0" width="50" height="100" fill="${c2}" opacity="0.9"/>`;
    } else if (patternType === 3) {
        patternSvg += `<polygon points="0,20 20,0 100,80 80,100" fill="${c2}" opacity="0.9"/>`;
    } else if (patternType === 4) {
        patternSvg += `<rect x="50" y="0" width="50" height="50" fill="${c2}" opacity="0.9"/>
                       <rect x="0" y="50" width="50" height="50" fill="${c2}" opacity="0.9"/>`;
    }

    let topIcon = '';
    if (emblemType === 0) topIcon = `<polygon points="50,15 53,23 62,23 55,28 58,36 50,31 42,36 45,28 38,23 47,23" fill="#facc15" stroke="#000" stroke-width="1"/>`;
    else if (emblemType === 1) topIcon = `<path d="M36 31 L40 20 L46 27 L50 18 L54 27 L60 20 L64 31 Z" fill="#facc15" stroke="#000" stroke-width="1"/>`;
    else if (emblemType === 2) topIcon = `<circle cx="50" cy="25" r="8" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>`;
    else topIcon = `<path d="M38 32 C42 20 58 20 62 32 L55 28 L50 34 L45 28 Z" fill="#facc15" stroke="#000" stroke-width="1"/>`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 100 100">
  <defs><clipPath id="clip_${club.id}"><path d="${shieldPath}"/></clipPath></defs>
  <g clip-path="url(#clip_${club.id})">
    ${patternSvg}
    <rect x="12" y="38" width="76" height="26" rx="4" fill="#06180e" fill-opacity="0.88" stroke="#facc15" stroke-width="1.5"/>
    ${topIcon}
    <text x="50" y="56" text-anchor="middle" fill="#facc15" font-family="monospace" font-weight="bold" font-size="18">${club.short}</text>
    <text x="50" y="77" text-anchor="middle" fill="#ffffff" font-family="monospace" font-weight="bold" font-size="9">EST.${club.founded}</text>
  </g>
  <path d="${shieldPath}" fill="none" stroke="#facc15" stroke-width="3.5"/>
</svg>`;
}

async function generateOrFallbackClubCrest(club) {
    if (CONFIG.ENABLE_AI_IMAGE_GEN && CONFIG.GEMINI_API_KEY && CONFIG.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY') {
        try {
            const prompt = `A 2D vector vintage European football club crest for '${club.name}' (${club.country}), classic shield emblem with gold trim, primary color ${club.color}, secondary color ${club.textColor}, isolated on solid dark background`;
            const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${CONFIG.GEMINI_API_KEY}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ instances: [{ prompt }], parameters: { sampleCount: 1 } })
            });

            if (res.ok) {
                const data = await res.json();
                const b64 = data.predictions?.[0]?.bytesBase64Encoded;
                if (b64) {
                    const pngPath = path.join(CONFIG.CRESTS_DIR, `${club.id}.png`);
                    fs.writeFileSync(pngPath, Buffer.from(b64, 'base64'));
                    return { crestType: 'AI_PNG', crestUrl: `${CONFIG.GITHUB_RAW_BASE}${club.id}.png`, svgFallback: null };
                }
            }
            throw new Error(`AI Image API HTTP ${res.status}`);
        } catch (err) {
            // หากเจนภาพ AI ไม่ได้ สลับไปสร้าง SVG อัตโนมัติทันที
        }
    }

    const svgCode = buildProceduralSVGCrest(club);
    const svgPath = path.join(CONFIG.CRESTS_DIR, `${club.id}.svg`);
    fs.writeFileSync(svgPath, svgCode, 'utf8');

    return {
        crestType: 'PROCEDURAL_SVG',
        crestUrl: `${CONFIG.GITHUB_RAW_BASE}${club.id}.svg`,
        svgFallback: svgCode
    };
}

// =========================================================================
// 3. ฟังก์ชันหลักประมวลผลครบทั้ง 54 ประเทศ (720+ สโมสร) และพุชขึ้น FIREBASE
// =========================================================================
async function main() {
    fs.mkdirSync(CONFIG.CRESTS_DIR, { recursive: true });
    console.log('🚀 เริ่มต้นสร้างฐานข้อมูลลีกสูงสุดครบ 54 ประเทศสมาชิก UEFA (เต็มจำนวนทีมในตารางทุกชาติ)...\n');

    const allClubs = [];
    const groups = ['A', 'B', 'C', 'D'];
    let globalCounter = 0;

    for (let nIdx = 0; nIdx < UEFA_54_NATIONS.length; nIdx++) {
        const nation = UEFA_54_NATIONS[nIdx];
        const rawClubs = await fetchRealClubsForNation(nation);
        const totalMatches = Math.max(12, (rawClubs.length - 1) * 2);

        for (let cIdx = 0; cIdx < rawClubs.length; cIdx++) {
            const rc = rawClubs[cIdx];
            const id = `${nation.code.toLowerCase()}_${rc.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10)}_${cIdx + 1}`;
            const seed = hashSeed(id);
            const [color, textColor] = generateClubColors(seed);

            // โควตาถ้วยยุโรปตามอันดับจริงในลีก
            let cupQuota = 'NONE';
            if (cIdx < nation.ucl) cupQuota = 'UCL';
            else if (cIdx < nation.ucl + nation.uel) cupQuota = 'UEL';
            else if (cIdx < nation.ucl + nation.uel + nation.uecl) cupQuota = 'UECL';

            // เรตติ้งความแข็งแกร่งและงบประมาณแปรผันตามระดับประเทศ + อันดับในตารางลีก
            const nationStrengthBonus = Math.max(0, 18 - Math.floor(nIdx / 3));
            const rankPenalty = Math.round((cIdx / Math.max(1, rawClubs.length - 1)) * 16);
            const tier = Math.min(94, Math.max(60, 76 + nationStrengthBonus - rankPenalty));
            const budget = +Math.max(2.5, (tier - 57) * 1.65).toFixed(1);

            // สถิติตารางลีกจำลองตามอันดับจริง
            const winRatio = Math.max(0.18, 0.78 - (cIdx / rawClubs.length) * 0.58);
            const w = Math.round(totalMatches * winRatio);
            const d = Math.max(2, Math.round((totalMatches - w) * 0.35));
            const l = Math.max(0, totalMatches - w - d);

            const clubObj = {
                id,
                name: rc.name,
                country: nation.country,
                countryCode: nation.code,
                division: nation.league,
                leagueRank: cIdx + 1,
                leagueSize: rawClubs.length,
                short: rc.short,
                founded: rc.founded,
                stadium: rc.stadium,
                color,
                textColor,
                budget,
                tier,
                cupQuota,
                group: groups[globalCounter % 4],
                lgStats: {
                    p: totalMatches,
                    w, d, l,
                    gf: w * 2 + d + 6,
                    ga: l * 2 + d + 4,
                    pts: w * 3 + d
                }
            };

            const crestAsset = await generateOrFallbackClubCrest(clubObj);
            clubObj.crestType = crestAsset.crestType;
            clubObj.crestUrl = crestAsset.crestUrl;
            clubObj.svgFallback = crestAsset.svgFallback;

            allClubs.push(clubObj);
            globalCounter++;
        }
        console.log(`✅ [${String(nIdx + 1).padStart(2, '0')}/54] ${nation.country.padEnd(22)} | ${nation.league.padEnd(26)} | ครบทั้งลีก: ${rawClubs.length} ทีม`);
    }

    const jsonOutputPath = path.join(CONFIG.OUTPUT_DIR, 'uefa_54_nations_master.json');
    fs.writeFileSync(jsonOutputPath, JSON.stringify({
        generatedAt: new Date().toISOString(),
        totalCountries: UEFA_54_NATIONS.length,
        totalClubs: allClubs.length,
        clubs: allClubs
    }, null, 2), 'utf8');

    console.log(`\n🎉 สร้างฐานข้อมูลลีกสูงสุด 54 ประเทศเสร็จสมบูรณ์! รวมทั้งหมด ${UEFA_54_NATIONS.length} ประเทศ / ${allClubs.length} สโมสร`);
    console.log(`📁 ไฟล์ฐานข้อมูล: ${jsonOutputPath}`);

    if (CONFIG.FIREBASE_DB_URL) {
        try {
            console.log(`\n🔥 กำลังซิงก์ข้อมูลทั้งหมด ${allClubs.length} สโมสรขึ้น Firebase...`);
            const fbRes = await fetch(`${CONFIG.FIREBASE_DB_URL}/uefa_54_nations.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    updatedAt: new Date().toISOString(),
                    totalCountries: UEFA_54_NATIONS.length,
                    totalClubs: allClubs.length,
                    clubs: allClubs
                })
            });
            if (!fbRes.ok) throw new Error(`HTTP ${fbRes.status}`);
            console.log(`✅ อัปโหลดทั้ง ${allClubs.length} สโมสรขึ้น Firebase สำเร็จ!`);
        } catch (err) {
            console.error(`❌ อัปโหลดขึ้น Firebase ไม่สำเร็จ: ${err.message}`);
        }
    }
}

main();