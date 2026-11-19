import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// =========================================================================
// การตั้งค่าไฟล์และ FIREBASE
// =========================================================================
const CONFIG = {
    INPUT_CLUBS_JSON: './output_uefa_54/uefa_54_nations_master.json',
    OUTPUT_FULL_JSON: './output_uefa_54/uefa_54_nations_with_players.json',
    FIREBASE_DB_URL: 'https://fcmanager-64edb-default-rtdb.asia-southeast1.firebasedatabase.app',
    SQUAD_SIZE_PER_CLUB: 23 // ไม่น้อยกว่า 22 คน (GK 3, DEF 7, MID 7, FWD 6)
};

// =========================================================================
// ฐานข้อมูลชื่อ-นามสกุลแยกตามกลุ่มภาษาและสัญชาติทั่วโลก
// =========================================================================
const NAME_POOLS = {
    ENG: {
        nation: 'England',
        first: ['Harry', 'Jude', 'Bukayo', 'Cole', 'Declan', 'Phil', 'Marcus', 'Jack', 'Trent', 'Ollie', 'Jarrod', 'Anthony', 'Kobbie', 'Morgan', 'Lewis', 'Callum', 'James', 'Liam', 'Mason', 'Harvey', 'Reece', 'Ben', 'Luke', 'Jordan'],
        last: ['Kane', 'Bellingham', 'Saka', 'Palmer', 'Rice', 'Foden', 'Rashford', 'Grealish', 'Watkins', 'Bowen', 'Gordon', 'Mainoo', 'Rogers', 'Hall', 'Wilson', 'Maddison', 'Ward-Prowse', 'Gallagher', 'White', 'Shaw', 'Pickford', 'Stones', 'Walker', 'Henderson']
    },
    ESP: {
        nation: 'Spain',
        first: ['Lamine', 'Pedri', 'Rodri', 'Dani', 'Nico', 'Alvaro', 'Ferran', 'Mikel', 'Gavi', 'Pau', 'Alejandro', 'Unai', 'Martin', 'Oihan', 'Alex', 'Isco', 'Marco', 'Carlos', 'Sergio', 'David', 'Pablo', 'Yeremy', 'Bryan', 'Hugo'],
        last: ['Yamal', 'Olmo', 'Williams', 'Morata', 'Torres', 'Merino', 'Cubarsi', 'Balde', 'Simon', 'Zubimendi', 'Sancet', 'Baena', 'Asensio', 'Soler', 'Ramos', 'Ruiz', 'Laporte', 'Carvajal', 'Grimaldo', 'Oyarzabal', 'Garcia', 'Lopez', 'Navas', 'Diaz']
    },
    ITA: {
        nation: 'Italy',
        first: ['Nicolo', 'Federico', 'Alessandro', 'Gianluigi', 'Lautaro', 'Lorenzo', 'Matteo', 'Davide', 'Riccardo', 'Andrea', 'Giacomo', 'Marco', 'Sandro', 'Manuel', 'Destiny', 'Giorgio', 'Moise', 'Gianluca', 'Domenico', 'Leonardo', 'Mattia', 'Francesco', 'Pietro', 'Simone'],
        last: ['Barella', 'Dimarco', 'Bastoni', 'Donnarumma', 'Pellegrini', 'Politano', 'Frattesi', 'Calafiori', 'Cambiaso', 'Raspadori', 'Verratti', 'Tonali', 'Locatelli', 'Udogie', 'Scalvini', 'Kean', 'Scamacca', 'Berardi', 'Spinazzola', 'Zaccagni', 'Acerbi', 'Mancini', 'Chiesa', 'Retegui']
    },
    GER: {
        nation: 'Germany',
        first: ['Jamal', 'Florian', 'Kai', 'Joshua', 'Antonio', 'Ilkay', 'Leroy', 'Manuel', 'Niclas', 'Julian', 'Thomas', 'Pascal', 'Robert', 'Jonathan', 'Nico', 'Benjamin', 'Leon', 'Serge', 'Aleksandar', 'Maximilian', 'Deniz', 'Chris', 'Karim', 'Felix'],
        last: ['Musiala', 'Wirtz', 'Havertz', 'Kimmich', 'Rudiger', 'Gundogan', 'Sane', 'Neuer', 'Fullkrug', 'Brandt', 'Muller', 'Gross', 'Andrich', 'Tah', 'Schlotterbeck', 'Henrichs', 'Goretzka', 'Gnabry', 'Pavlovic', 'Beier', 'Undav', 'Fuhrich', 'Adeyemi', 'Nmecha']
    },
    FRA: {
        nation: 'France',
        first: ['Kylian', 'Antoine', 'William', 'Aurelien', 'Eduardo', 'Ousmane', 'Bradley', 'Warren', 'Theo', 'Jules', 'Ibrahima', 'Mike', 'Marcus', 'Randal', 'Adrien', 'NGolo', 'Dayot', 'Benjamin', 'Kingsley', 'Moussa', 'Christopher', 'Rayan', 'Matteo', 'Lucas'],
        last: ['Mbappe', 'Griezmann', 'Saliba', 'Tchouameni', 'Camavinga', 'Dembele', 'Barcola', 'Zaire-Emery', 'Hernandez', 'Kounde', 'Konate', 'Maignan', 'Thuram', 'Kolo Muani', 'Rabiot', 'Kante', 'Upamecano', 'Pavard', 'Coman', 'Diaby', 'Nkunku', 'Cherki', 'Guendouzi', 'Chevalier']
    },
    POR: {
        nation: 'Portugal',
        first: ['Bruno', 'Bernardo', 'Ruben', 'Rafael', 'Vitinha', 'Joao', 'Diogo', 'Nuno', 'Pedro', 'Goncalo', 'Francisco', 'Matheus', 'Otavio', 'Antonio', 'Renato', 'Palhinha', 'Nelson', 'Geovany', 'Rodrigo', 'Tiago', 'Andre', 'Ricardo', 'Tomas', 'Fabio'],
        last: ['Fernandes', 'Silva', 'Dias', 'Leao', 'Neves', 'Felix', 'Jota', 'Mendes', 'Neto', 'Ramos', 'Conceicao', 'Nunes', 'Inacio', 'Costa', 'Dalot', 'Semedo', 'Quenda', 'Mora', 'Almeida', 'Horta', 'Pereira', 'Vieira', 'Trincao', 'Cancelo']
    },
    NED: {
        nation: 'Netherlands',
        first: ['Virgil', 'Frenkie', 'Cody', 'Xavi', 'Tijjani', 'Matthijs', 'Nathan', 'Denzel', 'Jeremie', 'Ryan', 'Joey', 'Jerdy', 'Brian', 'Wout', 'Jurrien', 'Micky', 'Teun', 'Lutsharel', 'Quinten', 'Steven', 'Joshua', 'Bart', 'Donyell', 'Jorrel'],
        last: ['van Dijk', 'de Jong', 'Gakpo', 'Simons', 'Reijnders', 'de Ligt', 'Ake', 'Dumfries', 'Frimpong', 'Gravenberch', 'Veerman', 'Schouten', 'Brobbey', 'Weghorst', 'Timber', 'van de Ven', 'Koopmeiners', 'Geertruida', 'Bergwijn', 'Zirkzee', 'Verbruggen', 'Malen', 'Hato', 'Depay']
    },
    NORDIC: {
        nation: 'Norway',
        first: ['Erling', 'Martin', 'Alexander', 'Viktor', 'Dejan', 'Rasmus', 'Christian', 'Pierre-Emile', 'Kasper', 'Morten', 'Patrick', 'Jens', 'Sander', 'Oscar', 'Andreas', 'Joachim', 'Mikkel', 'Jonas', 'Emil', 'Gustav', 'Lukas', 'Roony', 'Hugo', 'Sebastian'],
        last: ['Haaland', 'Odegaard', 'Isak', 'Gyokeres', 'Kulusevski', 'Hojlund', 'Eriksen', 'Hojbjerg', 'Schmeichel', 'Hjulmand', 'Berg', 'Hauge', 'Berge', 'Bobb', 'Christensen', 'Andersen', 'Damsgaard', 'Wind', 'Forsberg', 'Lindelof', 'Elanga', 'Bardghji', 'Larsson', 'Nanasi']
    },
    EASTERN: {
        nation: 'Poland',
        first: ['Robert', 'Piotr', 'Luka', 'Mateo', 'Josko', 'Dominik', 'Dusan', 'Sergej', 'Aleksandar', 'Mykhaylo', 'Georgiy', 'Artem', 'Tomas', 'Patrik', 'Milan', 'Stanislav', 'Jan', 'Benjamin', 'Nicolae', 'Radu', 'Kiril', 'Hristo', 'Filip', 'Ivan'],
        last: ['Lewandowski', 'Zielinski', 'Modric', 'Kovacic', 'Gvardiol', 'Szoboszlai', 'Vlahovic', 'Milinkovic-Savic', 'Mitrovic', 'Mudryk', 'Sudakov', 'Dovbyk', 'Soucek', 'Schick', 'Skriniar', 'Lobotka', 'Oblak', 'Sesko', 'Stanciu', 'Dragusin', 'Despodov', 'Kostic', 'Perisic', 'Zalewski']
    },
    BALKAN_TUR: {
        nation: 'Turkey',
        first: ['Hakan', 'Arda', 'Kenan', 'Ferdi', 'Orkun', 'Baris', 'Kerem', 'Merih', 'Caglar', 'Altay', 'Ugurcan', 'Kostas', 'Vangelis', 'Fotis', 'Christos', 'Dimitris', 'Giorgos', 'Anastasios', 'Edin', 'Miralem', 'Ermedin', 'Amar', 'Eljif', 'Enis'],
        last: ['Calhanoglu', 'Guler', 'Yildiz', 'Kadioglu', 'Kokcu', 'Yilmaz', 'Akturkoglu', 'Demiral', 'Soyuncu', 'Bayindir', 'Cakir', 'Tsimikas', 'Pavlidis', 'Ioannidis', 'Tzolis', 'Pelkas', 'Masouras', 'Bakasetas', 'Dzeko', 'Pjanic', 'Demirovic', 'Dedic', 'Elmas', 'Bardhi']
    },
    BRA_ARG: {
        nation: 'Brazil',
        first: ['Vinicius', 'Rodrygo', 'Raphinha', 'Bruno', 'Gabriel', 'Endrick', 'Savinho', 'Alisson', 'Ederson', 'Marquinhos', 'Eder', 'Lucas', 'Lautaro', 'Julian', 'Alexis', 'Enzo', 'Cristian', 'Lisandro', 'Emiliano', 'Rodrigo', 'Alejandro', 'Paulo', 'Franco', 'Valentín'],
        last: ['Junior', 'Guimaraes', 'Martinelli', 'Magalhaes', 'Militao', 'Paqueta', 'Douglas Luiz', 'Bremer', 'Joelinton', 'Cunha', 'Joao Pedro', 'Martinez', 'Alvarez', 'Mac Allister', 'Fernandez', 'Romero', 'De Paul', 'Garnacho', 'Dybala', 'Mastantuono', 'Carboni', 'Barco', 'Paz', 'Lo Celso']
    }
};

