const sqlite3 = require("sqlite3").verbose();

// Create/open database
const db = new sqlite3.Database("users.db");

// Function to normalize text (same as in server.js)
function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  
  let normalized = text.toLowerCase();
  
  // Remove spaces, dots, dashes, underscores
  normalized = normalized.replace(/[\s\.\-_]/g, '');
  
  // Convert leetspeak and number substitutions
  const substitutions = {
    '@': 'a', '4': 'a', '3': 'e', '1': 'i', '!': 'i', '0': 'o', 
    '5': 's', '$': 's', '7': 't', '+': 't', '|': 'l', '8': 'b', 
    '6': 'g', '9': 'g'
  };
  
  for (const [from, to] of Object.entries(substitutions)) {
    normalized = normalized.replace(new RegExp(from, 'g'), to);
  }
  
  // Remove other special characters
  normalized = normalized.replace(/[^a-zA-Z0-9]/g, '');
  
  // Handle repeated characters (e.g., "aaaa" -> "a")
  normalized = normalized.replace(/(.)\1{2,}/g, '$1');
  
  return normalized;
}

// Function to add profanity word
function addProfanityWord(word, severity = 1, category = 'general') {
  const normalizedWord = normalizeText(word);
  
  return new Promise((resolve, reject) => {
    // Check if word already exists
    db.get(
      "SELECT id FROM profanity_words WHERE word = ? OR normalized_word = ?",
      [word.toLowerCase(), normalizedWord],
      (err, existing) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (existing) {
          console.log(`Word "${word}" already exists, skipping...`);
          resolve(existing);
          return;
        }
        
        // Insert new word
        db.run(
          "INSERT INTO profanity_words (word, normalized_word, severity, category, is_active) VALUES (?, ?, ?, ?, 1)",
          [word.toLowerCase(), normalizedWord, severity, category],
          function(err) {
            if (err) {
              reject(err);
            } else {
              console.log(`Added: "${word}" (normalized: "${normalizedWord}") - Severity: ${severity}, Category: ${category}`);
              resolve({ id: this.lastID, word, normalizedWord, severity, category });
            }
          }
        );
      }
    );
  });
}

// Initialize database
console.log("Initializing profanity database...");

