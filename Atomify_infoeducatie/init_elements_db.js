const sqlite3 = require("sqlite3").verbose();

// Create/open database
const db = new sqlite3.Database("users.db");

/**
 * Initialize the chemical elements database with periodic table data
 */
function initializeChemicalElements() {
  console.log("🧪 Initializing chemical elements database...");
  
  // Complete periodic table data with Romanian names and atomic masses
  const elementsData = [
    { symbol: "H", name_ro: "Hidrogen", name_en: "Hydrogen", atomic_mass: 1.008, atomic_number: 1 },
    { symbol: "He", name_ro: "Heliu", name_en: "Helium", atomic_mass: 4.002602, atomic_number: 2 },
    { symbol: "Li", name_ro: "Litiu", name_en: "Lithium", atomic_mass: 6.94, atomic_number: 3 },
    { symbol: "Be", name_ro: "Beriliu", name_en: "Beryllium", atomic_mass: 9.0121831, atomic_number: 4 },
    { symbol: "B", name_ro: "Bor", name_en: "Boron", atomic_mass: 10.81, atomic_number: 5 },
    { symbol: "C", name_ro: "Carbon", name_en: "Carbon", atomic_mass: 12.011, atomic_number: 6 },
    { symbol: "N", name_ro: "Azot", name_en: "Nitrogen", atomic_mass: 14.007, atomic_number: 7 },
    { symbol: "O", name_ro: "Oxigen", name_en: "Oxygen", atomic_mass: 15.999, atomic_number: 8 },
    { symbol: "F", name_ro: "Fluor", name_en: "Fluorine", atomic_mass: 18.99840316, atomic_number: 9 },
    { symbol: "Ne", name_ro: "Neon", name_en: "Neon", atomic_mass: 20.1797, atomic_number: 10 },
    { symbol: "Na", name_ro: "Sodiu", name_en: "Sodium", atomic_mass: 22.98976928, atomic_number: 11 },
    { symbol: "Mg", name_ro: "Magneziu", name_en: "Magnesium", atomic_mass: 24.305, atomic_number: 12 },
    { symbol: "Al", name_ro: "Aluminiu", name_en: "Aluminum", atomic_mass: 26.9815384, atomic_number: 13 },
    { symbol: "Si", name_ro: "Siliciu", name_en: "Silicon", atomic_mass: 28.085, atomic_number: 14 },
    { symbol: "P", name_ro: "Fosfor", name_en: "Phosphorus", atomic_mass: 30.97376199, atomic_number: 15 },
    { symbol: "S", name_ro: "Sulf", name_en: "Sulfur", atomic_mass: 32.06, atomic_number: 16 },
    { symbol: "Cl", name_ro: "Clor", name_en: "Chlorine", atomic_mass: 35.45, atomic_number: 17 },
    { symbol: "Ar", name_ro: "Argon", name_en: "Argon", atomic_mass: 39.948, atomic_number: 18 },
    { symbol: "K", name_ro: "Potasiu", name_en: "Potassium", atomic_mass: 39.0983, atomic_number: 19 },
    { symbol: "Ca", name_ro: "Calciu", name_en: "Calcium", atomic_mass: 40.078, atomic_number: 20 },
    { symbol: "Sc", name_ro: "Scandiu", name_en: "Scandium", atomic_mass: 44.955908, atomic_number: 21 },
    { symbol: "Ti", name_ro: "Titan", name_en: "Titanium", atomic_mass: 47.867, atomic_number: 22 },
    { symbol: "V", name_ro: "Vanadiu", name_en: "Vanadium", atomic_mass: 50.9415, atomic_number: 23 },
    { symbol: "Cr", name_ro: "Crom", name_en: "Chromium", atomic_mass: 51.9961, atomic_number: 24 },
    { symbol: "Mn", name_ro: "Mangan", name_en: "Manganese", atomic_mass: 54.938043, atomic_number: 25 },
    { symbol: "Fe", name_ro: "Fier", name_en: "Iron", atomic_mass: 55.845, atomic_number: 26 },
    { symbol: "Co", name_ro: "Cobalt", name_en: "Cobalt", atomic_mass: 58.933194, atomic_number: 27 },
    { symbol: "Ni", name_ro: "Nichel", name_en: "Nickel", atomic_mass: 58.6934, atomic_number: 28 },
    { symbol: "Cu", name_ro: "Cupru", name_en: "Copper", atomic_mass: 63.546, atomic_number: 29 },
    { symbol: "Zn", name_ro: "Zinc", name_en: "Zinc", atomic_mass: 65.38, atomic_number: 30 },
    { symbol: "Ga", name_ro: "Galiu", name_en: "Gallium", atomic_mass: 69.723, atomic_number: 31 },
    { symbol: "Ge", name_ro: "Germaniu", name_en: "Germanium", atomic_mass: 72.630, atomic_number: 32 },
    { symbol: "As", name_ro: "Arsen", name_en: "Arsenic", atomic_mass: 74.921595, atomic_number: 33 },
    { symbol: "Se", name_ro: "Seleniu", name_en: "Selenium", atomic_mass: 78.971, atomic_number: 34 },
    { symbol: "Br", name_ro: "Brom", name_en: "Bromine", atomic_mass: 79.904, atomic_number: 35 },
    { symbol: "Kr", name_ro: "Kripton", name_en: "Krypton", atomic_mass: 83.798, atomic_number: 36 },
    { symbol: "Rb", name_ro: "Rubidiu", name_en: "Rubidium", atomic_mass: 85.4678, atomic_number: 37 },
    { symbol: "Sr", name_ro: "Stronțiu", name_en: "Strontium", atomic_mass: 87.62, atomic_number: 38 },
    { symbol: "Y", name_ro: "Ytriu", name_en: "Yttrium", atomic_mass: 88.90584, atomic_number: 39 },
    { symbol: "Zr", name_ro: "Zirconiu", name_en: "Zirconium", atomic_mass: 91.224, atomic_number: 40 },
    { symbol: "Nb", name_ro: "Niobiu", name_en: "Niobium", atomic_mass: 92.90637, atomic_number: 41 },
    { symbol: "Mo", name_ro: "Molibden", name_en: "Molybdenum", atomic_mass: 95.95, atomic_number: 42 },
    { symbol: "Tc", name_ro: "Technețiu", name_en: "Technetium", atomic_mass: 98, atomic_number: 43 },
    { symbol: "Ru", name_ro: "Ruteniu", name_en: "Ruthenium", atomic_mass: 101.07, atomic_number: 44 },
    { symbol: "Rh", name_ro: "Rodiu", name_en: "Rhodium", atomic_mass: 102.90549, atomic_number: 45 },
    { symbol: "Pd", name_ro: "Paladiu", name_en: "Palladium", atomic_mass: 106.42, atomic_number: 46 },
    { symbol: "Ag", name_ro: "Argint", name_en: "Silver", atomic_mass: 107.8682, atomic_number: 47 },
    { symbol: "Cd", name_ro: "Cadmiu", name_en: "Cadmium", atomic_mass: 112.414, atomic_number: 48 },
    { symbol: "In", name_ro: "Indiu", name_en: "Indium", atomic_mass: 114.818, atomic_number: 49 },
    { symbol: "Sn", name_ro: "Staniu", name_en: "Tin", atomic_mass: 118.710, atomic_number: 50 },
    { symbol: "Sb", name_ro: "Stibiu", name_en: "Antimony", atomic_mass: 121.760, atomic_number: 51 },
    { symbol: "Te", name_ro: "Telur", name_en: "Tellurium", atomic_mass: 127.60, atomic_number: 52 },
    { symbol: "I", name_ro: "Iod", name_en: "Iodine", atomic_mass: 126.90447, atomic_number: 53 },
    { symbol: "Xe", name_ro: "Xenon", name_en: "Xenon", atomic_mass: 131.293, atomic_number: 54 },
    { symbol: "Cs", name_ro: "Cesiu", name_en: "Cesium", atomic_mass: 132.9054519, atomic_number: 55 },
    { symbol: "Ba", name_ro: "Bariu", name_en: "Barium", atomic_mass: 137.327, atomic_number: 56 },
    { symbol: "La", name_ro: "Lantan", name_en: "Lanthanum", atomic_mass: 138.90547, atomic_number: 57 },
    { symbol: "Ce", name_ro: "Ceriu", name_en: "Cerium", atomic_mass: 140.116, atomic_number: 58 },
    { symbol: "Pr", name_ro: "Praseodim", name_en: "Praseodymium", atomic_mass: 140.90766, atomic_number: 59 },
    { symbol: "Nd", name_ro: "Neodim", name_en: "Neodymium", atomic_mass: 144.242, atomic_number: 60 },
    { symbol: "Pm", name_ro: "Promețiu", name_en: "Promethium", atomic_mass: 145, atomic_number: 61 },
    { symbol: "Sm", name_ro: "Samariu", name_en: "Samarium", atomic_mass: 150.36, atomic_number: 62 },
    { symbol: "Eu", name_ro: "Europiu", name_en: "Europium", atomic_mass: 151.964, atomic_number: 63 },
    { symbol: "Gd", name_ro: "Gadoliniu", name_en: "Gadolinium", atomic_mass: 157.25, atomic_number: 64 },
    { symbol: "Tb", name_ro: "Terbiu", name_en: "Terbium", atomic_mass: 158.925354, atomic_number: 65 },
    { symbol: "Dy", name_ro: "Disprosiu", name_en: "Dysprosium", atomic_mass: 162.500, atomic_number: 66 },
    { symbol: "Ho", name_ro: "Holmiu", name_en: "Holmium", atomic_mass: 164.930328, atomic_number: 67 },
    { symbol: "Er", name_ro: "Erbiu", name_en: "Erbium", atomic_mass: 167.259, atomic_number: 68 },
    { symbol: "Tm", name_ro: "Tuliu", name_en: "Thulium", atomic_mass: 168.934218, atomic_number: 69 },
    { symbol: "Yb", name_ro: "Yterbiu", name_en: "Ytterbium", atomic_mass: 173.045, atomic_number: 70 },
    { symbol: "Lu", name_ro: "Lutețiu", name_en: "Lutetium", atomic_mass: 174.9668, atomic_number: 71 },
    { symbol: "Hf", name_ro: "Hafniu", name_en: "Hafnium", atomic_mass: 178.49, atomic_number: 72 },
    { symbol: "Ta", name_ro: "Tantal", name_en: "Tantalum", atomic_mass: 180.94788, atomic_number: 73 },
    { symbol: "W", name_ro: "Wolfram", name_en: "Tungsten", atomic_mass: 183.84, atomic_number: 74 },
    { symbol: "Re", name_ro: "Reniu", name_en: "Rhenium", atomic_mass: 186.207, atomic_number: 75 },
    { symbol: "Os", name_ro: "Osmiu", name_en: "Osmium", atomic_mass: 190.23, atomic_number: 76 },
    { symbol: "Ir", name_ro: "Iridiu", name_en: "Iridium", atomic_mass: 192.217, atomic_number: 77 },
    { symbol: "Pt", name_ro: "Platină", name_en: "Platinum", atomic_mass: 195.084, atomic_number: 78 },
    { symbol: "Au", name_ro: "Aur", name_en: "Gold", atomic_mass: 196.966570, atomic_number: 79 },
    { symbol: "Hg", name_ro: "Mercur", name_en: "Mercury", atomic_mass: 200.592, atomic_number: 80 },
    { symbol: "Tl", name_ro: "Taliu", name_en: "Thallium", atomic_mass: 204.3835, atomic_number: 81 },
    { symbol: "Pb", name_ro: "Plumb", name_en: "Lead", atomic_mass: 207.2, atomic_number: 82 },
    { symbol: "Bi", name_ro: "Bismut", name_en: "Bismuth", atomic_mass: 208.98040, atomic_number: 83 },
    { symbol: "Po", name_ro: "Poloniu", name_en: "Polonium", atomic_mass: 209, atomic_number: 84 },
    { symbol: "At", name_ro: "Astatin", name_en: "Astatine", atomic_mass: 210, atomic_number: 85 },
    { symbol: "Rn", name_ro: "Radon", name_en: "Radon", atomic_mass: 222, atomic_number: 86 },
    { symbol: "Fr", name_ro: "Franciu", name_en: "Francium", atomic_mass: 223, atomic_number: 87 },
    { symbol: "Ra", name_ro: "Radiu", name_en: "Radium", atomic_mass: 226, atomic_number: 88 },
    { symbol: "Ac", name_ro: "Actiniu", name_en: "Actinium", atomic_mass: 227, atomic_number: 89 },
    { symbol: "Th", name_ro: "Thoriu", name_en: "Thorium", atomic_mass: 232.0377, atomic_number: 90 },
    { symbol: "Pa", name_ro: "Protactiniu", name_en: "Protactinium", atomic_mass: 231.03588, atomic_number: 91 },
    { symbol: "U", name_ro: "Uraniu", name_en: "Uranium", atomic_mass: 238.02891, atomic_number: 92 },
    { symbol: "Np", name_ro: "Neptuniu", name_en: "Neptunium", atomic_mass: 237, atomic_number: 93 },
    { symbol: "Pu", name_ro: "Plutoniu", name_en: "Plutonium", atomic_mass: 244, atomic_number: 94 },
    { symbol: "Am", name_ro: "Americiu", name_en: "Americium", atomic_mass: 243, atomic_number: 95 },
    { symbol: "Cm", name_ro: "Curiu", name_en: "Curium", atomic_mass: 247, atomic_number: 96 },
    { symbol: "Bk", name_ro: "Berkeliu", name_en: "Berkelium", atomic_mass: 247, atomic_number: 97 },
    { symbol: "Cf", name_ro: "Californiu", name_en: "Californium", atomic_mass: 251, atomic_number: 98 },
    { symbol: "Es", name_ro: "Einsteinium", name_en: "Einsteinium", atomic_mass: 252, atomic_number: 99 },
    { symbol: "Fm", name_ro: "Fermiu", name_en: "Fermium", atomic_mass: 257, atomic_number: 100 },
    { symbol: "Md", name_ro: "Mendeleviu", name_en: "Mendelevium", atomic_mass: 258, atomic_number: 101 },
    { symbol: "No", name_ro: "Nobeliu", name_en: "Nobelium", atomic_mass: 259, atomic_number: 102 },
    { symbol: "Lr", name_ro: "Lawrenciu", name_en: "Lawrencium", atomic_mass: 262, atomic_number: 103 },
    { symbol: "Rf", name_ro: "Rutherfordiu", name_en: "Rutherfordium", atomic_mass: 267, atomic_number: 104 },
    { symbol: "Db", name_ro: "Dubniu", name_en: "Dubnium", atomic_mass: 268, atomic_number: 105 },
    { symbol: "Sg", name_ro: "Seaborgiu", name_en: "Seaborgium", atomic_mass: 271, atomic_number: 106 },
    { symbol: "Bh", name_ro: "Bohriu", name_en: "Bohrium", atomic_mass: 272, atomic_number: 107 },
    { symbol: "Hs", name_ro: "Hassiu", name_en: "Hassium", atomic_mass: 270, atomic_number: 108 },
    { symbol: "Mt", name_ro: "Meitneriu", name_en: "Meitnerium", atomic_mass: 276, atomic_number: 109 },
    { symbol: "Ds", name_ro: "Darmstadtiu", name_en: "Darmstadtium", atomic_mass: 281, atomic_number: 110 },
    { symbol: "Rg", name_ro: "Roentgeniu", name_en: "Roentgenium", atomic_mass: 280, atomic_number: 111 },
    { symbol: "Cn", name_ro: "Coperniciu", name_en: "Copernicium", atomic_mass: 285, atomic_number: 112 },
    { symbol: "Nh", name_ro: "Nihoniu", name_en: "Nihonium", atomic_mass: 286, atomic_number: 113 },
    { symbol: "Fl", name_ro: "Fleroviu", name_en: "Flerovium", atomic_mass: 289, atomic_number: 114 },
    { symbol: "Mc", name_ro: "Moscoviu", name_en: "Moscovium", atomic_mass: 290, atomic_number: 115 },
    { symbol: "Lv", name_ro: "Livermoriu", name_en: "Livermorium", atomic_mass: 293, atomic_number: 116 },
    { symbol: "Ts", name_ro: "Tennessin", name_en: "Tennessine", atomic_mass: 294, atomic_number: 117 },
    { symbol: "Og", name_ro: "Oganesson", name_en: "Oganesson", atomic_mass: 294, atomic_number: 118 }
  ];

  // Create the table first
  db.run(`CREATE TABLE IF NOT EXISTS chemical_elements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL UNIQUE,
    name_ro TEXT NOT NULL,
    name_en TEXT NOT NULL,
    atomic_mass REAL NOT NULL,
    atomic_number INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error("❌ Error creating chemical_elements table:", err);
      return;
    }
    
    // Check if database already has elements
    db.get("SELECT COUNT(*) as count FROM chemical_elements", [], (err, result) => {
      if (err) {
        console.error("❌ Error checking chemical elements database:", err);
        return;
      }
      
      // Only initialize if database is empty
      if (result.count === 0) {
        console.log("📋 Adding chemical elements to database...");
        
        // Prepare the insert statement
        const insertStmt = db.prepare(`
          INSERT INTO chemical_elements (symbol, name_ro, name_en, atomic_mass, atomic_number) 
          VALUES (?, ?, ?, ?, ?)
        `);
        
        let addedCount = 0;
        elementsData.forEach(element => {
          insertStmt.run(
            element.symbol,
            element.name_ro,
            element.name_en,
            element.atomic_mass,
            element.atomic_number,
            function(err) {
              if (err) {
                console.error(`❌ Error adding element ${element.symbol}:`, err);
              } else {
                addedCount++;
                console.log(`✅ Added: ${element.symbol} (${element.name_ro})`);
                
                if (addedCount === elementsData.length) {
                  console.log(`\n🎉 Successfully added ${elementsData.length} chemical elements to database!`);
                  
                  // Show summary
                  console.log("\n📊 Database Summary:");
                  console.log("📋 To view all elements, run:");
                  console.log("sqlite3 users.db 'SELECT * FROM chemical_elements ORDER BY atomic_number;'");
                  console.log("\n🔧 Database file location: users.db");
                  console.log("🌐 API endpoints will be available at:");
                  console.log("  - GET /api/elements");
                  console.log("  - GET /api/elements/masses");
                  console.log("  - GET /api/elements/names");
                  console.log("  - GET /api/elements/:symbol");
                  
                  insertStmt.finalize();
                  db.close();
                }
              }
            }
          );
        });
      } else {
        console.log(`✅ Chemical elements database already contains ${result.count} elements`);
        console.log("🔧 Database file location: users.db");
        db.close();
      }
    });
  });
}

// Run the initialization
initializeChemicalElements(); 