// จับคู่รหัสประเทศ UEFA 54 ประเทศกับกลุ่มชื่อนักเตะท้องถิ่น
const COUNTRY_TO_POOL = {
    ENG: 'ENG', SCO: 'ENG', WAL: 'ENG', NIR: 'ENG', IRL: 'ENG', GIB: 'ENG',
    ESP: 'ESP', POR: 'POR', AND: 'ESP',
    ITA: 'ITA', SMR: 'ITA', MLT: 'ITA',
    GER: 'GER', AUT: 'GER', SUI: 'GER', LIE: 'GER',
    FRA: 'FRA', BEL: 'FRA', LUX: 'FRA',
    NED: 'NED',
    NOR: 'NORDIC', SWE: 'NORDIC', DEN: 'NORDIC', FIN: 'NORDIC', ISL: 'NORDIC', FRO: 'NORDIC',
    POL: 'EASTERN', CZE: 'EASTERN', SVK: 'EASTERN', HUN: 'EASTERN', UKR: 'EASTERN', BLR: 'EASTERN',
    CRO: 'EASTERN', SRB: 'EASTERN', SVN: 'EASTERN', ROU: 'EASTERN', MDA: 'EASTERN', LTU: 'EASTERN', LVA: 'EASTERN', EST: 'EASTERN', KAZ: 'EASTERN',
    TUR: 'BALKAN_TUR', GRE: 'BALKAN_TUR', CYP: 'BALKAN_TUR', BIH: 'BALKAN_TUR', ALB: 'BALKAN_TUR', KOS: 'BALKAN_TUR', MKD: 'BALKAN_TUR', MNE: 'BALKAN_TUR', BUL: 'BALKAN_TUR', GEO: 'BALKAN_TUR', ARM: 'BALKAN_TUR', AZE: 'BALKAN_TUR', ISR: 'BALKAN_TUR'
};