db.serialize(() => {
  // Create table if it doesn't exist
  db.run(`CREATE TABLE IF NOT EXISTS profanity_words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT NOT NULL UNIQUE,
    normalized_word TEXT NOT NULL,
    severity INTEGER DEFAULT 1,
    category TEXT DEFAULT 'general',
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    added_by INTEGER,
    is_active BOOLEAN DEFAULT 1
  )`);
  
  // Romanian profanity words to add
  const profanityWords = [
    // Romanian profanity words
    // Tier 3 - Most severe (Sexual/Scatological)
    { word: "pula", severity: 3, category: "sexual" },
    { word: "pizda", severity: 3, category: "sexual" },
    { word: "muie", severity: 3, category: "sexual" },
    { word: "futut", severity: 3, category: "sexual" },
    { word: "fute", severity: 3, category: "sexual" },
    { word: "futai", severity: 3, category: "sexual" },
    { word: "cacat", severity: 3, category: "scatological" },
    { word: "rahat", severity: 3, category: "scatological" },
    { word: "kkt", severity: 3, category: "scatological" },
    { word: "cacatu", severity: 3, category: "scatological" },
    { word: "rahatu", severity: 3, category: "scatological" },
    { word: "curva", severity: 3, category: "sexual" },
    
    // Tier 2 - Moderate (Insults)
    { word: "prost", severity: 2, category: "insult" },
    { word: "proasta", severity: 2, category: "insult" },
    { word: "idiot", severity: 2, category: "insult" },
    { word: "idiota", severity: 2, category: "insult" },
    { word: "imbecil", severity: 2, category: "insult" },
    { word: "imbecila", severity: 2, category: "insult" },
    { word: "cretin", severity: 2, category: "insult" },
    { word: "cretina", severity: 2, category: "insult" },
    { word: "tâmpit", severity: 2, category: "insult" },
    { word: "tâmpita", severity: 2, category: "insult" },
    { word: "tampit", severity: 2, category: "insult" },
    { word: "tampita", severity: 2, category: "insult" },
    { word: "retardat", severity: 2, category: "insult" },
    { word: "retardata", severity: 2, category: "insult" },
    { word: "handicapat", severity: 2, category: "insult" },
    { word: "handicapata", severity: 2, category: "insult" },
    { word: "nebun", severity: 2, category: "insult" },
    { word: "nebuna", severity: 2, category: "insult" },
    { word: "bou", severity: 2, category: "insult" },
    { word: "vaca", severity: 2, category: "insult" },
    { word: "javra", severity: 2, category: "insult" },
    
    // Tier 1 - Mild but inappropriate
    { word: "dracu", severity: 1, category: "mild" },
    { word: "dracului", severity: 1, category: "mild" },
    { word: "naiba", severity: 1, category: "mild" },
    { word: "naibii", severity: 1, category: "mild" },
    { word: "mortii", severity: 1, category: "mild" },
    { word: "mortilor", severity: 1, category: "mild" },
    { word: "mama", severity: 1, category: "mild" },
    { word: "mamei", severity: 1, category: "mild" },
    { word: "fraiere", severity: 1, category: "mild" },
    { word: "fraiera", severity: 1, category: "mild" },
    { word: "frate", severity: 1, category: "mild" },
    
    // Common variations and leetspeak
    { word: "pw1a", severity: 3, category: "sexual" },
    { word: "p1zda", severity: 3, category: "sexual" },
    { word: "mu1e", severity: 3, category: "sexual" },
    { word: "cac4t", severity: 3, category: "scatological" },
    { word: "r4hat", severity: 3, category: "scatological" },
    { word: "pr0st", severity: 2, category: "insult" },
    { word: "1diot", severity: 2, category: "insult" },
    { word: "cr3tin", severity: 2, category: "insult" },
    { word: "t4mpit", severity: 2, category: "insult" },
    { word: "dr4cu", severity: 1, category: "mild" },
    { word: "n41ba", severity: 1, category: "mild" },
    
    // English profanity words
    // Tier 3 - Most severe (Sexual/Scatological)
    { word: "fuck", severity: 3, category: "sexual" },
    { word: "shit", severity: 3, category: "scatological" },
    { word: "motherfucker", severity: 3, category: "sexual" },
    { word: "cunt", severity: 3, category: "sexual" },
    { word: "cocksucker", severity: 3, category: "sexual" },
    { word: "whore", severity: 3, category: "sexual" },
    { word: "asshole", severity: 3, category: "insult" },
    { word: "cock", severity: 3, category: "sexual" },
    { word: "dick", severity: 3, category: "sexual" },
    { word: "pussy", severity: 3, category: "sexual" },
    { word: "twat", severity: 3, category: "sexual" },
    { word: "fucker", severity: 3, category: "insult" },
    
    // Tier 2 - Moderate (Insults)
    { word: "bitch", severity: 2, category: "insult" },
    { word: "bastard", severity: 2, category: "insult" },
    { word: "slut", severity: 2, category: "sexual" },
    { word: "retard", severity: 2, category: "insult" },
    { word: "retarded", severity: 2, category: "insult" },
    { word: "idiot", severity: 2, category: "insult" },
    { word: "stupid", severity: 2, category: "insult" },
    { word: "moron", severity: 2, category: "insult" },
    { word: "dumbass", severity: 2, category: "insult" },
    { word: "prick", severity: 2, category: "insult" },
    { word: "dickhead", severity: 2, category: "insult" },
    { word: "wanker", severity: 2, category: "sexual" },
    { word: "jackass", severity: 2, category: "insult" },
    { word: "asshat", severity: 2, category: "insult" },
    
    // Tier 1 - Mild but inappropriate
    { word: "damn", severity: 1, category: "mild" },
    { word: "hell", severity: 1, category: "mild" },
    { word: "goddamn", severity: 1, category: "mild" },
    { word: "crap", severity: 1, category: "mild" },
    { word: "piss", severity: 1, category: "mild" },
    { word: "bloody", severity: 1, category: "mild" },
    { word: "bugger", severity: 1, category: "mild" },
    { word: "bollocks", severity: 1, category: "mild" },
    { word: "git", severity: 1, category: "mild" },
    
    // Common variations and leetspeak
    { word: "fuk", severity: 3, category: "sexual" },
    { word: "fck", severity: 3, category: "sexual" },
    { word: "fvck", severity: 3, category: "sexual" },
    { word: "phuck", severity: 3, category: "sexual" },
    { word: "fcuk", severity: 3, category: "sexual" },
    { word: "sht", severity: 3, category: "scatological" },
    { word: "sh1t", severity: 3, category: "scatological" },
    { word: "b1tch", severity: 2, category: "insult" },
    { word: "biatch", severity: 2, category: "insult" },
    { word: "wh0re", severity: 3, category: "sexual" },
    { word: "a55hole", severity: 3, category: "insult" },
    { word: "assh0le", severity: 3, category: "insult" },
    { word: "ahole", severity: 3, category: "insult" },
    { word: "d1ck", severity: 3, category: "sexual" },
    { word: "pu55y", severity: 3, category: "sexual" },
    { word: "tw4t", severity: 3, category: "sexual" },
    { word: "c0ck", severity: 3, category: "sexual" },
    { word: "mofo", severity: 2, category: "insult" },
    { word: "btch", severity: 2, category: "insult" },
    { word: "ret4rd", severity: 2, category: "insult" },
    { word: "pr1ck", severity: 2, category: "insult" },
    
    // German profanity words
    // Tier 3 - Most severe (Sexual/Scatological)
    { word: "scheisse", severity: 3, category: "scatological" },
    { word: "arschloch", severity: 3, category: "insult" },
    { word: "fotze", severity: 3, category: "sexual" },
    { word: "hurensohn", severity: 3, category: "insult" },
    { word: "schlampe", severity: 3, category: "sexual" },
    { word: "hure", severity: 3, category: "sexual" },
    { word: "nutte", severity: 3, category: "sexual" },
    { word: "ficken", severity: 3, category: "sexual" },
    { word: "fick", severity: 3, category: "sexual" },
    { word: "miststuck", severity: 3, category: "scatological" },
    
    // Tier 2 - Moderate (Insults)
    { word: "wichser", severity: 2, category: "sexual" },
    { word: "drecksau", severity: 2, category: "insult" },
    { word: "arsch", severity: 2, category: "insult" },
    { word: "scheiss", severity: 3, category: "scatological" },
    { word: "spast", severity: 2, category: "insult" },
    { word: "spasti", severity: 2, category: "insult" },
    { word: "idiot", severity: 2, category: "insult" },
    { word: "depp", severity: 2, category: "insult" },
    { word: "blödmann", severity: 2, category: "insult" },
    { word: "arschgeige", severity: 2, category: "insult" },
    { word: "bastard", severity: 2, category: "insult" },
    { word: "schwein", severity: 2, category: "insult" },
    { word: "verpiss", severity: 2, category: "insult" },
    
    // Tier 1 - Mild but inappropriate
    { word: "mist", severity: 1, category: "mild" },
    { word: "kacke", severity: 1, category: "mild" },
    { word: "verdammt", severity: 1, category: "mild" },
    
    // Common variations and leetspeak
    { word: "scheiße", severity: 3, category: "scatological" },
    { word: "sch3isse", severity: 3, category: "scatological" },
    { word: "4rschloch", severity: 3, category: "insult" },
    { word: "f0tze", severity: 3, category: "sexual" },
    { word: "schl4mpe", severity: 3, category: "sexual" },
    { word: "hurens0hn", severity: 3, category: "insult" },
    { word: "nu77e", severity: 3, category: "sexual" },
    { word: "w1chser", severity: 2, category: "sexual" },
    { word: "dr3cksau", severity: 2, category: "insult" },
    { word: "sp4st", severity: 2, category: "insult" },
    { word: "schei55e", severity: 3, category: "scatological" },
    
    // French profanity words
    // Tier 3 - Most severe (Sexual/Scatological)
    { word: "putain", severity: 3, category: "sexual" },
    { word: "merde", severity: 3, category: "scatological" },
    { word: "enculé", severity: 3, category: "sexual" },
    { word: "encule", severity: 3, category: "sexual" },
    { word: "salope", severity: 3, category: "sexual" },
    { word: "pute", severity: 3, category: "sexual" },
    { word: "nique", severity: 3, category: "sexual" },
    { word: "niquer", severity: 3, category: "sexual" },
    
    // Tier 2 - Moderate (Insults)
    { word: "connard", severity: 2, category: "insult" },
    { word: "connasse", severity: 2, category: "insult" },
    { word: "con", severity: 2, category: "insult" },
    { word: "conne", severity: 2, category: "insult" },
    { word: "batard", severity: 2, category: "insult" },
    { word: "bâtard", severity: 2, category: "insult" },
    { word: "salaud", severity: 2, category: "insult" },
    { word: "enfoiré", severity: 2, category: "insult" },
    { word: "enfoire", severity: 2, category: "insult" },
    { word: "abruti", severity: 2, category: "insult" },
    { word: "branleur", severity: 2, category: "sexual" },
    { word: "trouduc", severity: 2, category: "insult" },
    
    // Tier 1 - Mild but inappropriate
    { word: "bordel", severity: 1, category: "mild" },
    { word: "chiant", severity: 1, category: "mild" },
    { word: "chiotte", severity: 1, category: "mild" },
    { word: "chiottes", severity: 1, category: "mild" },
    
    // Common variations and leetspeak
    { word: "put1n", severity: 3, category: "sexual" },
    { word: "m3rde", severity: 3, category: "scatological" },
    { word: "encul3", severity: 3, category: "sexual" },
    { word: "sal0pe", severity: 3, category: "sexual" },
    { word: "c0nnard", severity: 2, category: "insult" },
    { word: "c0nnasse", severity: 2, category: "insult" },
    { word: "b4tard", severity: 2, category: "insult" },
    { word: "abrut1", severity: 2, category: "insult" },
    { word: "n1que", severity: 3, category: "sexual" },
    { word: "tr0uduc", severity: 2, category: "insult" },
    { word: "br4nleur", severity: 2, category: "sexual" },
    
    // Spanish profanity words
    // Tier 3 - Most severe (Sexual/Scatological)
    { word: "puta", severity: 3, category: "sexual" },
    { word: "joder", severity: 3, category: "sexual" },
    { word: "mierda", severity: 3, category: "scatological" },
    { word: "coño", severity: 3, category: "sexual" },
    { word: "verga", severity: 3, category: "sexual" },
    { word: "chingar", severity: 3, category: "sexual" },
    
    // Tier 2 - Moderate (Insults)
    { word: "cabrón", severity: 2, category: "insult" },
    { word: "cabron", severity: 2, category: "insult" },
    { word: "gilipollas", severity: 2, category: "insult" },
    { word: "pendejo", severity: 2, category: "insult" },
    { word: "culero", severity: 2, category: "insult" },
    { word: "mamón", severity: 2, category: "insult" },
    { word: "mamon", severity: 2, category: "insult" },
    { word: "zorra", severity: 2, category: "sexual" },
    { word: "perra", severity: 2, category: "insult" },
    { word: "idiota", severity: 2, category: "insult" },
    { word: "imbécil", severity: 2, category: "insult" },
    { word: "imbecil", severity: 2, category: "insult" },
    { word: "estúpido", severity: 2, category: "insult" },
    { word: "estupido", severity: 2, category: "insult" },
    { word: "subnormal", severity: 2, category: "insult" },
    { word: "retrasado", severity: 2, category: "insult" },
    
    // Tier 1 - Mild but inappropriate
    { word: "hostia", severity: 1, category: "mild" },
    { word: "pinche", severity: 1, category: "mild" },
    { word: "cojones", severity: 1, category: "mild" },
    { word: "culo", severity: 1, category: "mild" },
    { word: "carajo", severity: 1, category: "mild" },
    { word: "tonto", severity: 1, category: "mild" },
    
    // Common variations and leetspeak
    { word: "put@", severity: 3, category: "sexual" },
    { word: "j0der", severity: 3, category: "sexual" },
    { word: "m13rda", severity: 3, category: "scatological" },
    { word: "cono", severity: 3, category: "sexual" },
    { word: "c4bron", severity: 2, category: "insult" },
    { word: "g1lipollas", severity: 2, category: "insult" },
    { word: "p3ndejo", severity: 2, category: "insult" },
    { word: "cul3ro", severity: 2, category: "insult" },
    { word: "m4mon", severity: 2, category: "insult" },
    { word: "z0rra", severity: 2, category: "sexual" },
    { word: "p3rra", severity: 2, category: "insult" },
    { word: "imb3cil", severity: 2, category: "insult" },
    { word: "estup1do", severity: 2, category: "insult" },
    { word: "5ubnormal", severity: 2, category: "insult" },
    { word: "r3trasado", severity: 2, category: "insult" },
    { word: "put0", severity: 2, category: "insult" },
    
    // Italian profanity words
    // Tier 3 - Most severe (Sexual/Scatological)
    { word: "cazzo", severity: 3, category: "sexual" },
    { word: "vaffanculo", severity: 3, category: "sexual" },
    { word: "fanculo", severity: 3, category: "sexual" },
    { word: "puttana", severity: 3, category: "sexual" },
    { word: "troia", severity: 3, category: "sexual" },
    { word: "merda", severity: 3, category: "scatological" },
    { word: "stronzo", severity: 3, category: "scatological" },
    { word: "stronza", severity: 3, category: "scatological" },
    { word: "minchia", severity: 3, category: "sexual" },
    { word: "fottiti", severity: 3, category: "sexual" },
    { word: "suca", severity: 3, category: "sexual" },
    
    // Tier 2 - Moderate (Insults)
    { word: "bastardo", severity: 2, category: "insult" },
    { word: "coglione", severity: 2, category: "insult" },
    { word: "deficiente", severity: 2, category: "insult" },
    { word: "cretino", severity: 2, category: "insult" },
    { word: "stupido", severity: 2, category: "insult" },
    { word: "handicappato", severity: 2, category: "insult" },
    { word: "ritardato", severity: 2, category: "insult" },
    
    // Tier 1 - Mild but inappropriate
    { word: "cazzata", severity: 1, category: "mild" },
    { word: "culo", severity: 1, category: "mild" },
    
    // Common variations and leetspeak
    { word: "c4zzo", severity: 3, category: "sexual" },
    { word: "vaff4nculo", severity: 3, category: "sexual" },
    { word: "f4nculo", severity: 3, category: "sexual" },
    { word: "pu77ana", severity: 3, category: "sexual" },
    { word: "tr0ia", severity: 3, category: "sexual" },
    { word: "m3rda", severity: 3, category: "scatological" },
    { word: "str0nzo", severity: 3, category: "scatological" },
    { word: "str0nza", severity: 3, category: "scatological" },
    { word: "c0glione", severity: 2, category: "insult" },
    { word: "m1nchia", severity: 3, category: "sexual" },
    { word: "bast4rdo", severity: 2, category: "insult" },
    { word: "f0ttiti", severity: 3, category: "sexual" },
    { word: "suca", severity: 3, category: "sexual" },
    { word: "hand1cappato", severity: 2, category: "insult" },
    { word: "rit4rdato", severity: 2, category: "insult" },
    { word: "deficiente", severity: 2, category: "insult" },
    { word: "d3ficiente", severity: 2, category: "insult" },
    { word: "cr3tino", severity: 2, category: "insult" },
    { word: "stup1do", severity: 2, category: "insult" }
  ];
  
  
  
  
  // Add all words
  let addedCount = 0;
  let totalWords = profanityWords.length;
  
  profanityWords.forEach((wordData, index) => {
    addProfanityWord(wordData.word, wordData.severity, wordData.category)
      .then(() => {
        addedCount++;
        if (addedCount === totalWords) {
          console.log(`\n✅ Successfully processed ${totalWords} profanity words!`);
          console.log("\n📋 To view all words in the database, run:");
          console.log("sqlite3 users.db 'SELECT * FROM profanity_words ORDER BY severity DESC, word;'");
          console.log("\n📝 To add more words manually, run:");
          console.log("sqlite3 users.db");
          console.log("INSERT INTO profanity_words (word, normalized_word, severity, category, is_active) VALUES ('newword', 'normalized_newword', 2, 'insult', 1);");
          console.log("\n🔧 Database file location: users.db");
          db.close();
        }
      })
      .catch(error => {
        console.error(`Error adding word "${wordData.word}":`, error);
        addedCount++;
        if (addedCount === totalWords) {
          db.close();
        }
      });
  });
}); 