// นักเตะซูเปอร์สตาร์จริงของสโมสรดัง (คงไว้ให้ครบแล้วเติมจนครบ 23 คน)
const REAL_CLUB_STARS = {
    'Manchester City': ['Ederson', 'Kyle Walker', 'Ruben Dias', 'Josko Gvardiol', 'Rodri', 'Kevin De Bruyne', 'Bernardo Silva', 'Phil Foden', 'Erling Haaland', 'Jeremy Doku', 'Savinho'],
    'Arsenal': ['David Raya', 'Ben White', 'William Saliba', 'Gabriel Magalhaes', 'Declan Rice', 'Martin Odegaard', 'Mikel Merino', 'Bukayo Saka', 'Kai Havertz', 'Gabriel Martinelli', 'Jurrien Timber'],
    'Liverpool': ['Alisson Becker', 'Trent Alexander-Arnold', 'Virgil van Dijk', 'Ibrahima Konate', 'Andrew Robertson', 'Alexis Mac Allister', 'Ryan Gravenberch', 'Dominik Szoboszlai', 'Mohamed Salah', 'Diogo Jota', 'Luis Diaz'],
    'Real Madrid': ['Thibaut Courtois', 'Dani Carvajal', 'Antonio Rudiger', 'Eder Militao', 'Ferland Mendy', 'Jude Bellingham', 'Federico Valverde', 'Aurelien Tchouameni', 'Vinicius Junior', 'Kylian Mbappe', 'Rodrygo'],
    'FC Barcelona': ['Marc-Andre ter Stegen', 'Jules Kounde', 'Ronald Araujo', 'Pau Cubarsi', 'Alejandro Balde', 'Pedri', 'Frenkie de Jong', 'Dani Olmo', 'Lamine Yamal', 'Robert Lewandowski', 'Raphinha'],
    'Bayern Munich': ['Manuel Neuer', 'Joshua Kimmich', 'Dayot Upamecano', 'Kim Min-jae', 'Alphonso Davies', 'Joao Palhinha', 'Jamal Musiala', 'Leroy Sane', 'Michael Olise', 'Harry Kane', 'Thomas Muller'],
    'Inter Milan': ['Yann Sommer', 'Benjamin Pavard', 'Alessandro Bastoni', 'Stefan de Vrij', 'Federico Dimarco', 'Nicolo Barella', 'Hakan Calhanoglu', 'Henrikh Mkhitaryan', 'Denzel Dumfries', 'Lautaro Martinez', 'Marcus Thuram'],
    'Paris Saint-Germain': ['Gianluigi Donnarumma', 'Achraf Hakimi', 'Marquinhos', 'Willian Pacho', 'Nuno Mendes', 'Vitinha', 'Warren Zaire-Emery', 'Joao Neves', 'Ousmane Dembele', 'Bradley Barcola', 'Goncalo Ramos']
};

// =========================================================================
// ฟังก์ชันสุ่มแบบ Deterministic (อิง Seed เพื่อให้ชื่อไม่ซ้ำซ้อนและสมจริง)
// =========================================================================
function seededInt(seedStr, max) {
    const hash = crypto.createHash('md5').update(seedStr).digest('hex');
    return parseInt(hash.slice(0, 8), 16) % max;
}

function generateDeterministicName(club, index, usedNamesSet) {
    // 70% เป็นนักเตะสัญชาติเดียวกับสโมสร, 30% เป็นนักเตะต่างชาติ (ยุโรป/อเมริกาใต้)
    const isForeign = (seededInt(`${club.id}_nat_${index}`, 100) < 30);
    let poolKey = COUNTRY_TO_POOL[club.countryCode] || 'EASTERN';
    let nationality = club.country;
    let natCode = club.countryCode;

    if (isForeign) {
        const foreignKeys = ['BRA_ARG', 'FRA', 'ESP', 'POR', 'NED', 'NORDIC', 'EASTERN', 'BALKAN_TUR'];
        poolKey = foreignKeys[seededInt(`${club.id}_fkey_${index}`, foreignKeys.length)];
        const foreignNatMap = {
            BRA_ARG: ['Brazil', 'BRA'],
            FRA: ['France', 'FRA'],
            ESP: ['Spain', 'ESP'],
            POR: ['Portugal', 'POR'],
            NED: ['Netherlands', 'NED'],
            NORDIC: ['Denmark', 'DEN'],
            EASTERN: ['Croatia', 'CRO'],
            BALKAN_TUR: ['Serbia', 'SRB']
        };
        [nationality, natCode] = foreignNatMap[poolKey];
    }

    const pool = NAME_POOLS[poolKey];
    let attempt = 0;
    let fullName = '';
    do {
        const fIdx = seededInt(`${club.id}_fn_${index}_${attempt}`, pool.first.length);
        const lIdx = seededInt(`${club.id}_ln_${index}_${attempt}`, pool.last.length);
        fullName = `${pool.first[fIdx]} ${pool.last[lIdx]}`;
        attempt++;
    } while (usedNamesSet.has(fullName) && attempt < 40);

    usedNamesSet.add(fullName);
    return { fullName, nationality, natCode };
}

function calculatePlayerOverall(p) {
    if (p.pos === 'GK') return (p.tac * 1.6 + p.pas * 0.7 + p.pac * 0.7) / 3;
    if (p.pos === 'DEF') return (p.tac * 1.5 + p.pac * 0.8 + p.pas * 0.7) / 3;
    if (p.pos === 'MID') return (p.pas * 1.4 + p.fin * 0.8 + p.tac * 0.8 + p.pac * 0.8) / 3.8;
    return (p.fin * 1.6 + p.pac * 1.0 + p.pas * 0.6) / 3.2;
}

function generateSquadForClub(club) {
    // โครงสร้างตำแหน่ง 23 คน: GK 3, DEF 7, MID 7, FWD 6
    const positionBlueprint = [
        'GK', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'FWD', 'FWD', 'FWD', // 1-11 (ตัวจริงหลัก)
        'GK', 'DEF', 'DEF', 'MID', 'MID', 'FWD',                                     // 12-17 (ตัวสำรอง)
        'GK', 'DEF', 'MID', 'MID', 'FWD', 'FWD'                                      // 18-23 (ขุมกำลังเชิงลึก & ดาวรุ่ง)
    ];

    const baseAttr = Math.max(8, Math.min(18, Math.round((club.tier - 44) / 2.65)));
    const usedNames = new Set();
    const realStars = REAL_CLUB_STARS[club.name] || [];
    const players = [];

    for (let i = 0; i < CONFIG.SQUAD_SIZE_PER_CLUB; i++) {
        const pos = positionBlueprint[i];
        const shirtNumber = i + 1;
        const isStarterTier = i < 11;
        const isWonderkid = (i >= 18 && seededInt(`${club.id}_wk_${i}`, 100) < 35);

        let playerName, nationality, natCode;
        if (i < realStars.length) {
            playerName = realStars[i];
            usedNames.add(playerName);
            nationality = club.country;
            natCode = club.countryCode;
        } else {
            const gen = generateDeterministicName(club, i, usedNames);
            playerName = gen.fullName;
            nationality = gen.nationality;
            natCode = gen.natCode;
        }

        // อายุสมจริงตามบทบาท (ดาวรุ่งอายุ 17-20, ตัวหลัก 22-31, ตัวเก๋า 32-35)
        let age = 21 + seededInt(`${club.id}_age_${i}`, 11);
        if (isWonderkid) age = 17 + seededInt(`${club.id}_wkage_${i}`, 4);
        else if (pos === 'GK' && i === 17) age = 33 + seededInt(`${club.id}_gkage_${i}`, 4);

        // คำนวณค่าพลังหลักและรอง (1-20)
        const roleModifier = isStarterTier ? (seededInt(`${club.id}_mod_${i}`, 3)) : (isWonderkid ? 0 : -2);
        const mainAttr = Math.max(7, Math.min(20, baseAttr + roleModifier));
        const secAttr = Math.max(6, Math.min(20, mainAttr - 2 + seededInt(`${club.id}_sec_${i}`, 3)));

        let fin = 7, pas = 10, pac = 11, tac = 8, dri = 10, hea = 10;
        if (pos === 'GK') {
            fin = 2; pas = secAttr; pac = Math.max(7, secAttr - 1); tac = mainAttr; dri = 5; hea = secAttr;
        } else if (pos === 'DEF') {
            fin = 5 + seededInt(`${club.id}_df_${i}`, 5); pas = secAttr; pac = secAttr; tac = mainAttr; dri = secAttr - 1; hea = mainAttr - 1;
        } else if (pos === 'MID') {
            fin = secAttr; pas = mainAttr; pac = secAttr; tac = Math.max(7, secAttr - 1); dri = mainAttr - 1; hea = 9;
        } else {
            fin = mainAttr; pas = secAttr; pac = Math.min(20, mainAttr); tac = 6; dri = mainAttr - 1; hea = secAttr;
        }

        // คำนวณค่าตัว (€M) และค่าเหนื่อยต่อสัปดาห์ (€K) ตามอายุ + ค่าพลัง + โบนัสดาวรุ่ง
        const overall = (fin + pas + pac + tac) / 4;
        const ageMultiplier = age <= 21 ? 1.35 : (age <= 27 ? 1.15 : (age <= 30 ? 0.85 : 0.55));
        const rawVal = Math.pow(Math.max(6, overall) / 10, 3.1) * 4.2 * ageMultiplier * (isWonderkid ? 1.4 : 1.0);
        const val = +Math.max(0.4, Math.min(135.0, rawVal)).toFixed(1);
        const wageWeeklyK = +Math.max(1.5, val * 3.2).toFixed(1);

        const feet = ['Right', 'Right', 'Left', 'Both'];
        const preferredFoot = feet[seededInt(`${club.id}_foot_${i}`, feet.length)];

        players.push({
            id: `${club.id}_pl_${String(shirtNumber).padStart(2, '0')}`,
            shirtNumber,
            name: playerName,
            nationality,
            natCode,
            pos,
            age,
            preferredFoot,
            isWonderkid,
            fin, pas, pac, tac, dri, hea,
            sta: 96 + seededInt(`${club.id}_sta_${i}`, 5),
            mor: 84 + seededInt(`${club.id}_mor_${i}`, 12),
            val,
            wageWeeklyK,
            contractExpires: 2027 + seededInt(`${club.id}_con_${i}`, 4),
            role: i < 11 ? 'STARTER' : (i < 16 ? 'SUB' : 'RESERVE'),
            goals: 0,
            assists: 0
        });
    }

    return players;
}

// =========================================================================
// ฟังก์ชันหลัก: โหลดข้อมูล 54 ประเทศ -> เจนนักเตะทีมละ 23 คน -> เซฟ & พุช Firebase
// =========================================================================
async function main() {
    if (!fs.existsSync(CONFIG.INPUT_CLUBS_JSON)) {
        console.error(`❌ ไม่พบไฟล์ ${CONFIG.INPUT_CLUBS_JSON} กรุณารันสคริปต์สร้าง 54 ประเทศก่อน!`);
        process.exit(1);
    }

    const rawData = JSON.parse(fs.readFileSync(CONFIG.INPUT_CLUBS_JSON, 'utf8'));
    const clubs = rawData.clubs || [];
    let totalPlayersGenerated = 0;

    console.log(`⚽ กำลังสร้างฐานข้อมูลนักฟุตบอลครบทุกสโมสร (${clubs.length} สโมสร จาก ${rawData.totalCountries} ประเทศ)...\n`);

    clubs.forEach((club) => {
        club.players = generateSquadForClub(club);
        totalPlayersGenerated += club.players.length;
    });

    const outputPayload = {
        updatedAt: new Date().toISOString(),
        totalCountries: rawData.totalCountries,
        totalClubs: clubs.length,
        totalPlayers: totalPlayersGenerated,
        squadSizePerClub: CONFIG.SQUAD_SIZE_PER_CLUB,
        clubs
    };

    // 1. บันทึกลงไฟล์ JSON ในเครื่อง
    fs.writeFileSync(CONFIG.OUTPUT_FULL_JSON, JSON.stringify(outputPayload, null, 2), 'utf8');
    console.log(`✅ สร้างนักเตะสำเร็จทั้งหมด ${totalPlayersGenerated.toLocaleString()} คน (ทีมละ ${CONFIG.SQUAD_SIZE_PER_CLUB} คน)`);
    console.log(`📁 บันทึกไฟล์ JSON สมบูรณ์ไว้ที่: ${CONFIG.OUTPUT_FULL_JSON}`);

    // 2. อัปโหลดขึ้น Firebase Realtime Database อัตโนมัติ
    if (CONFIG.FIREBASE_DB_URL) {
        try {
            console.log(`\n🔥 กำลังอัปโหลดข้อมูลสโมสรและนักเตะทั้งหมดขึ้น Firebase...`);
            const res = await fetch(`${CONFIG.FIREBASE_DB_URL}/uefa_54_nations.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(outputPayload)
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            console.log(`🎉 อัปโหลดขึ้น Firebase สำเร็จสมบูรณ์! (${clubs.length} สโมสร / ${totalPlayersGenerated.toLocaleString()} นักเตะ)`);
        } catch (err) {
            console.error(`❌ อัปโหลดขึ้น Firebase ไม่สำเร็จ: ${err.message}`);
        }
    }
}

main();