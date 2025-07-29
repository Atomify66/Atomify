require('dotenv').config();

// ── insert these above: const express = require("express");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

const app = express();

// Force HTTPS in production (disabled to fix redirect loop)
// app.use((req, res, next) => {
//   if (req.header('x-forwarded-proto') === 'http' && process.env.NODE_ENV === 'production') {
//     res.redirect(301, `https://${req.header('host')}${req.url}`);
//   } else {
//     next();
//   }
// });

app.use(cors());
app.use(express.json());
// ── start session support ─────────────────────────────────────────
app.use(session({
  store: new SQLiteStore({ db: "sessions.db", dir: "./" }),
  secret: "change_this_to_a_strong_random_value",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// ── Passport configuration ───────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

// ── Authentication middleware ─────────────────────────────────────
function requireAuth(req, res, next) {
  if (!req.session.userId && !req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

// Always use production callback URL for Google OAuth
const getCallbackURL = () => {
  console.log("🔍 Using PRODUCTION callback URL for Google OAuth");
  return "https://atomify.info/auth/google/callback";
};

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "https://atomify.info/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists
    userDb.get(
      "SELECT * FROM users WHERE google_id = ? OR email = ?",
      [profile.id, profile.emails[0].value],
      (err, existingUser) => {
        if (err) return done(err);
        
        if (existingUser) {
          // Update Google ID if user exists but doesn't have it
          if (!existingUser.google_id) {
            userDb.run(
              "UPDATE users SET google_id = ?, email = ? WHERE id = ?",
              [profile.id, profile.emails[0].value, existingUser.id],
              (updateErr) => {
                if (updateErr) return done(updateErr);
                return done(null, { ...existingUser, google_id: profile.id, email: profile.emails[0].value });
              }
            );
          } else {
            return done(null, existingUser);
          }
        } else {
          // Create new user
          const username = profile.displayName || profile.emails[0].value.split('@')[0];
          userDb.run(
            "INSERT INTO users (username, email, google_id) VALUES (?, ?, ?)",
            [username, profile.emails[0].value, profile.id],
            function(insertErr) {
              if (insertErr) return done(insertErr);
              
              // Initialize user stats and email preferences for new Google user
              const newUserId = this.lastID;
              initializeUserStats(newUserId);
              createDefaultEmailPreferences(newUserId);
              
              userDb.get(
                "SELECT * FROM users WHERE id = ?",
                [newUserId],
                (selectErr, newUser) => {
                  if (selectErr) return done(selectErr);
                  return done(null, newUser);
                }
              );
            }
          );
        }
      }
    );
  } catch (error) {
    return done(error);
  }
}));

// Passport serialization
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  userDb.get("SELECT * FROM users WHERE id = ?", [id], (err, user) => {
    done(err, user);
  });
});
// ── end session support ───────────────────────────────────────────
// ── open users.db for storing accounts ────────────────────────────
const userDb = new sqlite3.Database(
  path.join(__dirname, "users.db"),
  (err) => {
    if (err) console.error("Error opening users.db:", err);
    else {
      console.log("Connected to users.db");
      
      // Create tables with proper schema
      userDb.serialize(() => {
        // First check if users table exists and force migration if needed
        userDb.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
          if (err) {
            console.error("Error checking users table:", err);
            return;
          }
          
          if (row) {
            console.log("Found existing users table:", row.sql);
            // Check if it has NOT NULL constraint on password
            if (row.sql.includes('password') && (row.sql.includes('NOT NULL') || row.sql.includes('password TEXT NOT NULL'))) {
              console.log("❌ Users table has NOT NULL constraint on password - FORCING MIGRATION");
              forceMigrateUsersTable();
            } else {
              console.log("✅ Users table schema is compatible with OAuth");
              addMissingColumns();
            }
          } else {
            // Create users table with proper schema that supports both password and OAuth users
            console.log("Creating new users table with OAuth support...");
            userDb.run(`CREATE TABLE users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT,
              password TEXT,
              email TEXT,
              google_id TEXT,
              role TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(username),
              UNIQUE(email),
              UNIQUE(google_id)
            )`, (err) => {
              if (err) {
                console.error("Error creating users table:", err);
              } else {
                console.log("✅ Users table created successfully with OAuth support");
              }
            });
          }
        });
        
        // Table for isomer generation history
        userDb.run(`CREATE TABLE IF NOT EXISTS user_isomers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          formula TEXT NOT NULL,
          isomer_count INTEGER NOT NULL,
          generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`);
        
        // Table for quiz results history
        userDb.run(`CREATE TABLE IF NOT EXISTS user_quiz_results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          quiz_name TEXT NOT NULL,
          score INTEGER NOT NULL,
          total_questions INTEGER NOT NULL,
          completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`);
        
        // Enhanced table for detailed quiz results with leaderboard support
        userDb.run(`CREATE TABLE IF NOT EXISTS quiz_results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          quiz_id TEXT NOT NULL,
          quiz_name TEXT NOT NULL,
          score INTEGER NOT NULL,
          total_questions INTEGER NOT NULL,
          percentage REAL NOT NULL,
          time_taken INTEGER NOT NULL, -- in seconds
          class_id INTEGER, -- NULL for non-classroom attempts
          classroom_quiz_id INTEGER, -- Reference to custom classroom quiz
          completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE SET NULL,
          FOREIGN KEY (classroom_quiz_id) REFERENCES classroom_quizzes (id) ON DELETE SET NULL
        )`, (err) => {
          if (err) {
            console.error("❌ Error creating quiz_results table:", err);
          } else {
            console.log("✅ quiz_results table ready");
            
            // Add classroom_quiz_id column if it doesn't exist (for existing databases)
            userDb.run(`ALTER TABLE quiz_results ADD COLUMN classroom_quiz_id INTEGER`, (alterErr) => {
              if (alterErr && !alterErr.message.includes('duplicate column name')) {
                console.error("❌ Error adding classroom_quiz_id column:", alterErr);
              } else if (!alterErr) {
                console.log("✅ Added classroom_quiz_id column to quiz_results table");
              } else {
                console.log("✅ classroom_quiz_id column already exists");
              }
            });
          }
        });
        
        // Table for classes (created by professors)
        userDb.run(`CREATE TABLE IF NOT EXISTS classes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          professor_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (professor_id) REFERENCES users (id) ON DELETE CASCADE
        )`);
        
        // Table for homework assignments
        userDb.run(`CREATE TABLE IF NOT EXISTS homework_assignments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          class_id INTEGER NOT NULL,
          professor_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          quiz_id TEXT NOT NULL,
          quiz_name TEXT NOT NULL,
          due_date DATETIME NOT NULL,
          max_attempts INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE,
          FOREIGN KEY (professor_id) REFERENCES users (id) ON DELETE CASCADE
        )`);
        
        // Create homework_submissions table
        userDb.run(`
          CREATE TABLE IF NOT EXISTS homework_submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            homework_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            quiz_id INTEGER NOT NULL,
            score INTEGER NOT NULL,
            total_questions INTEGER NOT NULL,
            percentage INTEGER NOT NULL,
            time_taken INTEGER NOT NULL,
            attempt_number INTEGER NOT NULL DEFAULT 1,
            answers TEXT NOT NULL,
            submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (homework_id) REFERENCES homework_assignments(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
          )
        `);

        // Create badges table
        userDb.run(`
          CREATE TABLE IF NOT EXISTS badges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT NOT NULL,
            icon TEXT NOT NULL,
            category TEXT NOT NULL,
            requirement_type TEXT NOT NULL,
            requirement_value INTEGER NOT NULL,
            points INTEGER DEFAULT 0,
            rarity TEXT DEFAULT 'common',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Create user_badges table (tracks which badges users have earned)
        userDb.run(`
          CREATE TABLE IF NOT EXISTS user_badges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            badge_id INTEGER NOT NULL,
            earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            progress_when_earned INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
            UNIQUE(user_id, badge_id)
          )
        `);

        // Create user_stats table (tracks user progress and statistics)
        userDb.run(`
          CREATE TABLE IF NOT EXISTS user_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            isomers_generated INTEGER DEFAULT 0,
            quizzes_completed INTEGER DEFAULT 0,
            quizzes_perfect INTEGER DEFAULT 0,
            total_quiz_score INTEGER DEFAULT 0,
            total_quiz_questions INTEGER DEFAULT 0,
            current_streak INTEGER DEFAULT 0,
            longest_streak INTEGER DEFAULT 0,
            last_activity_date DATE,
            days_active INTEGER DEFAULT 0,
            total_study_time INTEGER DEFAULT 0,
            favorite_subject TEXT,
            account_created DATE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);

        // Create badge_progress table (tracks progress towards badges)
        userDb.run(`
          CREATE TABLE IF NOT EXISTS badge_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            badge_id INTEGER NOT NULL,
            current_progress INTEGER DEFAULT 0,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
            UNIQUE(user_id, badge_id)
          )
        `);

        // Create custom classroom quizzes table
        userDb.run(`
          CREATE TABLE IF NOT EXISTS classroom_quizzes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            class_id INTEGER NOT NULL,
            professor_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            time_limit INTEGER DEFAULT 600, -- in seconds
            questions TEXT NOT NULL, -- JSON string of questions
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_active INTEGER DEFAULT 1,
            FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE,
            FOREIGN KEY (professor_id) REFERENCES users (id) ON DELETE CASCADE
          )
        `);

        // Create notifications table (for badge notifications)
        userDb.run(`
          CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            badge_id INTEGER,
            read INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
          )
        `);
        
        // Create email preferences table (for email notifications)
        userDb.run(`
          CREATE TABLE IF NOT EXISTS email_preferences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            email_homework_notifications INTEGER DEFAULT 1,
            email_quiz_notifications INTEGER DEFAULT 1,
            email_grade_notifications INTEGER DEFAULT 1,
            email_general_notifications INTEGER DEFAULT 1,
            newsletter_subscription INTEGER DEFAULT 0,
            newsletter_email TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(user_id)
          )
        `);
        
        // Table for profanity filter words
        userDb.run(`CREATE TABLE IF NOT EXISTS profanity_words (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          word TEXT NOT NULL UNIQUE,
          normalized_word TEXT NOT NULL,
          severity INTEGER DEFAULT 1,
          category TEXT DEFAULT 'general',
          added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          added_by INTEGER,
          is_active BOOLEAN DEFAULT 1,
          FOREIGN KEY (added_by) REFERENCES users (id) ON DELETE SET NULL
        )`);

        // Table for chemical elements
        userDb.run(`CREATE TABLE IF NOT EXISTS chemical_elements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          symbol TEXT NOT NULL UNIQUE,
          name_ro TEXT NOT NULL,
          name_en TEXT NOT NULL,
          atomic_mass REAL NOT NULL,
          atomic_number INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Check if class_invitations table exists and has the problematic UNIQUE constraint
        userDb.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='class_invitations'", (err, row) => {
          if (err) {
            console.error("Error checking class_invitations table:", err);
            return;
          }
          
          if (row && row.sql.includes('UNIQUE(class_id, student_id)')) {
            console.log("Migrating class_invitations table to remove UNIQUE constraint...");
            
            // Drop the existing table and recreate it without the UNIQUE constraint
            userDb.serialize(() => {
              userDb.run("DROP TABLE IF EXISTS class_invitations_backup");
              userDb.run("ALTER TABLE class_invitations RENAME TO class_invitations_backup");
              
              // Create new table without UNIQUE constraint
              userDb.run(`CREATE TABLE class_invitations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                class_id INTEGER NOT NULL,
                student_id INTEGER NOT NULL,
                professor_id INTEGER NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                responded_at DATETIME,
                FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (professor_id) REFERENCES users (id) ON DELETE CASCADE
              )`);
              
              // Copy only pending invitations from backup
              userDb.run(`INSERT INTO class_invitations (class_id, student_id, professor_id, status, created_at, responded_at)
                         SELECT class_id, student_id, professor_id, status, created_at, responded_at 
                         FROM class_invitations_backup 
                         WHERE status = 'pending'`);
              
              // Clean up backup table
              userDb.run("DROP TABLE class_invitations_backup", (err) => {
                if (err) {
                  console.error("Error dropping backup table:", err);
                } else {
                  console.log("Successfully migrated class_invitations table!");
                }
              });
            });
          } else {
            // Table doesn't exist or doesn't have the constraint, create it normally
            userDb.run(`CREATE TABLE IF NOT EXISTS class_invitations (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              class_id INTEGER NOT NULL,
              student_id INTEGER NOT NULL,
              professor_id INTEGER NOT NULL,
              status TEXT DEFAULT 'pending',
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              responded_at DATETIME,
              FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE,
              FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE,
              FOREIGN KEY (professor_id) REFERENCES users (id) ON DELETE CASCADE
            )`, (err) => {
              if (err) {
                console.error("Error creating class_invitations table:", err);
              } else {
                console.log("class_invitations table ready (no migration needed)");
              }
            });
          }
        });
        
        // Table for confirmed class memberships
        userDb.run(`CREATE TABLE IF NOT EXISTS class_members (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          class_id INTEGER NOT NULL,
          student_id INTEGER NOT NULL,
          joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE,
          FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE,
          UNIQUE(class_id, student_id)
        )`);
        
        console.log("Database tables initialized");
        
        // Initialize profanity database with Romanian words
        initializeProfanityDatabase();
      });
    }
  }
);

// ── Profanity Filter Functions ────────────────────────────────────
/**
 * Normalize text for profanity checking
 * Converts leetspeak, removes special characters, handles common substitutions
 */
function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .toLowerCase()
    .trim()
    // Remove all spaces, dots, dashes, underscores
    .replace(/[\s\-_.]/g, '')
    // Convert common leetspeak substitutions
    .replace(/[@]/g, 'a')
    .replace(/[4]/g, 'a')
    .replace(/[3]/g, 'e')
    .replace(/[1!]/g, 'i')
    .replace(/[0]/g, 'o')
    .replace(/[5$]/g, 's')
    .replace(/[7]/g, 't')
    .replace(/[+]/g, 't')
    .replace(/[|]/g, 'l')
    .replace(/[8]/g, 'b')
    .replace(/[6]/g, 'g')
    .replace(/[9]/g, 'g')
    // Remove any remaining special characters and numbers
    .replace(/[^a-z]/g, '')
    // Handle multiple character sequences (like "aaa" -> "a")
    .replace(/(.)\1+/g, '$1');
}

/**
 * Check if text contains profanity
 */
async function containsProfanity(text) {
  return new Promise((resolve, reject) => {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      resolve({ contains: false, matches: [] });
      return;
    }
    
    const normalizedInput = normalizeText(text);
    
    // Get all active profanity words from database
    userDb.all(
      "SELECT word, normalized_word, severity, category FROM profanity_words WHERE is_active = 1",
      [],
      (err, words) => {
        if (err) {
          console.error("Error fetching profanity words:", err);
          reject(err);
          return;
        }
        
        const matches = [];
        
        // Check each profanity word
        for (const wordData of words) {
          const normalizedProfanity = wordData.normalized_word;
          
          // Check for exact match
          if (normalizedInput === normalizedProfanity) {
            matches.push({
              original: wordData.word,
              matched: normalizedProfanity,
              severity: wordData.severity,
              category: wordData.category,
              type: 'exact'
            });
          }
          // Check for substring match
          else if (normalizedInput.includes(normalizedProfanity)) {
            matches.push({
              original: wordData.word,
              matched: normalizedProfanity,
              severity: wordData.severity,
              category: wordData.category,
              type: 'substring'
            });
          }
          // Check for word boundaries (whole word within text)
          else if (normalizedInput.split('').join('.*').includes(normalizedProfanity)) {
            matches.push({
              original: wordData.word,
              matched: normalizedProfanity,
              severity: wordData.severity,
              category: wordData.category,
              type: 'scattered'
            });
          }
        }
        
        resolve({
          contains: matches.length > 0,
          matches: matches,
          normalizedInput: normalizedInput
        });
      }
    );
  });
}

/**
 * Add a new profanity word to the database
 */
function addProfanityWord(word, severity = 1, category = 'general', addedBy = null) {
  return new Promise((resolve, reject) => {
    if (!word || typeof word !== 'string') {
      reject(new Error('Invalid word provided'));
      return;
    }
    
    const normalizedWord = normalizeText(word);
    
    if (normalizedWord.length === 0) {
      reject(new Error('Word cannot be empty after normalization'));
      return;
    }
    
    userDb.run(
      "INSERT INTO profanity_words (word, normalized_word, severity, category, added_by) VALUES (?, ?, ?, ?, ?)",
      [word.toLowerCase().trim(), normalizedWord, severity, category, addedBy],
      function(err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT') {
            reject(new Error('Word already exists in database'));
          } else {
            reject(err);
          }
        } else {
          resolve({
            id: this.lastID,
            word: word.toLowerCase().trim(),
            normalized_word: normalizedWord,
            severity,
            category
          });
        }
      }
    );
  });
}

// Function to force migrate users table (this will definitely run)
function forceMigrateUsersTable() {
  console.log("🔄 FORCING users table migration to remove NOT NULL constraints...");
  
  userDb.serialize(() => {
    // Step 1: Create new table with correct schema
    userDb.run(`CREATE TABLE users_temp (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      password TEXT,
      email TEXT,
      google_id TEXT,
      role TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(username),
      UNIQUE(email),
      UNIQUE(google_id)
    )`, (createErr) => {
      if (createErr) {
        console.error("❌ Error creating temporary users table:", createErr);
        return;
      }
      console.log("✅ Temporary users table created");
      
      // Step 2: Copy existing data
      userDb.run(`INSERT INTO users_temp (id, username, password, created_at)
                  SELECT id, username, password, 
                         COALESCE(created_at, CURRENT_TIMESTAMP) as created_at
                  FROM users`, (copyErr) => {
        if (copyErr) {
          console.error("❌ Error copying user data:", copyErr);
          // Try without created_at column
          userDb.run(`INSERT INTO users_temp (id, username, password)
                      SELECT id, username, password FROM users`, (simpleCopyErr) => {
            if (simpleCopyErr) {
              console.error("❌ Error with simple copy:", simpleCopyErr);
              return;
            }
            console.log("✅ User data copied (without created_at)");
            finalizeMigration();
          });
        } else {
          console.log("✅ All user data copied successfully");
          finalizeMigration();
        }
      });
    });
  });
  
  function finalizeMigration() {
    // Step 3: Drop old table and rename new one
    userDb.run("DROP TABLE users", (dropErr) => {
      if (dropErr) {
        console.error("❌ Error dropping old users table:", dropErr);
        return;
      }
      console.log("✅ Old users table dropped");
      
      userDb.run("ALTER TABLE users_temp RENAME TO users", (renameErr) => {
        if (renameErr) {
          console.error("❌ Error renaming users table:", renameErr);
        } else {
          console.log("🎉 Users table migration completed successfully!");
          console.log("✅ Google OAuth should now work properly");
          
          // Verify the new schema
          userDb.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
            if (!err && row) {
              console.log("✅ New schema:", row.sql);
            }
          });
        }
      });
    });
  }
}

// Function to add missing columns to existing table
function addMissingColumns() {
  userDb.run(`ALTER TABLE users ADD COLUMN email TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error("Error adding email column:", err);
    }
  });
  
  userDb.run(`ALTER TABLE users ADD COLUMN google_id TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error("Error adding google_id column:", err);
    }
  });
  
  userDb.run(`ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error("Error adding created_at column:", err);
    }
  });
  
  userDb.run(`ALTER TABLE users ADD COLUMN role TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error("Error adding role column:", err);
    } else if (!err) {
      console.log("✅ Role column added successfully");
    }
  });
  
  userDb.run(`ALTER TABLE users ADD COLUMN country TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error("Error adding country column:", err);
    } else if (!err) {
      console.log("✅ Country column added successfully");
    }
  });
  
  // Add newsletter subscription column to email_preferences table
  userDb.run(`ALTER TABLE email_preferences ADD COLUMN newsletter_subscription INTEGER DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error("Error adding newsletter_subscription column:", err);
    } else if (!err) {
      console.log("✅ Newsletter subscription column added successfully");
    }
  });
  
  // Add newsletter email column to email_preferences table
  userDb.run(`ALTER TABLE email_preferences ADD COLUMN newsletter_email TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error("Error adding newsletter_email column:", err);
    } else if (!err) {
      console.log("✅ Newsletter email column added successfully");
    }
  });
}

const COUNT_TIMED_OUT_MARKER = -1; // Special value for when counting times out

// Path to Maygen .jar
const jarPath = path.join(__dirname, "MAYGEN-1.8.jar");

// ── Baza de date pentru pre-screening ─────────────────────────────
// Molecule care nu au izomeri deloc (invalid chemistry or impossible structures)
const noIsomerMolecules = {
  'N3H4': 'Această formulă nu corespunde unei molecule stabile. Azotul în această combinație nu poate forma o structură validă.',
  'NH4': 'NH4 nu este o moleculă neutră (este ionul amoniu NH4+). Încearcă NH3 în schimb.',
  'H3O': 'H3O nu este o moleculă neutră (este ionul hidroniu H3O+). Încearcă H2O în schimb.',
  'OH': 'OH nu este o moleculă neutră (este radicalul hidroxil). Încearcă H2O în schimb.',
  'CH': 'CH nu este o moleculă stabilă. Încearcă CH4 în schimb.',
  'NH': 'NH nu este o moleculă stabilă. Încearcă NH3 în schimb.',
  'C2H2O3': 'Această formulă nu corespunde unei structuri chimice stabile comune.',
  'H4O2': 'Această formulă nu corespunde unei molecule stabile. Încearcă H2O2 (peroxid de hidrogen) în schimb.',
  'N2H6': 'Această formulă nu corespunde unei molecule stabile comune. Încearcă N2H4 (hidrazină) în schimb.',
};

const problematicFormulas = {
  // Formule cu prea mulți izomeri
  'C10H22': { 
    estimatedIsomers: 75000, 
    suggestion: 'Încearcă C6H14 în schimb (5 izomeri)',
    reason: 'Decanul are peste 75.000 de izomeri, ceea ce ar necesita prea mult timp pentru generare.'
  },
  'C11H24': { 
    estimatedIsomers: 159000, 
    suggestion: 'Încearcă C7H16 în schimb (9 izomeri)',
    reason: 'Undecanul are peste 159.000 de izomeri.'
  },
  'C12H26': { 
    estimatedIsomers: 355000, 
    suggestion: 'Încearcă C8H18 în schimb (18 izomeri)',
    reason: 'Dodecanul are peste 355.000 de izomeri.'
  },
  'C15H32': { 
    estimatedIsomers: 4000000, 
    suggestion: 'Încearcă C8H18 în schimb (18 izomeri)',
    reason: 'Această formulă are milioane de izomeri.'
  },
  // Formule imposibile (încalcă regulile de valență)
  'CH5': 'Carbonul nu poate avea 5 legături. Încearcă CH4 în schimb.',
  'CH3': 'Formula este incompletă. Încearcă CH4 în schimb.',
  'H3O': 'Această formulă încalcă regulile de valență. Încearcă H2O în schimb.',
  'C2H7': 'Această formulă încalcă regulile de valență. Încearcă C2H6 în schimb.',
  'CH2': 'Formula este incompletă pentru o moleculă stabilă. Încearcă CH4.',
  'C3H9': 'Această formulă încalcă regulile de valență. Încearcă C3H8 în schimb.'
};

const educationalSuggestions = {
  incepatori: [
    { formula: 'C4H10', descriere: 'Butanul - 2 izomeri (bun pentru început)' },
    { formula: 'C5H12', descriere: 'Pentanul - 3 izomeri (ușor de înțeles)' },
    { formula: 'C4H8', descriere: 'Butena - 3 izomeri (include izomerie de poziție)' },
    { formula: 'C3H6O', descriere: 'Propanona/propanal - 2 izomeri (include grupe funcționale)' }
  ],
  intermediari: [
    { formula: 'C6H14', descriere: 'Hexanul - 5 izomeri (izomerie de catenă)' },
    { formula: 'C6H12', descriere: 'Hexena - mulți izomeri (poziție și geometrie)' },
    { formula: 'C5H10O', descriere: 'Pentanona - mai mulți izomeri funcționali' },
    { formula: 'C4H10O', descriere: 'Butanolul - 4 izomeri (alcool)' }
  ],
  avansati: [
    { formula: 'C7H16', descriere: 'Heptanul - 9 izomeri (complexitate medie)' },
    { formula: 'C8H18', descriere: 'Octanul - 18 izomeri (mai complex)' },
    { formula: 'C6H6', descriere: 'Benzenul - structură aromatică' },
    { formula: 'C4H8O2', descriere: 'Acid butiric/ester - izomerie funcțională' }
  ]
};

// Funcție pentru calcularea complexității aproximative
function calculateFormulaComplexity(formula) {
  // Extrage numărul de atomi de carbon
  const carbonMatch = formula.match(/C(\d*)/);
  const carbons = carbonMatch ? (carbonMatch[1] ? parseInt(carbonMatch[1]) : 1) : 0;
  
  // Extrage numărul de atomi de hidrogen
  const hydrogenMatch = formula.match(/H(\d*)/);
  const hydrogens = hydrogenMatch ? (hydrogenMatch[1] ? parseInt(hydrogenMatch[1]) : 1) : 0;
  
  // Verifică prezența altor atomi (O, N, S, halogeni, etc.)
  const otherAtoms = formula.match(/[ONSFPBR]|Cl|Br|I/g);
  const heteroatomCount = otherAtoms ? otherAtoms.length : 0;
  
  // Calculează complexitatea
  let complexity = 0;
  if (carbons > 0) {
    // Creștere exponențială pentru carbon
    complexity = Math.pow(2, Math.max(0, carbons - 3));
    
    // Ajustare pentru heteroatomi
    if (heteroatomCount > 0) {
      complexity *= (heteroatomCount + 1);
    }
  }
  
  return {
    carbons: carbons,
    hydrogens: hydrogens,
    heteroatoms: heteroatomCount,
    complexity: complexity,
    level: getComplexityLevel(carbons, complexity)
  };
}

function getComplexityLevel(carbons, complexity) {
  if (carbons <= 4) return 'simplu';
  if (carbons <= 6) return 'mediu';
  if (carbons <= 8) return 'complex';
  return 'foarte_complex';
}

// Funcție pentru validarea formulei chimice
function validateChemicalFormula(formula) {
  // Verifică formatul de bază
  const basicPattern = /^[A-Z][a-z]?(\d*([A-Z][a-z]?\d*)*)*$/;
  if (!basicPattern.test(formula)) {
    return {
      valid: false,
      reason: 'Formula nu respectă formatul chimic standard. Folosește format ca: C4H10, C6H12O, etc.'
    };
  }
  
  // Verifică dacă este în lista de molecule fără izomeri
  if (noIsomerMolecules[formula]) {
    return {
      valid: false,
      reason: noIsomerMolecules[formula],
      type: 'no_isomers',
      suggestions: educationalSuggestions.incepatori.slice(0, 3)
    };
  }
  
  // Verifică dacă este în lista de formule problematice
  if (problematicFormulas[formula]) {
    const problematic = problematicFormulas[formula];
    if (typeof problematic === 'string') {
      return {
        valid: false,
        reason: problematic,
        type: 'invalid_formula',
        suggestions: educationalSuggestions.incepatori.slice(0, 3)
      };
    } else {
      return {
        valid: false,
        reason: problematic.reason,
        type: 'too_complex',
        suggestion: problematic.suggestion,
        estimatedIsomers: problematic.estimatedIsomers,
        suggestions: educationalSuggestions.intermediari.slice(0, 3)
      };
    }
  }
  
  // Calculează complexitatea
  const complexity = calculateFormulaComplexity(formula);
  
  // Verifică dacă este prea complexă
  if (complexity.carbons >= 10) {
    return {
      valid: false,
      reason: `Formulele cu ${complexity.carbons} atomi de carbon au de obicei foarte mulți izomeri (potențial mii sau zeci de mii). Pentru învățare, recomandăm formule mai simple.`,
      type: 'too_complex',
      suggestions: complexity.carbons > 12 ? educationalSuggestions.intermediari : educationalSuggestions.avansati
    };
  }
  
  // Avertisment pentru complexitate medie-mare
  if (complexity.level === 'complex') {
    return {
      valid: true,
      warning: `Această formulă poate avea mulți izomeri (${complexity.carbons} atomi de carbon). Generarea poate dura 1-2 minute.`,
      complexity: complexity,
      suggestions: educationalSuggestions.intermediari.slice(0, 2)
    };
  }
  
  return {
    valid: true,
    complexity: complexity
  };
}

// ── Email Configuration ───────────────────────────────────────────
let emailTransporter = null;

// Initialize email transporter
function initializeEmailTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASS) {
    console.log('⚠️  Email notifications disabled: Gmail credentials not configured');
    return;
  }

  try {
    emailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASS
      }
    });
    
    console.log('📧 Email transporter initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize email transporter:', error);
  }
}

// Send email function
async function sendEmail(to, subject, htmlContent) {
  if (!emailTransporter) {
    console.log('Email not sent - transporter not initialized');
    return false;
  }

  try {
    const info = await emailTransporter.sendMail({
      from: `"Atomify Platform" <${process.env.GMAIL_USER}>`,
      to: to,
      subject: subject,
      html: htmlContent
    });
    
    console.log(`📧 Email sent to ${to}:`, info.messageId);
    return true;
  } catch (error) {
    console.error(`❌ Email failed to ${to}:`, error.message);
    return false;
  }
}

// Send homework notification (with preference check)
async function sendHomeworkNotification(userEmail, username, homeworkTitle, className, dueDate, userId = null) {
  // Check user email preferences if userId is provided
  if (userId) {
    const preferences = await getUserEmailPreferences(userId);
    if (!preferences.email_homework_notifications) {
      console.log(`Homework notification skipped for user ${userId} - disabled in preferences`);
      return false;
    }
  }
  
  const subject = `New Homework: ${homeworkTitle}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c5aa0;">📚 New Homework Assignment</h2>
      <p>Hi <strong>${username}</strong>,</p>
      <p>You have a new homework assignment in <strong>${className}</strong>:</p>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #495057; margin-top: 0;">${homeworkTitle}</h3>
        <p><strong>Due:</strong> ${dueDate}</p>
      </div>
      
      <p>
        <a href="https://atomify.info/admin.html" 
           style="background: #2c5aa0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          View Homework
        </a>
      </p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e9ecef;">
      <p style="color: #6c757d; font-size: 12px;">
        This is an automated message from Atomify. 
        <a href="https://atomify.info">Visit Platform</a> | 
        <a href="https://atomify.info/admin.html">Manage Email Preferences</a>
      </p>
    </div>
  `;
  
  return await sendEmail(userEmail, subject, htmlContent);
}

// Send new quiz notification
async function sendQuizNotification(userEmail, username, quizTitle, quizDescription) {
  const subject = `New Quiz Available: ${quizTitle}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #28a745;">🧪 New Chemistry Quiz</h2>
      <p>Hi <strong>${username}</strong>,</p>
      <p>A new quiz is now available:</p>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #495057; margin-top: 0;">${quizTitle}</h3>
        <p>${quizDescription}</p>
      </div>
      
      <p>
        <a href="https://atomify.info/chestionare.html" 
           style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Take Quiz Now
        </a>
      </p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e9ecef;">
      <p style="color: #6c757d; font-size: 12px;">
        This is an automated message from Atomify. 
        <a href="https://atomify.info">Visit Platform</a>
      </p>
    </div>
  `;
  
  return await sendEmail(userEmail, subject, htmlContent);
}

// Send grade notification (with preference check)
async function sendGradeNotification(userEmail, username, quizTitle, score, totalQuestions, percentage, userId = null) {
  // Check user email preferences if userId is provided
  if (userId) {
    const preferences = await getUserEmailPreferences(userId);
    if (!preferences.email_grade_notifications) {
      console.log(`Grade notification skipped for user ${userId} - disabled in preferences`);
      return false;
    }
  }
  
  const subject = `Quiz Results: ${quizTitle}`;
  const emoji = percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : '📚';
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #17a2b8;">${emoji} Quiz Results</h2>
      <p>Hi <strong>${username}</strong>,</p>
      <p>Your results for <strong>${quizTitle}</strong> are ready:</p>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <h3 style="color: #495057; margin-top: 0;">Your Score</h3>
        <div style="font-size: 36px; font-weight: bold; color: ${percentage >= 60 ? '#28a745' : '#dc3545'};">
          ${score}/${totalQuestions}
        </div>
        <div style="font-size: 24px; color: #6c757d;">
          ${percentage.toFixed(1)}%
        </div>
      </div>
      
      <p>
        <a href="https://atomify.info/leaderboard.html" 
           style="background: #17a2b8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          View Leaderboard
        </a>
      </p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e9ecef;">
      <p style="color: #6c757d; font-size: 12px;">
        This is an automated message from Atomify. 
        <a href="https://atomify.info">Visit Platform</a> | 
        <a href="https://atomify.info/admin.html">Manage Email Preferences</a>
      </p>
    </div>
  `;
  
  return await sendEmail(userEmail, subject, htmlContent);
}

// Send newsletter subscription confirmation
async function sendNewsletterConfirmation(userEmail, username = null) {
  const subject = "Welcome to Atomify Newsletter! 🧪";
  const displayName = username || "Chemistry Enthusiast";
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c5aa0;">🧪 Welcome to Atomify Newsletter!</h2>
      <p>Hi <strong>${displayName}</strong>,</p>
      <p>Thank you for subscribing to our newsletter! We're excited to have you join our community of chemistry enthusiasts.</p>
      
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; margin: 20px 0; color: white;">
        <h3 style="margin-top: 0; color: white;">What to expect:</h3>
        <ul style="margin: 0; padding-left: 20px;">
          <li>🔬 Latest chemistry news and discoveries</li>
          <li>📚 New educational content and resources</li>
          <li>🎯 Quiz updates and challenges</li>
          <li>💡 Study tips and exam preparation guides</li>
          <li>🏆 Platform updates and new features</li>
        </ul>
      </div>
      
      <p>
        <a href="https://atomify.info" 
           style="background: #2c5aa0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Explore Atomify Platform
        </a>
      </p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e9ecef;">
      <p style="color: #6c757d; font-size: 12px;">
        This is a confirmation email from Atomify. 
        <a href="https://atomify.info">Visit Platform</a> | 
        <a href="https://atomify.info/admin.html">Manage Newsletter Preferences</a>
      </p>
    </div>
  `;
  
  return await sendEmail(userEmail, subject, htmlContent);
}

// Get user email preferences
async function getUserEmailPreferences(userId) {
  return new Promise((resolve) => {
    userDb.get(
      "SELECT * FROM email_preferences WHERE user_id = ?",
      [userId],
      (err, row) => {
        if (err || !row) {
          // Return default preferences if none found
          console.log(`No email preferences found for user ${userId}, using defaults`);
          resolve({
            email_homework_notifications: 1,
            email_quiz_notifications: 1,
            email_grade_notifications: 1,
            email_general_notifications: 1,
            newsletter_subscription: 0,
            newsletter_email: null
          });
        } else {
          resolve(row);
        }
      }
    );
  });
}

// Create default email preferences for new user
function createDefaultEmailPreferences(userId) {
  userDb.run(
    `INSERT OR IGNORE INTO email_preferences (user_id) VALUES (?)`,
    [userId],
    (err) => {
      if (err) {
        console.error(`Error creating email preferences for user ${userId}:`, err);
      } else {
        console.log(`📧 Default email preferences created for user ${userId}`);
      }
    }
  );
}

// Initialize email on startup
initializeEmailTransporter();

// ── user registration ─────────────────────────────────────────────
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  // Input validation
  if (!username || !password) {
    return res.status(400).json({ error: "Username și parola sunt obligatorii" });
  }

  if (username.length > 50) {
    return res.status(400).json({ error: "Numele de utilizator nu poate avea mai mult de 50 de caractere" });
  }

  if (username.trim().length === 0) {
    return res.status(400).json({ error: "Numele de utilizator nu poate fi gol" });
  }

  // Check for profanity in username
  try {
    const profanityCheck = await containsProfanity(username);
    if (profanityCheck.hasProfanity) {
      return res.status(400).json({ 
        error: "Numele de utilizator conține cuvinte nepermise. Te rugăm să alegi un alt nume." 
      });
    }
  } catch (error) {
    console.error('Profanity check failed during registration:', error);
    // Continue with registration if profanity check fails
  }

  // Password validation
  if (password.length < 8) {
    return res.status(400).json({ error: "Parola trebuie să aibă cel puțin 8 caractere" });
  }

  if (!/[A-Z]/.test(password)) {
    return res.status(400).json({ error: "Parola trebuie să conțină cel puțin o literă mare" });
  }

  if (!/[0-9]/.test(password)) {
    return res.status(400).json({ error: "Parola trebuie să conțină cel puțin o cifră" });
  }

  userDb.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (row) return res.status(400).json({ error: "Numele de utilizator este deja folosit" });

    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return res.status(500).json({ error: "Hashing error" });

      userDb.run(
        "INSERT INTO users (username, password, created_at) VALUES (?, ?, ?)",
        [username, hash, new Date().toISOString()],
        function (err) {
          if (err) return res.status(500).json({ error: "DB error" });
          
          // Initialize user stats for badge system
          initializeUserStats(this.lastID);
          
          // Create default email preferences
          createDefaultEmailPreferences(this.lastID);
          
          res.json({ message: "Utilizator creat cu succes" });
        }
      );
    });
  });
});

// ── user login ────────────────────────────────────────────────────
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Missing fields" });

  // Username validation
  if (username.length > 50) {
    return res.status(400).json({ error: "Numele de utilizator nu poate avea mai mult de 50 de caractere" });
  }
  if (username.trim().length === 0) {
    return res.status(400).json({ error: "Numele de utilizator nu poate fi gol" });
  }

  userDb.get(
    "SELECT id,password FROM users WHERE username = ?",
    [username.trim()],
    (err, row) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (!row) return res.status(401).json({ error: "Invalid credentials" });

      bcrypt.compare(password, row.password, (err, ok) => {
        if (err) return res.status(500).json({ error: "Compare error" });
        if (!ok) return res.status(401).json({ error: "Invalid credentials" });
        req.session.userId = row.id;
        res.json({ message: "Logged in" });
      });
    }
  );
});

// ── user logout ───────────────────────────────────────────────────
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.json({ message: "Logged out successfully" });
  });
});

// ── Google OAuth routes ──────────────────────────────────────────
app.get("/auth/google", passport.authenticate("google", {
  scope: ["profile", "email"],
  accessType: "offline",
  prompt: "consent"
}));

app.get("/auth/google/callback",
  passport.authenticate("google", { 
    failureRedirect: "/?auth=failed",
    failureMessage: true 
  }),
  (req, res) => {
    // Successful authentication
    req.session.userId = req.user.id;
    res.redirect("/app/isomers.html?auth=success");
  }
);

// ── get current user info ─────────────────────────────────────────
app.get("/user", (req, res) => {
  if (!req.session.userId && !req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  const userId = req.session.userId || req.user.id;
  userDb.get(
    "SELECT id, username, email, role, country, google_id, password FROM users WHERE id = ?",
    [userId],
    (err, row) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (!row) return res.status(401).json({ error: "User not found" });
      
      // Determine if user is Google OAuth user
      const isGoogleUser = row.google_id && !row.password;
      
      // Debug logging for Google user detection
      console.log(`User ${row.username} (ID: ${row.id}):`);
      console.log(`  google_id: ${row.google_id}`);
      console.log(`  password: ${row.password ? '[REDACTED]' : 'null'}`);
      console.log(`  isGoogleUser: ${isGoogleUser}`);
      
      // Update user activity for badge tracking
      updateUserActivity(row.id);
      
      res.json({ 
        user: { 
          id: row.id, 
          username: row.username, 
          email: row.email, 
          role: row.role, 
          country: row.country,
          isGoogleUser: isGoogleUser
        } 
      });
    }
  );
});

// ── set user role ─────────────────────────────────────────────────
app.post("/set-role", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { role } = req.body;
  if (!role || !['student', 'professor'].includes(role)) {
    return res.status(400).json({ error: "Invalid role. Must be 'student' or 'professor'" });
  }

  userDb.run(
    "UPDATE users SET role = ? WHERE id = ?",
    [role, req.session.userId],
    function (err) {
      if (err) {
        console.error("Error setting user role:", err);
        return res.status(500).json({ error: "DB error" });
      }
      res.json({ message: "Role set successfully", role: role });
    }
  );
});

// ── set user country ──────────────────────────────────────────────
app.post("/set-country", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { country } = req.body;
  if (!country || typeof country !== 'string' || country.trim().length === 0) {
    return res.status(400).json({ error: "Country is required" });
  }

  userDb.run(
    "UPDATE users SET country = ? WHERE id = ?",
    [country.trim(), req.session.userId],
    function (err) {
      if (err) {
        console.error("Error setting user country:", err);
        return res.status(500).json({ error: "DB error" });
      }
      res.json({ message: "Country set successfully", country: country.trim() });
    }
  );
});

// ── change password ───────────────────────────────────────────────
app.post("/change-password", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Missing fields" });
  }

  // Password validation for new password
  if (newPassword.length < 8) {
    return res.status(400).json({ error: "Parola nouă trebuie să aibă cel puțin 8 caractere" });
  }
  if (!/[A-Z]/.test(newPassword)) {
    return res.status(400).json({ error: "Parola nouă trebuie să conțină cel puțin o literă mare" });
  }
  if (!/[0-9]/.test(newPassword)) {
    return res.status(400).json({ error: "Parola nouă trebuie să conțină cel puțin o cifră" });
  }

  // First verify current password
  userDb.get(
    "SELECT password FROM users WHERE id = ?",
    [req.session.userId],
    (err, row) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (!row) return res.status(401).json({ error: "User not found" });

      bcrypt.compare(currentPassword, row.password, (err, isValid) => {
        if (err) return res.status(500).json({ error: "Verification error" });
        if (!isValid) return res.status(400).json({ error: "Parola curentă este incorectă" });

        // Hash new password and update
        bcrypt.hash(newPassword, 12, (err, hash) => {
          if (err) return res.status(500).json({ error: "Hash error" });
          
          userDb.run(
            "UPDATE users SET password = ? WHERE id = ?",
            [hash, req.session.userId],
            function (err) {
              if (err) return res.status(500).json({ error: "DB error" });
              res.json({ message: "Parola a fost schimbată cu succes" });
            }
          );
        });
      });
    }
  );
});

// ── delete account ────────────────────────────────────────────────
app.post("/delete-account", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { password } = req.body;

  // Get user info to check authentication method
  userDb.get(
    "SELECT password, google_id FROM users WHERE id = ?",
    [req.session.userId],
    (err, row) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (!row) return res.status(401).json({ error: "User not found" });

      // Check if user is Google OAuth user (has google_id but no password)
      const isGoogleUser = row.google_id && !row.password;
      
      if (isGoogleUser) {
        // For Google users, no password verification needed
        deleteUserAccount(req, res);
      } else {
        // For password users, verify password
        if (!password) {
          return res.status(400).json({ error: "Password required" });
        }

        bcrypt.compare(password, row.password, (err, isValid) => {
          if (err) return res.status(500).json({ error: "Verification error" });
          if (!isValid) return res.status(400).json({ error: "Parola este incorectă" });

          deleteUserAccount(req, res);
        });
      }
    }
  );
});

// Helper function to delete user account
function deleteUserAccount(req, res) {
  userDb.run(
    "DELETE FROM users WHERE id = ?",
    [req.session.userId],
    function (err) {
      if (err) return res.status(500).json({ error: "DB error" });
      
      // Destroy session after successful deletion
      req.session.destroy((err) => {
        if (err) console.error("Session destroy error:", err);
        res.json({ message: "Contul a fost șters cu succes" });
      });
    }
  );
}

// ── Newsletter subscription endpoints ──────────────────────────────

// Subscribe to newsletter
app.post("/newsletter-subscribe", async (req, res) => {
  const { email } = req.body;
  
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: "Adresă de email validă este necesară" });
  }

  try {
    // If user is logged in, update their preferences
    if (req.session.userId) {
      // First, check if user with this email exists and it's the same user
      userDb.get(
        "SELECT id, email FROM users WHERE id = ?",
        [req.session.userId],
        (err, user) => {
          if (err) {
            console.error("Error checking user:", err);
            return res.status(500).json({ error: "Eroare de bază de date" });
          }
          
          // Update the user's email if they provided a different one
          const updateEmail = email !== user.email;
          
          userDb.run(
            `INSERT OR REPLACE INTO email_preferences 
             (user_id, email_homework_notifications, email_quiz_notifications, 
              email_grade_notifications, email_general_notifications, newsletter_subscription, newsletter_email, updated_at) 
             VALUES (?, 
               COALESCE((SELECT email_homework_notifications FROM email_preferences WHERE user_id = ?), 1),
               COALESCE((SELECT email_quiz_notifications FROM email_preferences WHERE user_id = ?), 1),
               COALESCE((SELECT email_grade_notifications FROM email_preferences WHERE user_id = ?), 1),
               COALESCE((SELECT email_general_notifications FROM email_preferences WHERE user_id = ?), 1),
               1, 
               ?,
               CURRENT_TIMESTAMP)`,
            [req.session.userId, req.session.userId, req.session.userId, req.session.userId, req.session.userId, email],
            async function(err) {
              if (err) {
                console.error("Error updating newsletter subscription:", err);
                return res.status(500).json({ error: "Eroare la actualizarea preferințelor" });
              }
              
              // Send newsletter confirmation email
              try {
                await sendNewsletterConfirmation(email, user.username);
                console.log(`📧 Newsletter confirmation sent to ${email}`);
              } catch (emailErr) {
                console.error(`Failed to send newsletter confirmation to ${email}:`, emailErr);
                // Don't fail the subscription if email fails
              }
              
              res.json({ message: "Te-ai abonat cu succes la newsletter!" });
            }
          );
        }
      );
    } else {
      // For non-logged-in users, check if there's already a user with this email
      userDb.get(
        "SELECT id FROM users WHERE email = ?",
        [email],
        (err, existingUser) => {
          if (err) {
            console.error("Error checking existing user:", err);
            return res.status(500).json({ error: "Eroare de bază de date" });
          }
          
          if (existingUser) {
            // Update existing user's newsletter subscription
                         userDb.run(
               `INSERT OR REPLACE INTO email_preferences 
                (user_id, email_homework_notifications, email_quiz_notifications, 
                 email_grade_notifications, email_general_notifications, newsletter_subscription, newsletter_email, updated_at) 
                VALUES (?, 
                  COALESCE((SELECT email_homework_notifications FROM email_preferences WHERE user_id = ?), 1),
                  COALESCE((SELECT email_quiz_notifications FROM email_preferences WHERE user_id = ?), 1),
                  COALESCE((SELECT email_grade_notifications FROM email_preferences WHERE user_id = ?), 1),
                  COALESCE((SELECT email_general_notifications FROM email_preferences WHERE user_id = ?), 1),
                  1, 
                  ?,
                  CURRENT_TIMESTAMP)`,
               [existingUser.id, existingUser.id, existingUser.id, existingUser.id, existingUser.id, email],
               async (updateErr) => {
                 if (updateErr) {
                   console.error("Error updating existing user newsletter:", updateErr);
                   return res.status(500).json({ error: "Eroare la actualizarea abonamentului" });
                 }
                 
                 // Send newsletter confirmation email
                 try {
                   await sendNewsletterConfirmation(email, email.split('@')[0]);
                   console.log(`📧 Newsletter confirmation sent to ${email}`);
                 } catch (emailErr) {
                   console.error(`Failed to send newsletter confirmation to ${email}:`, emailErr);
                   // Don't fail the subscription if email fails
                 }
                 
                 res.json({ message: "Te-ai abonat cu succes la newsletter!" });
               }
             );
          } else {
            // Create a new newsletter-only user
            userDb.run(
              "INSERT INTO users (email, username) VALUES (?, ?)",
              [email, email.split('@')[0]],
              function(insertErr) {
                if (insertErr) {
                  console.error("Error creating newsletter user:", insertErr);
                  return res.status(500).json({ error: "Eroare la crearea contului de newsletter" });
                }
                
                const newUserId = this.lastID;
                
                // Create email preferences with newsletter subscription enabled
                userDb.run(
                  `INSERT INTO email_preferences 
                   (user_id, email_homework_notifications, email_quiz_notifications, 
                    email_grade_notifications, email_general_notifications, newsletter_subscription, newsletter_email) 
                   VALUES (?, 0, 0, 0, 0, 1, ?)`,
                  [newUserId, email],
                  async (prefErr) => {
                    if (prefErr) {
                      console.error("Error creating newsletter preferences:", prefErr);
                      return res.status(500).json({ error: "Eroare la configurarea preferințelor" });
                    }
                    
                    // Send newsletter confirmation email
                    try {
                      await sendNewsletterConfirmation(email, email.split('@')[0]);
                      console.log(`📧 Newsletter confirmation sent to ${email}`);
                    } catch (emailErr) {
                      console.error(`Failed to send newsletter confirmation to ${email}:`, emailErr);
                      // Don't fail the subscription if email fails
                    }
                    
                    res.json({ message: "Te-ai abonat cu succes la newsletter!" });
                  }
                );
              }
            );
          }
        }
      );
    }
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    res.status(500).json({ error: "Eroare internă de server" });
  }
});

// Unsubscribe from newsletter
app.post("/newsletter-unsubscribe", async (req, res) => {
  const { email } = req.body;
  
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: "Adresă de email validă este necesară" });
  }

  try {
    // Find user by email
    userDb.get(
      "SELECT id FROM users WHERE email = ?",
      [email],
      (err, user) => {
        if (err) {
          console.error("Error finding user for unsubscribe:", err);
          return res.status(500).json({ error: "Eroare de bază de date" });
        }
        
        if (!user) {
          return res.status(404).json({ error: "Nu am găsit niciun abonament cu această adresă de email" });
        }
        
        // Update newsletter subscription to false
        userDb.run(
          `INSERT OR REPLACE INTO email_preferences 
           (user_id, email_homework_notifications, email_quiz_notifications, 
            email_grade_notifications, email_general_notifications, newsletter_subscription, newsletter_email, updated_at) 
           VALUES (?, 
             COALESCE((SELECT email_homework_notifications FROM email_preferences WHERE user_id = ?), 1),
             COALESCE((SELECT email_quiz_notifications FROM email_preferences WHERE user_id = ?), 1),
             COALESCE((SELECT email_grade_notifications FROM email_preferences WHERE user_id = ?), 1),
             COALESCE((SELECT email_general_notifications FROM email_preferences WHERE user_id = ?), 1),
             0, 
             COALESCE((SELECT newsletter_email FROM email_preferences WHERE user_id = ?), NULL),
             CURRENT_TIMESTAMP)`,
          [user.id, user.id, user.id, user.id, user.id, user.id],
          (updateErr) => {
            if (updateErr) {
              console.error("Error unsubscribing from newsletter:", updateErr);
              return res.status(500).json({ error: "Eroare la dezabonare" });
            }
            
            res.json({ message: "Te-ai dezabonat cu succes de la newsletter." });
          }
        );
      }
    );
  } catch (error) {
    console.error("Newsletter unsubscribe error:", error);
    res.status(500).json({ error: "Eroare internă de server" });
  }
});

// Check newsletter subscription status
app.get("/newsletter-status", (req, res) => {
  if (!req.session.userId) {
    return res.json({ subscribed: false, email: null });
  }

  userDb.get(
    `SELECT u.email as account_email, ep.newsletter_subscription, ep.newsletter_email 
     FROM users u 
     LEFT JOIN email_preferences ep ON u.id = ep.user_id 
     WHERE u.id = ?`,
    [req.session.userId],
    (err, result) => {
      if (err) {
        console.error("Error checking newsletter status:", err);
        return res.status(500).json({ error: "Eroare de bază de date" });
      }
      
      res.json({
        subscribed: result && result.newsletter_subscription === 1,
        email: result && result.newsletter_email ? result.newsletter_email : (result ? result.account_email : null)
      });
    }
  );
});

// ── save isomer generation to history ─────────────────────────────
app.post("/save-isomer", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { formula, isomerCount } = req.body;
  if (!formula || isomerCount === undefined) {
    return res.status(400).json({ error: "Missing formula or isomer count" });
  }

  userDb.run(
    "INSERT INTO user_isomers (user_id, formula, isomer_count) VALUES (?, ?, ?)",
    [req.session.userId, formula, isomerCount],
    function (err) {
      if (err) {
        console.error("Error saving isomer:", err);
        return res.status(500).json({ error: "DB error" });
      }
      res.json({ message: "Isomer saved to history", id: this.lastID });
    }
  );
});

// ── save quiz result to history ───────────────────────────────────
app.post("/save-quiz-result", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { quizId, quizName, score, totalQuestions, percentage, timeTaken, answers, classId, isHomework, homeworkId } = req.body;

  if (!quizId || !quizName || score === undefined || !totalQuestions || !percentage || !timeTaken || !answers) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const userId = req.session.userId;

  // Save to quiz_results table
  userDb.run(
    `INSERT INTO quiz_results (user_id, quiz_id, quiz_name, score, total_questions, percentage, time_taken, answers, class_id, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, quizId, quizName, score, totalQuestions, percentage, timeTaken, JSON.stringify(answers), classId || null, new Date().toISOString()],
    function (err) {
      if (err) {
        console.error("Error saving quiz result:", err);
        return res.status(500).json({ error: "Database error" });
      }

      // Update quiz stats and check for badges
      updateQuizStats(userId, score, totalQuestions, timeTaken);
      updateUserActivity(userId);

      // Handle homework submission if applicable
      if (isHomework && homeworkId) {
        // Get current attempt number
        userDb.get(
          'SELECT COUNT(*) as attempt_count FROM homework_submissions WHERE homework_id = ? AND user_id = ?',
          [homeworkId, userId],
          (err, result) => {
            if (err) {
              console.error('Error getting attempt count:', err);
              return res.json({ message: "Quiz result saved successfully", id: this.lastID });
            }

            const attemptNumber = (result.attempt_count || 0) + 1;

            // Save homework submission
            userDb.run(
              `INSERT INTO homework_submissions (homework_id, user_id, quiz_id, score, total_questions, percentage, time_taken, attempt_number, answers)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [homeworkId, userId, quizId, score, totalQuestions, percentage, timeTaken, attemptNumber, JSON.stringify(answers)],
              (err) => {
                if (err) {
                  console.error('Error saving homework submission:', err);
                }
                res.json({ message: "Quiz result and homework submission saved successfully", id: this.lastID });
              }
            );
          }
        );
      } else {
        res.json({ message: "Quiz result saved successfully", id: this.lastID });
      }
    }
  );
});

// ── save formula to history ──────────────────────────────────────
app.post("/save-formula", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { formula, isomers, complexity } = req.body;

  if (!formula || !isomers || !complexity) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  userDb.run(
    "INSERT INTO formula_history (user_id, formula, isomers, complexity, created_at) VALUES (?, ?, ?, ?, ?)",
    [req.session.userId, formula, JSON.stringify(isomers), complexity, new Date().toISOString()],
    function (err) {
      if (err) {
        console.error("Error saving formula:", err);
        return res.status(500).json({ error: "Database error" });
      }
      
      // Update isomer generation stats and check for badges
      updateIsomerStats(req.session.userId);
      updateUserActivity(req.session.userId);
      
      res.json({ message: "Formula saved successfully", id: this.lastID });
    }
  );
});

// ── Quiz API endpoints ────────────────────────────────────────────
const quizData = require('./quiz-data.js');

// Fisher-Yates shuffle algorithm
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Get quiz questions (without correct answers)
app.get("/api/quiz/:quizId", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Trebuie să vă autentificați pentru a accesa chestionarele." });
  }

  const quizId = req.params.quizId;
  
  // Check if this is a classroom quiz
  if (quizId.startsWith('classroom_')) {
    const classroomQuizId = parseInt(quizId.replace('classroom_', ''));
    return res.redirect(307, `/api/classroom-quiz/${classroomQuizId}`);
  }
  
  const quiz = quizData[quizId];
  
  if (!quiz) {
    return res.status(404).json({ error: "Chestionarul nu a fost găsit." });
  }
  
  if (!quiz.questions || !Array.isArray(quiz.questions)) {
    console.error('Quiz questions is not an array:', quiz.questions);
    return res.status(500).json({ error: "Datele chestionarului sunt corupte." });
  }
  
  // Create randomized questions and answers
  const shuffledQuestions = shuffleArray(quiz.questions);
  
  const randomizedQuestions = shuffledQuestions.map(question => {
    // Handle text questions differently (check both type and absence of options)
    if (question.type === 'text' || !question.options || question.correctAnswers) {
      return {
        id: question.id,
        question: question.question,
        type: question.type || 'text',
        // Text questions don't need randomization
        correctAnswers: question.correctAnswers,
        explanation: question.explanation
      };
    }
    
    // Handle multiple choice questions
    if (!question.options || !Array.isArray(question.options)) {
      console.error(`Question ${question.id} has no options:`, question);
      throw new Error(`Question ${question.id} is missing options array`);
    }
    
    // Store the original correct answer index
    const originalCorrectIndex = question.correctAnswer;
    
    // Create array of options with their original indices
    const optionsWithIndices = question.options.map((option, index) => ({
      option,
      originalIndex: index
    }));
    
    // Shuffle the options
    const shuffledOptions = shuffleArray(optionsWithIndices);
    
    // Find the new index of the correct answer
    const newCorrectIndex = shuffledOptions.findIndex(
      item => item.originalIndex === originalCorrectIndex
    );
    
    return {
      id: question.id,
      question: question.question,
      options: shuffledOptions.map(item => item.option),
      // Store the randomization mapping for answer validation
      originalCorrectAnswer: originalCorrectIndex,
      randomizedCorrectAnswer: newCorrectIndex,
      optionMapping: shuffledOptions.map(item => item.originalIndex)
    };
  });
  
  // Send quiz data without correct answers (but with randomization info for validation)
  const safeQuiz = {
    title: quiz.title,
    description: quiz.description,
    timeLimit: quiz.timeLimit,
    questions: randomizedQuestions.map(q => {
      if (q.type === 'text') {
        return {
          id: q.id,
          question: q.question,
          type: q.type
          // Don't include correctAnswers in safe quiz - that would give away the answers!
        };
      } else {
        return {
          id: q.id,
          question: q.question,
          options: q.options,
          // Include mapping info for answer validation (hidden from UI)
          optionMapping: q.optionMapping
        };
      }
    })
  };
  
  res.json(safeQuiz);
});

// Submit quiz answers and get results
app.post("/api/quiz/:quizId/submit", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Trebuie să vă autentificați pentru a trimite rezultatele." });
  }

  const quizId = req.params.quizId;
  const { answers, timeTaken, classId, questionMappings } = req.body; // answers should be an object: { questionId: selectedOptionIndex, ... }
  
  // Check if this is a classroom quiz
  if (quizId.startsWith('classroom_')) {
    const classroomQuizId = parseInt(quizId.replace('classroom_', ''));
    return handleClassroomQuizSubmission(req, res, classroomQuizId, answers, timeTaken, questionMappings);
  }
  
  const quiz = quizData[quizId];
  if (!quiz) {
    return res.status(404).json({ error: "Chestionarul nu a fost găsit." });
  }
  
  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ error: "Răspunsurile sunt invalide." });
  }
  
  // Validate time taken (should be positive and reasonable)
  const timeInSeconds = parseInt(timeTaken) || 0;
  if (timeInSeconds < 0 || timeInSeconds > quiz.timeLimit + 60) {
    return res.status(400).json({ error: "Timpul invalid." });
  }
  
  // Text normalization function for Romanian quiz answers
  function normalizeQuizText(text) {
    if (!text || typeof text !== 'string') return '';
    
    return text
      .toLowerCase()
      .trim()
      // Remove Romanian diacritics
      .replace(/[ăâ]/g, 'a')
      .replace(/[îí]/g, 'i')
      .replace(/[șş]/g, 's')
      .replace(/[țţ]/g, 't')
      .replace(/[ée]/g, 'e')
      .replace(/[óô]/g, 'o')
      // Remove extra spaces
      .replace(/\s+/g, ' ')
      // Remove common punctuation that doesn't affect meaning
      .replace(/[.,;:!?]/g, '');
  }

  // Calculate score with randomization support
  let correct = 0;
  const results = [];
  
  quiz.questions.forEach(question => {
    const userAnswer = answers[question.id];
    const questionMapping = questionMappings && questionMappings[question.id];
    
    let isCorrect = false;
    let mappedUserAnswer = userAnswer;
    let displayOptions = question.options;
    let displayCorrectAnswer = question.correctAnswer;
    
    if (question.type === 'text') {
      // Handle text questions
      if (question.correctAnswers && Array.isArray(question.correctAnswers)) {
        const normalizedUserAnswer = normalizeQuizText(userAnswer);
        isCorrect = question.correctAnswers.some(correctAnswer => 
          normalizeQuizText(correctAnswer) === normalizedUserAnswer
        );
      }
      
      // For text questions, we don't need option mapping
      displayOptions = null;
      displayCorrectAnswer = null;
      
    } else {
      // Handle multiple choice questions
      // If we have mapping info (randomized quiz), convert back to original indices
      if (questionMapping && questionMapping.optionMapping) {
        // Map the user's selected index back to the original option index
        if (userAnswer !== undefined && userAnswer !== null) {
          mappedUserAnswer = questionMapping.optionMapping[userAnswer];
        }
        
        // Create display options in the randomized order
        displayOptions = questionMapping.optionMapping.map(originalIndex => 
          question.options[originalIndex]
        );
      }
      
      // Check if answer is correct using original indices
      isCorrect = mappedUserAnswer === question.correctAnswer;
      
      // For results display, we need to show the randomized options and correct answer
      if (questionMapping && questionMapping.optionMapping) {
        // Find where the correct answer appears in the randomized options
        displayCorrectAnswer = questionMapping.optionMapping.findIndex(
          originalIndex => originalIndex === question.correctAnswer
        );
      }
    }
    
    if (isCorrect) {
      correct++;
    }
    
    results.push({
      questionId: question.id,
      question: question.question,
      type: question.type,
      options: displayOptions,
      userAnswer: userAnswer, // Keep the randomized index for display (or text for text questions)
      correctAnswer: displayCorrectAnswer, // Correct answer in randomized order (or null for text)
      correctAnswers: question.correctAnswers, // For text questions
      isCorrect: isCorrect,
      explanation: question.explanation
    });
  });
  
  const score = correct;
  const totalQuestions = quiz.questions.length;
  const percentage = Math.round((score / totalQuestions) * 100);
  
  // Save to legacy user history table
  userDb.run(
    "INSERT INTO user_quiz_results (user_id, quiz_name, score, total_questions) VALUES (?, ?, ?, ?)",
    [req.session.userId, quiz.title, score, totalQuestions],
    function (err) {
      if (err) {
        console.error("Error saving quiz result to legacy table:", err);
      }
    }
  );
  
  // Save to enhanced quiz results table for leaderboards
  userDb.run(
    "INSERT INTO quiz_results (user_id, quiz_id, quiz_name, score, total_questions, percentage, time_taken, class_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [req.session.userId, quizId, quiz.title, score, totalQuestions, percentage, timeInSeconds, classId || null],
    function (err) {
      if (err) {
        console.error("Error saving quiz result to enhanced table:", err);
      } else {
        console.log(`Quiz result saved: ${quiz.title} - ${score}/${totalQuestions} (${percentage}%) in ${timeInSeconds}s`);
        
        // Update user stats and check for badges
        updateQuizStats(req.session.userId, score, totalQuestions, timeInSeconds);
        updateUserActivity(req.session.userId);
      }
    }
  );
  
  // Send grade notification email
  try {
    userDb.get(
      "SELECT email, username FROM users WHERE id = ?",
      [req.session.userId],
      async (err, user) => {
        if (!err && user && user.email) {
          try {
            await sendGradeNotification(
              user.email,
              user.username,
              quiz.title,
              score,
              totalQuestions,
              percentage,
              req.session.userId
            );
          } catch (emailErr) {
            console.error(`Failed to send grade notification to ${user.email}:`, emailErr);
          }
        }
      }
    );
  } catch (error) {
    console.error("Error in grade notification process:", error);
  }

  res.json({
    score: score,
    totalQuestions: totalQuestions,
    percentage: percentage,
    timeTaken: timeInSeconds,
    results: results
  });
});

// Handle classroom quiz submission
function handleClassroomQuizSubmission(req, res, classroomQuizId, answers, timeTaken, questionMappings) {
  // Get the classroom quiz
  userDb.get(
    `SELECT cq.*, c.name as class_name 
     FROM classroom_quizzes cq 
     JOIN classes c ON cq.class_id = c.id 
     WHERE cq.id = ? AND cq.is_active = 1`,
    [classroomQuizId],
    (err, quiz) => {
      if (err) {
        console.error("Error fetching classroom quiz for submission:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      // Verify user has access to this quiz (is a student in the class)
      userDb.get(
        "SELECT student_id FROM class_members WHERE class_id = ? AND student_id = ?",
        [quiz.class_id, req.session.userId],
        (err, membership) => {
          if (err) {
            console.error("Error checking class membership:", err);
            return res.status(500).json({ error: "Database error" });
          }

          if (!membership) {
            return res.status(403).json({ error: "Access denied to this quiz" });
          }

          // Parse questions and calculate score
          const questions = JSON.parse(quiz.questions);
          let correct = 0;
          const results = [];

          // Text normalization function for Romanian quiz answers
          function normalizeQuizText(text) {
            if (!text || typeof text !== 'string') return '';
            
            return text
              .toLowerCase()
              .trim()
              .replace(/[ăâ]/g, 'a')
              .replace(/[îí]/g, 'i')
              .replace(/[șş]/g, 's')
              .replace(/[țţ]/g, 't')
              .replace(/[ée]/g, 'e')
              .replace(/[óô]/g, 'o')
              .replace(/\s+/g, ' ')
              .replace(/[.,;:!?]/g, '');
          }

          questions.forEach(question => {
            const userAnswer = answers[question.id];
            const questionMapping = questionMappings && questionMappings[question.id];
            
            let isCorrect = false;
            let mappedUserAnswer = userAnswer;
            let displayOptions = question.options;
            let displayCorrectAnswer = question.correctAnswer;
            
            if (question.type === 'text') {
              if (question.correctAnswers && Array.isArray(question.correctAnswers)) {
                const normalizedUserAnswer = normalizeQuizText(userAnswer);
                isCorrect = question.correctAnswers.some(correctAnswer => 
                  normalizeQuizText(correctAnswer) === normalizedUserAnswer
                );
              }
              displayOptions = null;
              displayCorrectAnswer = null;
            } else {
              // Handle multiple choice questions with randomization
              if (questionMapping && questionMapping.optionMapping) {
                if (userAnswer !== undefined && userAnswer !== null) {
                  mappedUserAnswer = questionMapping.optionMapping[userAnswer];
                }
                displayOptions = questionMapping.optionMapping.map(originalIndex => 
                  question.options[originalIndex]
                );
                displayCorrectAnswer = questionMapping.optionMapping.findIndex(
                  originalIndex => originalIndex === question.correctAnswer
                );
              }
              isCorrect = mappedUserAnswer === question.correctAnswer;
            }
            
            if (isCorrect) {
              correct++;
            }
            
            results.push({
              questionId: question.id,
              question: question.question,
              userAnswer: userAnswer,
              correctAnswer: displayCorrectAnswer,
              options: displayOptions,
              isCorrect: isCorrect,
              explanation: question.explanation || null
            });
          });

          const totalQuestions = questions.length;
          const percentage = totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0;
          const timeInSeconds = parseInt(timeTaken) || 0;

          // Save result to database
          userDb.run(
            "INSERT INTO quiz_results (user_id, quiz_id, quiz_name, score, total_questions, percentage, time_taken, class_id, classroom_quiz_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [req.session.userId, `classroom_${classroomQuizId}`, quiz.title, correct, totalQuestions, percentage, timeInSeconds, quiz.class_id, classroomQuizId],
            function(err) {
              if (err) {
                console.error("Error saving classroom quiz result:", err);
              } else {
                console.log(`Classroom quiz result saved: ${quiz.title} - ${correct}/${totalQuestions} (${percentage}%) in ${timeInSeconds}s`);
        console.log(`Saved with quiz_id: classroom_${classroomQuizId}, class_id: ${quiz.class_id}, user_id: ${req.session.userId}`);
                
                // Update user stats and check for badges
                updateQuizStats(req.session.userId, correct, totalQuestions, timeInSeconds);
                updateUserActivity(req.session.userId);
              }
            }
          );

          // Send grade notification email
          try {
            userDb.get(
              "SELECT email, username FROM users WHERE id = ?",
              [req.session.userId],
              async (err, user) => {
                if (!err && user && user.email) {
                  try {
                    await sendGradeNotification(
                      user.email,
                      user.username,
                      `${quiz.title} (${quiz.class_name})`,
                      correct,
                      totalQuestions,
                      percentage,
                      req.session.userId
                    );
                  } catch (emailErr) {
                    console.error(`Failed to send grade notification to ${user.email}:`, emailErr);
                  }
                }
              }
            );
          } catch (error) {
            console.error("Error in grade notification process:", error);
          }

          res.json({
            score: correct,
            totalQuestions: totalQuestions,
            percentage: percentage,
            timeTaken: timeInSeconds,
            results: results,
            className: quiz.class_name
          });
        }
      );
    }
  );
}

// Get available quizzes list
app.get("/api/quizzes", async (req, res) => {
  console.log(`🔍 /api/quizzes called by user ID: ${req.session.userId}`);
  
  if (!req.session.userId) {
    return res.status(401).json({ error: "Trebuie să vă autentificați pentru a accesa chestionarele." });
  }

  try {
    // Get regular quizzes
    const regularQuizzes = Object.keys(quizData).map(quizId => ({
    id: quizId,
    title: quizData[quizId].title,
    description: quizData[quizId].description,
    questionCount: quizData[quizId].questions.length,
      timeLimit: quizData[quizId].timeLimit,
      type: 'regular'
    }));

    // Get user role first
    const userRole = await new Promise((resolve) => {
      userDb.get("SELECT role FROM users WHERE id = ?", [req.session.userId], (err, user) => {
        console.log(`👤 User ${req.session.userId} role query result:`, { err, user });
        const role = err || !user ? 'student' : user.role;
        console.log(`👤 Resolved role for user ${req.session.userId}: ${role}`);
        resolve(role);
      });
    });

    // Get classroom quizzes based on user role
    const classroomQuizzesPromise = new Promise((resolve) => {
      if (userRole === 'professor') {
        // Get classroom quizzes created by this professor
        console.log(`Fetching classroom quizzes for professor ID: ${req.session.userId}`);
        userDb.all(
          `SELECT cq.id, cq.title, cq.description, cq.time_limit, cq.questions, c.name as class_name, c.id as class_id
           FROM classroom_quizzes cq 
           JOIN classes c ON cq.class_id = c.id 
           WHERE c.professor_id = ? AND cq.is_active = 1
           ORDER BY cq.created_at DESC`,
          [req.session.userId],
          (err, quizzes) => {
            if (err) {
              console.error("Error fetching professor's classroom quizzes:", err);
              resolve([]);
            } else {
              console.log(`Found ${quizzes.length} classroom quizzes for professor ${req.session.userId}:`, quizzes.map(q => ({ id: q.id, title: q.title, class_name: q.class_name })));
              const classroomQuizzes = quizzes.map(quiz => ({
                id: `classroom_${quiz.id}`,
                title: `${quiz.title} (${quiz.class_name})`,
                description: quiz.description,
                questionCount: JSON.parse(quiz.questions || '[]').length,
                timeLimit: quiz.time_limit,
                className: quiz.class_name,
                classId: quiz.class_id,
                type: 'classroom'
              }));
              resolve(classroomQuizzes);
            }
          }
        );
      } else {
        // Get classroom quizzes for this student
        userDb.all(
          `SELECT cq.id, cq.title, cq.description, cq.time_limit, cq.questions, c.name as class_name, c.id as class_id
           FROM classroom_quizzes cq 
           JOIN classes c ON cq.class_id = c.id 
           JOIN class_members cm ON c.id = cm.class_id 
           WHERE cm.student_id = ? AND cq.is_active = 1
           ORDER BY cq.created_at DESC`,
          [req.session.userId],
          (err, quizzes) => {
            if (err) {
              console.error("Error fetching student's classroom quizzes:", err);
              resolve([]);
            } else {
              const classroomQuizzes = quizzes.map(quiz => ({
                id: `classroom_${quiz.id}`,
                title: `${quiz.title} (${quiz.class_name})`,
                description: quiz.description,
                questionCount: JSON.parse(quiz.questions || '[]').length,
                timeLimit: quiz.time_limit,
                className: quiz.class_name,
                classId: quiz.class_id,
                type: 'classroom'
              }));
              resolve(classroomQuizzes);
            }
          }
        );
      }
    });

    const classroomQuizzes = await classroomQuizzesPromise;
    const allQuizzes = [...regularQuizzes, ...classroomQuizzes];
    
    console.log(`User ${req.session.userId} (role: ${userRole}) - Total quizzes: ${allQuizzes.length}`);
    console.log(`Regular quizzes: ${regularQuizzes.length}, Classroom quizzes: ${classroomQuizzes.length}`);
    if (classroomQuizzes.length > 0) {
      console.log('Classroom quizzes for this user:', classroomQuizzes.map(q => ({ id: q.id, title: q.title })));
    }
    
    res.json(allQuizzes);
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// ── Classroom Quiz Management Endpoints ────────────────────────────

// Create a new classroom quiz
app.post("/api/classroom-quiz", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const { classId, title, description, timeLimit, questions } = req.body;

  // Validate required fields
  if (!classId || !title || !questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: "Class ID, title, and questions are required" });
  }

  // Validate time limit
  const timeLimitSeconds = parseInt(timeLimit) || 600;
  if (timeLimitSeconds < 60 || timeLimitSeconds > 7200) {
    return res.status(400).json({ error: "Time limit must be between 1 and 120 minutes" });
  }

  // Verify user is professor of this class
  userDb.get(
    "SELECT id FROM classes WHERE id = ? AND professor_id = ?",
    [classId, req.session.userId],
    (err, classRow) => {
      if (err) {
        console.error("Error verifying class ownership:", err);
        return res.status(500).json({ error: "Database error" });
      }
      
      if (!classRow) {
        return res.status(403).json({ error: "Access denied: not your class" });
      }

      // Validate questions structure
      try {
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          if (!q.question || !q.question.trim()) {
            return res.status(400).json({ error: `Question ${i + 1} is missing text` });
          }
          
          if (q.type === 'multiple-choice') {
            if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
              return res.status(400).json({ error: `Question ${i + 1} needs at least 2 options` });
            }
            if (q.correctAnswer === undefined || q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
              return res.status(400).json({ error: `Question ${i + 1} has invalid correct answer` });
            }
          } else if (q.type === 'text') {
            if (!q.correctAnswers || !Array.isArray(q.correctAnswers) || q.correctAnswers.length === 0) {
              return res.status(400).json({ error: `Question ${i + 1} needs at least one correct answer` });
            }
          } else {
            return res.status(400).json({ error: `Question ${i + 1} has invalid type` });
          }
        }
      } catch (validationErr) {
        return res.status(400).json({ error: "Invalid questions format" });
      }

      // Save the quiz
      userDb.run(
        "INSERT INTO classroom_quizzes (class_id, professor_id, title, description, time_limit, questions) VALUES (?, ?, ?, ?, ?, ?)",
        [classId, req.session.userId, title.trim(), description?.trim() || '', timeLimitSeconds, JSON.stringify(questions)],
        function(err) {
          if (err) {
            console.error("Error creating classroom quiz:", err);
            return res.status(500).json({ error: "Failed to create quiz" });
          }

          res.json({ 
            message: "Quiz created successfully", 
            quizId: this.lastID,
            id: this.lastID
          });
        }
      );
    }
  );
});

// Get classroom quizzes for a professor
app.get("/api/classroom-quizzes/professor", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  userDb.all(
    `SELECT cq.*, c.name as class_name 
     FROM classroom_quizzes cq 
     JOIN classes c ON cq.class_id = c.id 
     WHERE cq.professor_id = ? 
     ORDER BY cq.created_at DESC`,
    [req.session.userId],
    (err, quizzes) => {
      if (err) {
        console.error("Error fetching professor's classroom quizzes:", err);
        return res.status(500).json({ error: "Database error" });
      }

      res.json(quizzes.map(quiz => ({
        ...quiz,
        questions: JSON.parse(quiz.questions)
      })));
    }
  );
});

// Get classroom quizzes available to a student
app.get("/api/classroom-quizzes/student", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  userDb.all(
    `SELECT cq.id, cq.title, cq.description, cq.time_limit, cq.created_at, c.name as class_name, c.id as class_id
     FROM classroom_quizzes cq 
     JOIN classes c ON cq.class_id = c.id 
     JOIN class_members cm ON c.id = cm.class_id 
     WHERE cm.student_id = ? AND cq.is_active = 1
     ORDER BY cq.created_at DESC`,
    [req.session.userId],
    (err, quizzes) => {
      if (err) {
        console.error("Error fetching student's classroom quizzes:", err);
        return res.status(500).json({ error: "Database error" });
      }

      res.json(quizzes.map(quiz => ({
        id: `classroom_${quiz.id}`, // Prefix to distinguish from regular quizzes
        title: quiz.title,
        description: quiz.description,
        timeLimit: quiz.time_limit,
        questionCount: JSON.parse(quiz.questions || '[]').length,
        className: quiz.class_name,
        classId: quiz.class_id,
        createdAt: quiz.created_at,
        type: 'classroom'
      })));
    }
  );
});

// Get a specific classroom quiz (for taking the quiz)
app.get("/api/classroom-quiz/:quizId", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const quizId = parseInt(req.params.quizId);
  if (isNaN(quizId)) {
    return res.status(400).json({ error: "Invalid quiz ID" });
  }

  userDb.get(
    `SELECT cq.*, c.name as class_name, u.username as professor_name
     FROM classroom_quizzes cq 
     JOIN classes c ON cq.class_id = c.id 
     JOIN users u ON cq.professor_id = u.id
     WHERE cq.id = ? AND cq.is_active = 1`,
    [quizId],
    (err, quiz) => {
      if (err) {
        console.error("Error fetching classroom quiz:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      // Check if user has access (either professor or student in class)
      userDb.get(
        `SELECT 
          CASE 
            WHEN c.professor_id = ? THEN 'professor'
            WHEN cm.student_id = ? THEN 'student'
            ELSE NULL
          END as role
        FROM classes c
        LEFT JOIN class_members cm ON c.id = cm.class_id AND cm.student_id = ?
        WHERE c.id = ?`,
        [req.session.userId, req.session.userId, req.session.userId, quiz.class_id],
        (err, access) => {
          if (err) {
            console.error("Error checking quiz access:", err);
            return res.status(500).json({ error: "Database error" });
          }

          if (!access || !access.role) {
            return res.status(403).json({ error: "Access denied to this quiz" });
          }

          // Parse questions and randomize for students
          let questions = JSON.parse(quiz.questions);
          
          if (access.role === 'student') {
            // Randomize questions for students (similar to regular quiz system)
            questions = randomizeQuizQuestions(questions);
          }

          const safeQuiz = {
            id: quiz.id,
            title: quiz.title,
            description: quiz.description,
            timeLimit: quiz.time_limit,
            className: quiz.class_name,
            professorName: quiz.professor_name,
            questions: questions.map(q => {
              if (q.type === 'text') {
                return {
                  id: q.id || Math.random().toString(36).substr(2, 9),
                  question: q.question,
                  type: q.type
                };
              } else {
                return {
                  id: q.id || Math.random().toString(36).substr(2, 9),
                  question: q.question,
                  type: q.type || 'multiple-choice',
                  options: q.options,
                  optionMapping: q.optionMapping
                };
              }
            }),
            isClassroomQuiz: true,
            classId: quiz.class_id
          };

          res.json(safeQuiz);
        }
      );
    }
  );
});

// Update a classroom quiz
app.put("/api/classroom-quiz/:quizId", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const quizId = parseInt(req.params.quizId);
  const { title, description, timeLimit, questions } = req.body;

  if (isNaN(quizId)) {
    return res.status(400).json({ error: "Invalid quiz ID" });
  }

  // Verify ownership
  userDb.get(
    "SELECT id FROM classroom_quizzes WHERE id = ? AND professor_id = ?",
    [quizId, req.session.userId],
    (err, quiz) => {
      if (err) {
        console.error("Error verifying quiz ownership:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (!quiz) {
        return res.status(403).json({ error: "Quiz not found or access denied" });
      }

      // Validate fields (similar to create)
      if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ error: "Title and questions are required" });
      }

      const timeLimitSeconds = parseInt(timeLimit) || 600;
      if (timeLimitSeconds < 60 || timeLimitSeconds > 7200) {
        return res.status(400).json({ error: "Time limit must be between 1 and 120 minutes" });
      }

      userDb.run(
        "UPDATE classroom_quizzes SET title = ?, description = ?, time_limit = ?, questions = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [title.trim(), description?.trim() || '', timeLimitSeconds, JSON.stringify(questions), quizId],
        function(err) {
          if (err) {
            console.error("Error updating classroom quiz:", err);
            return res.status(500).json({ error: "Failed to update quiz" });
          }

          res.json({ message: "Quiz updated successfully" });
        }
      );
    }
  );
});

// Delete a classroom quiz
app.delete("/api/classroom-quiz/:quizId", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const quizId = parseInt(req.params.quizId);
  if (isNaN(quizId)) {
    return res.status(400).json({ error: "Invalid quiz ID" });
  }

  // Verify ownership
  userDb.get(
    "SELECT id FROM classroom_quizzes WHERE id = ? AND professor_id = ?",
    [quizId, req.session.userId],
    (err, quiz) => {
      if (err) {
        console.error("Error verifying quiz ownership:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (!quiz) {
        return res.status(403).json({ error: "Quiz not found or access denied" });
      }

      userDb.run(
        "DELETE FROM classroom_quizzes WHERE id = ?",
        [quizId],
        function(err) {
          if (err) {
            console.error("Error deleting classroom quiz:", err);
            return res.status(500).json({ error: "Failed to delete quiz" });
          }

          res.json({ message: "Quiz deleted successfully" });
        }
      );
    }
  );
});

// Helper function for randomizing classroom quiz questions
function randomizeQuizQuestions(questions) {
  function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  return questions.map(question => {
    // Add unique ID if not present
    question.id = question.id || Math.random().toString(36).substr(2, 9);
    
    if (question.type === 'text') {
      return question;
    }
    
    // Handle multiple choice questions
    if (!question.options || !Array.isArray(question.options)) {
      return question;
    }
    
    const originalCorrectIndex = question.correctAnswer;
    const optionsWithIndices = question.options.map((option, index) => ({
      option,
      originalIndex: index
    }));
    
    const shuffledOptions = shuffleArray(optionsWithIndices);
    const newCorrectIndex = shuffledOptions.findIndex(
      item => item.originalIndex === originalCorrectIndex
    );
    
    return {
      ...question,
      options: shuffledOptions.map(item => item.option),
      correctAnswer: newCorrectIndex,
      optionMapping: shuffledOptions.map(item => item.originalIndex)
    };
  });
}

// Get global leaderboard for all students
app.get("/api/leaderboard/global", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { quizId, limit = 50 } = req.query;
  
  let query = `
    SELECT 
      u.username,
      u.id as user_id,
      u.country,
      qr.quiz_name,
      qr.score,
      qr.total_questions,
      qr.percentage,
      qr.time_taken,
      qr.completed_at,
      ROW_NUMBER() OVER (ORDER BY qr.percentage DESC, qr.time_taken ASC) as rank
    FROM quiz_results qr
    JOIN users u ON qr.user_id = u.id
    WHERE u.role = 'student'
  `;
  
  let params = [];
  
  if (quizId) {
    query += " AND qr.quiz_id = ?";
    params.push(quizId);
    console.log(`Global leaderboard query for quizId: ${quizId}`);
  }
  
  query += `
    ORDER BY qr.percentage DESC, qr.time_taken ASC
    LIMIT ?
  `;
  params.push(parseInt(limit));
  
  console.log(`Executing global leaderboard query:`, query);
  console.log(`With params:`, params);
  
  userDb.all(query, params, (err, results) => {
    if (err) {
      console.error("Error fetching global leaderboard:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    console.log(`Global leaderboard results for quizId ${quizId}:`, results);
    
    res.json({
      leaderboard: results,
      quizId: quizId || null,
      type: 'global'
    });
  });
});

// Get national leaderboard for user's country
app.get("/api/leaderboard/national", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { quizId, limit = 50 } = req.query;
  
  // First get the current user's country
  userDb.get(
    "SELECT country FROM users WHERE id = ?",
    [req.session.userId],
    (err, currentUser) => {
      if (err) {
        console.error("Error fetching user country:", err);
        return res.status(500).json({ error: "Database error" });
      }
      
      if (!currentUser || !currentUser.country) {
        return res.status(400).json({ error: "Nu ai selectat o țară în profilul tău. Accesează pagina de administrare pentru a o seta." });
      }
      
      let query = `
        SELECT 
          u.username,
          u.id as user_id,
          u.country,
          qr.quiz_name,
          qr.score,
          qr.total_questions,
          qr.percentage,
          qr.time_taken,
          qr.completed_at,
          ROW_NUMBER() OVER (ORDER BY qr.percentage DESC, qr.time_taken ASC) as rank
        FROM quiz_results qr
        JOIN users u ON qr.user_id = u.id
        WHERE u.role = 'student' AND u.country = ?
      `;
      
      let params = [currentUser.country];
      
      if (quizId) {
        query += " AND qr.quiz_id = ?";
        params.push(quizId);
      }
      
      query += `
        ORDER BY qr.percentage DESC, qr.time_taken ASC
        LIMIT ?
      `;
      params.push(parseInt(limit));
      
      userDb.all(query, params, (err, results) => {
        if (err) {
          console.error("Error fetching national leaderboard:", err);
          return res.status(500).json({ error: "Database error" });
        }
        
        res.json({
          leaderboard: results,
          country: currentUser.country,
          quizId: quizId || null,
          type: 'national'
        });
      });
    }
  );
});

// Get classroom leaderboard for a specific class
app.get("/api/leaderboard/class/:classId", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { classId } = req.params;
  const { quizId, limit = 50 } = req.query;
  
  // First verify user has access to this class (either professor or student member)
  userDb.get(
    `SELECT 
      CASE 
        WHEN c.professor_id = ? THEN 'professor'
        WHEN cm.student_id = ? THEN 'student'
        ELSE NULL
      END as role
    FROM classes c
    LEFT JOIN class_members cm ON c.id = cm.class_id AND cm.student_id = ?
    WHERE c.id = ?`,
    [req.session.userId, req.session.userId, req.session.userId, classId],
    (err, access) => {
      if (err) {
        console.error("Error checking class access:", err);
        return res.status(500).json({ error: "Database error" });
      }
      
      if (!access || !access.role) {
        return res.status(403).json({ error: "Access denied to this class" });
      }
      
      // Get class info
      userDb.get(
        "SELECT name, description FROM classes WHERE id = ?",
        [classId],
        (err, classInfo) => {
          if (err) {
            console.error("Error fetching class info:", err);
            return res.status(500).json({ error: "Database error" });
          }
          
          // Build leaderboard query
          let query = `
            SELECT 
              u.username,
              u.id as user_id,
              u.country,
              qr.quiz_name,
              qr.score,
              qr.total_questions,
              qr.percentage,
              qr.time_taken,
              qr.completed_at,
              ROW_NUMBER() OVER (ORDER BY qr.percentage DESC, qr.time_taken ASC) as rank
            FROM quiz_results qr
            JOIN users u ON qr.user_id = u.id
            JOIN class_members cm ON u.id = cm.student_id
            WHERE cm.class_id = ? AND u.role = 'student'
          `;
          
          let params = [classId];
          
          if (quizId) {
            query += " AND qr.quiz_id = ?";
            params.push(quizId);
            console.log(`Class leaderboard query for quizId: ${quizId}, classId: ${classId}`);
          }
          
          query += `
            ORDER BY qr.percentage DESC, qr.time_taken ASC
            LIMIT ?
          `;
          params.push(parseInt(limit));
          
          console.log(`Executing class leaderboard query:`, query);
          console.log(`With params:`, params);
          
          userDb.all(query, params, (err, results) => {
            if (err) {
              console.error("Error fetching class leaderboard:", err);
              return res.status(500).json({ error: "Database error" });
            }
            
            console.log(`Class leaderboard results for quizId ${quizId}:`, results);
            
            // Debug: Check what quiz results exist for this class
            userDb.all(
              `SELECT qr.quiz_id, qr.quiz_name, qr.user_id, u.username 
               FROM quiz_results qr 
               JOIN users u ON qr.user_id = u.id 
               JOIN class_members cm ON u.id = cm.student_id 
               WHERE cm.class_id = ? 
               ORDER BY qr.completed_at DESC LIMIT 10`,
              [classId],
              (debugErr, debugResults) => {
                if (!debugErr) {
                  console.log(`All recent quiz results for class ${classId}:`, debugResults);
                }
              }
            );
            
            res.json({
              leaderboard: results,
              classId: classId,
              className: classInfo.name,
              classDescription: classInfo.description,
              quizId: quizId || null,
              type: 'class',
              userRole: access.role
            });
          });
        }
      );
    }
  );
});

// Get personal quiz statistics for current user
app.get("/api/stats/personal", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { quizId, classId, national } = req.query;
  
  let query = `
    SELECT 
      qr.quiz_id,
      qr.quiz_name,
      COUNT(*) as attempts,
      MAX(qr.percentage) as best_percentage,
      AVG(qr.percentage) as avg_percentage,
      MIN(qr.time_taken) as best_time,
      AVG(qr.time_taken) as avg_time,
      MAX(qr.completed_at) as last_attempt
    FROM quiz_results qr
    WHERE qr.user_id = ?
  `;
  
  let params = [req.session.userId];
  
  if (quizId) {
    query += " AND qr.quiz_id = ?";
    params.push(quizId);
  }
  
  if (classId) {
    query += " AND qr.class_id = ?";
    params.push(classId);
  }
  
  query += " GROUP BY qr.quiz_id, qr.quiz_name ORDER BY last_attempt DESC";
  
  userDb.all(query, params, (err, stats) => {
    if (err) {
      console.error("Error fetching personal stats:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    // Get user's rank in global leaderboard for each quiz
    const statsWithRank = [];
    let processed = 0;
    
    if (stats.length === 0) {
      return res.json({ stats: [] });
    }
    
    stats.forEach(stat => {
      let rankQuery = `
        SELECT COUNT(*) + 1 as rank
        FROM (
          SELECT DISTINCT user_id, MAX(percentage) as best_percentage, MIN(time_taken) as best_time
          FROM quiz_results qr
          JOIN users u ON qr.user_id = u.id
          WHERE qr.quiz_id = ? AND qr.user_id != ? AND u.role = 'student'
      `;
      
      let rankParams = [stat.quiz_id, req.session.userId];
      
      // Add national filter if requested
      if (national === 'true') {
        rankQuery += " AND u.country = (SELECT country FROM users WHERE id = ?)";
        rankParams.push(req.session.userId);
      }
      
      rankQuery += `
          GROUP BY user_id
        ) others
        WHERE others.best_percentage > ? 
           OR (others.best_percentage = ? AND others.best_time < ?)
      `;
      
      rankParams.push(stat.best_percentage, stat.best_percentage, stat.best_time);
      
      userDb.get(rankQuery, rankParams, (err, rankResult) => {
        if (err) {
          console.error("Error calculating rank:", err);
          stat.global_rank = null;
        } else {
          stat.global_rank = rankResult.rank;
        }
        
        statsWithRank.push(stat);
        processed++;
        
        if (processed === stats.length) {
          res.json({ stats: statsWithRank });
        }
      });
    });
  });
});

// ── get user history ──────────────────────────────────────────────
app.get("/user-history", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const userId = req.session.userId;
  
  // Get isomer history
  userDb.all(
    "SELECT formula, isomer_count, generated_at FROM user_isomers WHERE user_id = ? ORDER BY generated_at DESC",
    [userId],
    (err, isomers) => {
      if (err) {
        console.error("Error fetching isomer history:", err);
        return res.status(500).json({ error: "DB error" });
      }

      // Get quiz history with best scores
      userDb.all(
        `SELECT 
          quiz_name,
          MAX(score) as best_score,
          total_questions,
          COUNT(*) as attempts,
          MAX(completed_at) as last_attempt
        FROM user_quiz_results 
        WHERE user_id = ? 
        GROUP BY quiz_name, total_questions
        ORDER BY last_attempt DESC`,
        [userId],
        (err, quizSummary) => {
          if (err) {
            console.error("Error fetching quiz summary:", err);
            return res.status(500).json({ error: "DB error" });
          }

          // Get all quiz attempts for detailed history
          userDb.all(
            "SELECT quiz_name, score, total_questions, completed_at FROM user_quiz_results WHERE user_id = ? ORDER BY completed_at DESC",
            [userId],
            (err, allQuizResults) => {
              if (err) {
                console.error("Error fetching all quiz results:", err);
                return res.status(500).json({ error: "DB error" });
              }

              res.json({
                isomers: isomers,
                quizSummary: quizSummary,
                allQuizResults: allQuizResults
              });
            }
          );
        }
      );
    }
  );
});

// ── User Search Endpoint ──────────────────────────────────────────
// Search for usernames (for autocomplete when inviting students)
app.get('/search-users', requireAuth, (req, res) => {
  const { query, limit = 10 } = req.query;
  
  if (!query || query.trim().length === 0) {
    return res.json({ users: [] });
  }
  
  const searchTerm = query.trim();
  
  // Search for students and users without roles whose username contains the search term
  userDb.all(
    `SELECT id, username, role FROM users 
     WHERE (role = 'student' OR role IS NULL) AND username LIKE ? 
     ORDER BY 
       CASE 
         WHEN username = ? THEN 1
         WHEN username LIKE ? THEN 2
         ELSE 3
       END,
       CASE 
         WHEN role = 'student' THEN 1
         WHEN role IS NULL THEN 2
         ELSE 3
       END,
       username ASC
     LIMIT ?`,
    [`%${searchTerm}%`, searchTerm, `${searchTerm}%`, parseInt(limit)],
    (err, users) => {
      if (err) {
        console.error("Error searching users:", err);
        return res.status(500).json({ error: "Database error" });
      }
      
      res.json({ users: users || [] });
    }
  );
});

// Check if a specific username exists
app.get('/check-user/:username', requireAuth, (req, res) => {
  const { username } = req.params;
  
  if (!username || username.trim().length === 0) {
    return res.status(400).json({ error: "Username is required" });
  }
  
  userDb.get(
    "SELECT id, username, role FROM users WHERE username = ?",
    [username.trim()],
    (err, user) => {
      if (err) {
        console.error("Error checking user:", err);
        return res.status(500).json({ error: "Database error" });
      }
      
      if (!user) {
        return res.json({ exists: false, message: "Utilizatorul nu există" });
      }
      
      if (user.role === 'professor') {
        return res.json({ 
          exists: true, 
          valid: false, 
          message: "Utilizatorul este profesor, nu student" 
        });
      }
      
      if (user.role === null) {
        return res.json({ 
          exists: true, 
          valid: true, 
          needsRoleSelection: true,
          message: "Utilizator găsit (va deveni student după acceptarea invitației)",
          user: { id: user.id, username: user.username } 
        });
      }
      
      // user.role === 'student'
      res.json({ 
        exists: true, 
        valid: true, 
        user: { id: user.id, username: user.username } 
      });
    }
  );
});

// ── Homework Management Endpoints ─────────────────────────────────
// Create homework assignment
app.post('/create-homework', requireAuth, async (req, res) => {
  const { classId, title, description, quizId, quizName, dueDate, maxAttempts } = req.body;
  
  if (!classId || !title || !quizId || !quizName || !dueDate) {
    return res.status(400).json({ error: "Toate câmpurile obligatorii trebuie completate" });
  }
  
  // Profanity check for homework title
  try {
    const profanityCheck = await containsProfanity(title);
    if (profanityCheck.contains) {
      return res.status(400).json({ 
        error: "Titlul temei conține conținut nepotrivit și nu poate fi utilizat" 
      });
    }
  } catch (error) {
    console.error("Error checking homework title profanity:", error);
    // Continue with creation if profanity check fails
  }
  
  // Profanity check for description if provided
  if (description && description.trim().length > 0) {
    try {
      const profanityCheck = await containsProfanity(description);
      if (profanityCheck.contains) {
        return res.status(400).json({ 
          error: "Descrierea temei conține conținut nepotrivit și nu poate fi utilizată" 
        });
      }
    } catch (error) {
      console.error("Error checking homework description profanity:", error);
      // Continue with creation if profanity check fails
    }
  }
  
  // Verify professor owns the class
  userDb.get(
    "SELECT id FROM classes WHERE id = ? AND professor_id = ?",
    [classId, req.session.userId],
    (err, classRow) => {
      if (err) {
        console.error("Error checking class ownership:", err);
        return res.status(500).json({ error: "Database error" });
      }
      
      if (!classRow) {
        return res.status(403).json({ error: "Nu aveți permisiunea să creați teme pentru această clasă" });
      }
      
      // Create homework assignment
      userDb.run(
        `INSERT INTO homework_assignments (class_id, professor_id, title, description, quiz_id, quiz_name, due_date, max_attempts)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [classId, req.session.userId, title.trim(), description ? description.trim() : '', quizId, quizName, dueDate, maxAttempts || 1],
        async function(err) {
          if (err) {
            console.error("Error creating homework:", err);
            return res.status(500).json({ error: "Database error" });
          }
          
          const homeworkId = this.lastID;
          
          // Send email notifications to students in the class
          try {
            // Get class info and students
            userDb.get(
              "SELECT name FROM classes WHERE id = ?",
              [classId],
              async (err, classInfo) => {
                if (err || !classInfo) {
                  console.error("Error getting class info for email:", err);
                  return;
                }
                
                // Get all students in the class
                userDb.all(
                  `SELECT u.id, u.email, u.username 
                   FROM users u 
                   JOIN class_members cm ON u.id = cm.student_id 
                   WHERE cm.class_id = ? AND u.email IS NOT NULL AND u.email != ''`,
                  [classId],
                  async (err, students) => {
                    if (err) {
                      console.error("Error getting students for email notification:", err);
                      return;
                    }
                    
                    console.log(`📧 Sending homework notifications to ${students.length} students`);
                    
                    // Format due date
                    const formattedDueDate = new Date(dueDate).toLocaleDateString('ro-RO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    
                    // Send email to each student
                    for (const student of students) {
                      try {
                        await sendHomeworkNotification(
                          student.email,
                          student.username,
                          title,
                          classInfo.name,
                          formattedDueDate,
                          student.id
                        );
                      } catch (emailErr) {
                        console.error(`Failed to send email to ${student.email}:`, emailErr);
                      }
                    }
                  }
                );
              }
            );
          } catch (error) {
            console.error("Error in homework email notification process:", error);
          }
          
          res.json({ 
            message: "Tema a fost creată cu succes", 
            homeworkId: homeworkId 
          });
        }
      );
    }
  );
});

// Get homework assignments for a class (teacher view)
app.get('/class/:classId/homework', requireAuth, (req, res) => {
  const { classId } = req.params;
  
  // Verify professor owns the class
  userDb.get(
    "SELECT id FROM classes WHERE id = ? AND professor_id = ?",
    [classId, req.session.userId],
    (err, classRow) => {
      if (err) {
        console.error("Error checking class ownership:", err);
        return res.status(500).json({ error: "Database error" });
      }
      
      if (!classRow) {
        return res.status(403).json({ error: "Nu aveți permisiunea să accesați această clasă" });
      }
      
      // Get homework assignments with submission statistics
      userDb.all(
        `SELECT 
          ha.*,
          COUNT(DISTINCT hs.student_id) as submitted_count,
          COUNT(DISTINCT cm.student_id) as total_students,
          CASE WHEN datetime(ha.due_date) < datetime('now') THEN 1 ELSE 0 END as is_overdue
         FROM homework_assignments ha
         LEFT JOIN homework_submissions hs ON ha.id = hs.homework_id
         LEFT JOIN class_members cm ON ha.class_id = cm.class_id
         WHERE ha.class_id = ?
         GROUP BY ha.id
         ORDER BY ha.created_at DESC`,
        [classId],
        (err, assignments) => {
          if (err) {
            console.error("Error fetching homework assignments:", err);
            return res.status(500).json({ error: "Database error" });
          }
          
          res.json({ assignments: assignments || [] });
        }
      );
    }
  );
});

// Get homework assignment details with student submissions and ranking
app.get('/homework/:homeworkId/details', requireAuth, (req, res) => {
  const { homeworkId } = req.params;
  
  // First get homework details and verify access
  userDb.get(
    `SELECT ha.*, c.name as class_name
     FROM homework_assignments ha
     JOIN classes c ON ha.class_id = c.id
     WHERE ha.id = ? AND ha.professor_id = ?`,
    [homeworkId, req.session.userId],
    (err, homework) => {
      if (err) {
        console.error("Error fetching homework details:", err);
        return res.status(500).json({ error: "Database error" });
      }
      
      if (!homework) {
        return res.status(404).json({ error: "Tema nu a fost găsită" });
      }
      
      // Get student submissions with ranking
      userDb.all(
        `SELECT 
          u.username,
          u.id as student_id,
          hs.score,
          hs.total_questions,
          hs.percentage,
          hs.time_taken,
          hs.attempt_number,
          hs.submitted_at,
          ROW_NUMBER() OVER (ORDER BY hs.percentage DESC, hs.time_taken ASC) as rank
         FROM class_members cm
         JOIN users u ON cm.student_id = u.id
         LEFT JOIN homework_submissions hs ON cm.student_id = hs.student_id AND hs.homework_id = ?
         WHERE cm.class_id = ?
         ORDER BY 
           CASE WHEN hs.id IS NULL THEN 1 ELSE 0 END,
           hs.percentage DESC, 
           hs.time_taken ASC`,
        [homeworkId, homework.class_id],
        (err, submissions) => {
          if (err) {
            console.error("Error fetching homework submissions:", err);
            return res.status(500).json({ error: "Database error" });
          }
          
          res.json({ 
            homework,
            submissions: submissions || []
          });
        }
      );
    }
  );
});

// Get homework assignments for student
app.get('/my-homework', requireAuth, (req, res) => {
  // Get homework assignments for all classes the student is a member of
  userDb.all(
    `SELECT 
      ha.*,
      c.name as class_name,
      hs.score,
      hs.percentage,
      hs.time_taken,
      hs.submitted_at,
      hs.attempt_number,
      CASE WHEN datetime(ha.due_date) < datetime('now') THEN 1 ELSE 0 END as is_overdue,
      CASE WHEN hs.id IS NOT NULL THEN 1 ELSE 0 END as is_submitted
     FROM homework_assignments ha
     JOIN classes c ON ha.class_id = c.id
     JOIN class_members cm ON c.id = cm.class_id
     LEFT JOIN homework_submissions hs ON ha.id = hs.homework_id AND hs.student_id = ?
     WHERE cm.student_id = ?
     ORDER BY ha.due_date ASC, ha.created_at DESC`,
    [req.session.userId, req.session.userId],
    (err, assignments) => {
      if (err) {
        console.error("Error fetching student homework:", err);
        return res.status(500).json({ error: "Database error" });
      }
      
      res.json({ assignments: assignments || [] });
    }
  );
});

// Submit homework (modified quiz submission)
app.post('/homework/:homeworkId/submit', requireAuth, (req, res) => {
  const { homeworkId } = req.params;
  const { answers, timeTaken, questionMappings } = req.body;
  
  // Get homework details
  userDb.get(
    `SELECT ha.*, cm.student_id
     FROM homework_assignments ha
     JOIN class_members cm ON ha.class_id = cm.class_id
     WHERE ha.id = ? AND cm.student_id = ?`,
    [homeworkId, req.session.userId],
    (err, homework) => {
      if (err) {
        console.error("Error fetching homework:", err);
        return res.status(500).json({ error: "Database error" });
      }
      
      if (!homework) {
        return res.status(404).json({ error: "Tema nu a fost găsită sau nu aveți acces la ea" });
      }
      
      // Check if due date has passed
      if (new Date(homework.due_date) < new Date()) {
        return res.status(400).json({ error: "Termenul limită pentru această temă a trecut" });
      }
      
      // Check how many attempts the student has made
      userDb.get(
        "SELECT COUNT(*) as attempt_count FROM homework_submissions WHERE homework_id = ? AND student_id = ?",
        [homeworkId, req.session.userId],
        (err, attemptRow) => {
          if (err) {
            console.error("Error checking attempts:", err);
            return res.status(500).json({ error: "Database error" });
          }
          
          if (attemptRow.attempt_count >= homework.max_attempts) {
            return res.status(400).json({ error: `Ați atins numărul maxim de încercări (${homework.max_attempts})` });
          }
          
          // Process quiz submission (reuse existing quiz logic)
          const quizData = require('./quiz-data.js');
          const quiz = quizData[homework.quiz_id];
          
          if (!quiz) {
            return res.status(404).json({ error: "Chestionarul nu a fost găsit" });
          }
          
          // Calculate score with randomization support
          let correct = 0;
          const results = [];
          
          quiz.questions.forEach(question => {
            const userAnswer = answers[question.id];
            const questionMapping = questionMappings && questionMappings[question.id];
            
            let isCorrect = false;
            let mappedUserAnswer = userAnswer;
            
            // Handle randomization mapping
            if (questionMapping && questionMapping.optionMapping) {
              if (userAnswer !== undefined && userAnswer !== null) {
                mappedUserAnswer = questionMapping.optionMapping[userAnswer];
              }
            }
            
            isCorrect = mappedUserAnswer === question.correctAnswer;
            
            if (isCorrect) {
              correct++;
            }
            
            results.push({
              questionId: question.id,
              question: question.question,
              isCorrect: isCorrect
            });
          });
          
          const score = correct;
          const totalQuestions = quiz.questions.length;
          const percentage = Math.round((score / totalQuestions) * 100);
          const timeInSeconds = parseInt(timeTaken) || 0;
          const attemptNumber = attemptRow.attempt_count + 1;
          
          // Save homework submission
          userDb.run(
            `INSERT INTO homework_submissions (homework_id, student_id, score, total_questions, percentage, time_taken, attempt_number)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [homeworkId, req.session.userId, score, totalQuestions, percentage, timeInSeconds, attemptNumber],
            function(err) {
              if (err) {
                console.error("Error saving homework submission:", err);
                return res.status(500).json({ error: "Database error" });
              }
              
              res.json({
                message: "Tema a fost trimisă cu succes",
                score: score,
                totalQuestions: totalQuestions,
                percentage: percentage,
                timeTaken: timeInSeconds,
                attemptNumber: attemptNumber,
                results: results
              });
            }
          );
        }
      );
    }
  );
});

// ── Class Management Endpoints ────────────────────────────────────

// Create a new class (professors only)
app.post("/create-class", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Class name is required" });
  }

  // Profanity check for class name
  try {
    const profanityCheck = await containsProfanity(name);
    if (profanityCheck.contains) {
      return res.status(400).json({ 
        error: "Numele clasei conține conținut nepotrivit și nu poate fi utilizat" 
      });
    }
  } catch (error) {
    console.error("Error checking class name profanity:", error);
    // Continue with creation if profanity check fails
  }
  
  // Profanity check for description if provided
  if (description && description.trim().length > 0) {
    try {
      const profanityCheck = await containsProfanity(description);
      if (profanityCheck.contains) {
        return res.status(400).json({ 
          error: "Descrierea clasei conține conținut nepotrivit și nu poate fi utilizată" 
        });
      }
    } catch (error) {
      console.error("Error checking class description profanity:", error);
      // Continue with creation if profanity check fails
    }
  }

  // Check if user is a professor
  userDb.get(
    "SELECT role FROM users WHERE id = ?",
    [req.session.userId],
    (err, user) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (!user || user.role !== 'professor') {
        return res.status(403).json({ error: "Only professors can create classes" });
      }

      userDb.run(
        "INSERT INTO classes (name, description, professor_id) VALUES (?, ?, ?)",
        [name.trim(), description ? description.trim() : '', req.session.userId],
        function (err) {
          if (err) {
            console.error("Error creating class:", err);
            return res.status(500).json({ error: "DB error" });
          }
          res.json({ message: "Class created successfully", classId: this.lastID });
        }
      );
    }
  );
});

// Get classes for current user (professor: their classes, student: their joined classes)
app.get("/my-classes", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  userDb.get(
    "SELECT role FROM users WHERE id = ?",
    [req.session.userId],
    (err, user) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (!user) return res.status(401).json({ error: "User not found" });

      if (user.role === 'professor') {
        // Get professor's classes with student count
        userDb.all(
          `SELECT c.id, c.name, c.description, c.created_at,
                  COUNT(cm.student_id) as student_count
           FROM classes c
           LEFT JOIN class_members cm ON c.id = cm.class_id
           WHERE c.professor_id = ?
           GROUP BY c.id, c.name, c.description, c.created_at
           ORDER BY c.created_at DESC`,
          [req.session.userId],
          (err, classes) => {
            if (err) return res.status(500).json({ error: "DB error" });
            res.json({ classes: classes, role: 'professor' });
          }
        );
      } else {
        // Get student's joined classes
        userDb.all(
          `SELECT c.id, c.name, c.description, c.created_at,
                  u.username as professor_name,
                  cm.joined_at
           FROM class_members cm
           JOIN classes c ON cm.class_id = c.id
           JOIN users u ON c.professor_id = u.id
           WHERE cm.student_id = ?
           ORDER BY cm.joined_at DESC`,
          [req.session.userId],
          (err, classes) => {
            if (err) return res.status(500).json({ error: "DB error" });
            res.json({ classes: classes, role: 'student' });
          }
        );
      }
    }
  );
});

// Invite student to class (professors only)
app.post("/invite-student", requireAuth, (req, res) => {

  const { classId, studentUsername } = req.body;
  console.log("Invite student request:", { classId, studentUsername, userId: req.session.userId });
  
  if (!classId || !studentUsername) {
    return res.status(400).json({ error: "Class ID and student username are required" });
  }

  // Check if user is professor and owns the class
  userDb.get(
    "SELECT * FROM classes WHERE id = ? AND professor_id = ?",
    [classId, req.session.userId],
    (err, classInfo) => {
      if (err) {
        console.error("DB error checking class ownership:", err);
        return res.status(500).json({ error: "DB error" });
      }
      console.log("Class info found:", classInfo);
      if (!classInfo) {
        return res.status(403).json({ error: "Class not found or you don't have permission" });
      }

      // Find student by username
      userDb.get(
        "SELECT id, username, role FROM users WHERE username = ?",
        [studentUsername],
        (err, student) => {
          if (err) return res.status(500).json({ error: "DB error" });
          if (!student) {
            return res.status(404).json({ error: "Student not found" });
          }
          if (student.role === 'professor') {
            return res.status(400).json({ error: "User is a professor, not a student" });
          }

          // Check if student is already a member
          userDb.get(
            "SELECT * FROM class_members WHERE class_id = ? AND student_id = ?",
            [classId, student.id],
            (err, existingMember) => {
              if (err) return res.status(500).json({ error: "DB error" });
              if (existingMember) {
                return res.status(400).json({ error: "Student is already a member of this class" });
              }

              // Clean up any existing invitation records first, then create a new one
              userDb.run(
                "DELETE FROM class_invitations WHERE class_id = ? AND student_id = ?",
                [classId, student.id],
                (deleteErr) => {
                  if (deleteErr) {
                    console.error("Error cleaning up existing invitations:", deleteErr);
                    return res.status(500).json({ error: "Database error during cleanup" });
                  }
                  
                  // Now create a fresh invitation
                  userDb.run(
                    "INSERT INTO class_invitations (class_id, student_id, professor_id) VALUES (?, ?, ?)",
                    [classId, student.id, req.session.userId],
                    function (err) {
                      if (err) {
                        console.error("Error creating new invitation:", err);
                        console.error("Details - ClassId:", classId, "StudentId:", student.id, "ProfessorId:", req.session.userId);
                        return res.status(500).json({ error: "Database error: " + (err.message || "Unknown error") });
                      }
                      
                      console.log("New invitation created successfully for student:", student.username);
                      res.json({ message: "Invitation sent successfully" });
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

// Get pending invitations for current user (students only)
app.get("/pending-invitations", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  userDb.all(
    `SELECT ci.id, ci.class_id, ci.created_at,
            c.name as class_name, c.description as class_description,
            u.username as professor_name
     FROM class_invitations ci
     JOIN classes c ON ci.class_id = c.id
     JOIN users u ON ci.professor_id = u.id
     WHERE ci.student_id = ? AND ci.status = 'pending'
     ORDER BY ci.created_at DESC`,
    [req.session.userId],
    (err, invitations) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json({ invitations: invitations });
    }
  );
});

// Respond to class invitation (students only)
app.post("/respond-invitation", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { invitationId, accept } = req.body;
  if (!invitationId || typeof accept !== 'boolean') {
    return res.status(400).json({ error: "Invitation ID and accept status are required" });
  }

  // Get invitation details
  userDb.get(
    "SELECT * FROM class_invitations WHERE id = ? AND student_id = ? AND status = 'pending'",
    [invitationId, req.session.userId],
    (err, invitation) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found or already responded" });
      }

      const newStatus = accept ? 'accepted' : 'rejected';
      
      // Update invitation status
      userDb.run(
        "UPDATE class_invitations SET status = ?, responded_at = CURRENT_TIMESTAMP WHERE id = ?",
        [newStatus, invitationId],
        (err) => {
          if (err) return res.status(500).json({ error: "DB error" });

          if (accept) {
            // First check if user needs role to be set to student
            userDb.get(
              "SELECT role FROM users WHERE id = ?",
              [req.session.userId],
              (err, user) => {
                if (err) {
                  console.error("Error checking user role:", err);
                  return res.status(500).json({ error: "DB error" });
                }
                
                if (user.role === null) {
                  // Set role to student first
                  userDb.run(
                    "UPDATE users SET role = 'student' WHERE id = ?",
                    [req.session.userId],
                    (err) => {
                      if (err) {
                        console.error("Error setting user role:", err);
                        return res.status(500).json({ error: "DB error" });
                      }
                      
                      // Then add student to class members
                      userDb.run(
                        "INSERT INTO class_members (class_id, student_id) VALUES (?, ?)",
                        [invitation.class_id, req.session.userId],
                        (err) => {
                          if (err) {
                            console.error("Error adding student to class:", err);
                            return res.status(500).json({ error: "DB error" });
                          }
                          res.json({ message: "Invitation accepted successfully. You are now a student!" });
                        }
                      );
                    }
                  );
                } else {
                  // User already has student role, just add to class
                  userDb.run(
                    "INSERT INTO class_members (class_id, student_id) VALUES (?, ?)",
                    [invitation.class_id, req.session.userId],
                    (err) => {
                      if (err) {
                        console.error("Error adding student to class:", err);
                        return res.status(500).json({ error: "DB error" });
                      }
                      res.json({ message: "Invitation accepted successfully" });
                    }
                  );
                }
              }
            );
          } else {
            res.json({ message: "Invitation rejected" });
          }
        }
      );
    }
  );
});

// Get class members (professors only)
app.get("/class-members/:classId", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const classId = req.params.classId;

  // Check if user is professor and owns the class
  userDb.get(
    "SELECT * FROM classes WHERE id = ? AND professor_id = ?",
    [classId, req.session.userId],
    (err, classInfo) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (!classInfo) {
        return res.status(403).json({ error: "Class not found or you don't have permission" });
      }

      // Get class members
      userDb.all(
        `SELECT u.id, u.username, u.email, cm.joined_at
         FROM class_members cm
         JOIN users u ON cm.student_id = u.id
         WHERE cm.class_id = ?
         ORDER BY cm.joined_at DESC`,
        [classId],
        (err, members) => {
          if (err) return res.status(500).json({ error: "DB error" });

          // Get pending invitations for this class
          userDb.all(
            `SELECT ci.id, ci.created_at, u.username, u.email
             FROM class_invitations ci
             JOIN users u ON ci.student_id = u.id
             WHERE ci.class_id = ? AND ci.status = 'pending'
             ORDER BY ci.created_at DESC`,
            [classId],
            (err, pendingInvitations) => {
              if (err) return res.status(500).json({ error: "DB error" });
              
              res.json({
                className: classInfo.name,
                members: members,
                pendingInvitations: pendingInvitations
              });
            }
          );
        }
      );
    }
  );
});

// Remove student from class (professors only)
app.post("/remove-student", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { classId, studentId } = req.body;
  if (!classId || !studentId) {
    return res.status(400).json({ error: "Class ID and student ID are required" });
  }

  // Check if user is professor and owns the class
  userDb.get(
    "SELECT * FROM classes WHERE id = ? AND professor_id = ?",
    [classId, req.session.userId],
    (err, classInfo) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (!classInfo) {
        return res.status(403).json({ error: "Class not found or you don't have permission" });
      }

      // Remove student from class and clean up invitation records
      userDb.run(
        "DELETE FROM class_members WHERE class_id = ? AND student_id = ?",
        [classId, studentId],
        function (err) {
          if (err) {
            console.error("Error removing student from class:", err);
            return res.status(500).json({ error: "DB error" });
          }
          
          if (this.changes === 0) {
            return res.status(404).json({ error: "Student not found in this class" });
          }
          
          // Also clean up any invitation records for this student in this class
          userDb.run(
            "DELETE FROM class_invitations WHERE class_id = ? AND student_id = ?",
            [classId, studentId],
            (cleanupErr) => {
              if (cleanupErr) {
                console.error("Warning: Error cleaning up invitation records:", cleanupErr);
              }
              res.json({ message: "Student removed from class successfully" });
            }
          );
        }
      );
    }
  );
});

// Exit classroom (students only)
app.post("/exit-classroom", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { classId } = req.body;
  if (!classId) {
    return res.status(400).json({ error: "Class ID is required" });
  }

  // Check if user is a student and member of the class
  userDb.get(
    "SELECT * FROM class_members WHERE class_id = ? AND student_id = ?",
    [classId, req.session.userId],
    (err, membership) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (!membership) {
        return res.status(404).json({ error: "You are not a member of this class" });
      }

      // Remove student from class and clean up invitation records
      userDb.run(
        "DELETE FROM class_members WHERE class_id = ? AND student_id = ?",
        [classId, req.session.userId],
        function (err) {
          if (err) {
            console.error("Error exiting classroom:", err);
            return res.status(500).json({ error: "DB error" });
          }
          
          // Also clean up any invitation records for this student in this class
          userDb.run(
            "DELETE FROM class_invitations WHERE class_id = ? AND student_id = ?",
            [classId, req.session.userId],
            (cleanupErr) => {
              if (cleanupErr) {
                console.error("Warning: Error cleaning up invitation records:", cleanupErr);
              }
              res.json({ message: "Successfully exited the classroom" });
            }
          );
        }
      );
    }
  );
});

// ── validare formulă înainte de generare ──────────────────────────
app.get("/validate-formula", (req, res) => {
  const formula = req.query.formula;
  if (!formula) {
    return res.status(400).json({ error: "Lipsește parametrul formula" });
  }

  const validation = validateChemicalFormula(formula.trim());
  res.json(validation);
});

// GET /api/isomers?formula=C6H10Cl2[&confirm=1]
app.get("/api/isomers", (req, res) => {
  // Check if user is authenticated
  if (!req.session.userId) {
    return res.status(401).json({ error: "Trebuie să vă autentificați pentru a accesa această funcționalitate." });
  }

  const formula = req.query.formula;
  const confirm = req.query.confirm === "1"; 
  if (!formula) {
    return res.status(400).json({ error: "Lipsește parametrul formula" });
  }

  // Validează formula înainte de procesare
  const validation = validateChemicalFormula(formula.trim());
  if (!validation.valid) {
    return res.json({
      error: validation.reason,
      type: validation.type,
      suggestions: validation.suggestions || [],
      estimatedIsomers: validation.estimatedIsomers
    });
  }

  // Dacă are avertisment dar este validă, continuă cu procesarea
  if (validation.warning && !confirm) {
    return res.json({
      warning: true,
      message: validation.warning,
      formula: formula,
      complexity: validation.complexity,
      suggestions: validation.suggestions || []
    });
  }

  checkIsomerCount(formula, req, res, confirm, validation);
});

// GET /api/structure?smiles=CCO
app.get("/api/structure", (req, res) => {
  // Check if user is authenticated
  if (!req.session.userId) {
    return res.status(401).json({ error: "Trebuie să vă autentificați pentru a accesa această funcționalitate." });
  }

  const smiles = req.query.smiles;
  if (!smiles) {
    return res.status(400).json({ error: "Lipsește parametrul SMILES" });
  }

  // Validate SMILES format (basic validation)
  if (!/^[A-Za-z0-9()[\]{}@+\-=\/\\#%]+$/.test(smiles)) {
    return res.status(400).json({ 
      error: "Format SMILES invalid. Folosiți doar caractere valide pentru SMILES." 
    });
  }

  // Log the structure request for analytics
  console.log(`Structure request for SMILES: ${smiles} by user: ${req.session.userId}`);

  // Return success response - the actual drawing is done client-side
  res.json({ 
    success: true, 
    smiles: smiles,
    message: "SMILES valid. Desenarea se face pe client."
  });
});

// 1) Check the isomer count (fast) using `-t` => TSV output
function checkIsomerCount(formula, req, res, isConfirmedCall = false, validation = null) {
  console.log("%%%% INSIDE checkIsomerCount - LIMITA MAXIMĂ 1500 IZOMERI %%%%"); 
  console.log(`Verificare număr izomeri pentru formula: ${formula}`);
  
  const args = [
    "-jar", jarPath,
    "-f", formula,
    "-t", 
    "-m", 
    "-v"  
  ];
  console.log("Running Maygen (count only): java", args.join(" "));

  const child = spawn("java", args);

  let outputData = "";
  let errorData = "";
  let timedOut = false; 

  const killTimer = setTimeout(() => {
    console.log("Killing Maygen (count) after 30s time limit...");
    timedOut = true; 
    child.kill("SIGKILL"); // This will trigger 'close' event
  }, 30000);

  child.stdout.on("data", data => {
    outputData += data.toString();
  });
  child.stderr.on("data", data => {
    errorData += data.toString();
    console.error("Maygen (count) stderr:", data.toString().trim());
  });

  child.on("close", code => {
    clearTimeout(killTimer);
    console.log(`Maygen (count) exited with code ${code}. TimedOut: ${timedOut}`);

    if (timedOut) { 
      console.log(`Timeout la numărarea pentru ${formula}. Încerc enumerarea cu limită.`);
      // Instead of returning an error, proceed to enumeration with a marker.
      return enumerateIsomersWithLimit(formula, COUNT_TIMED_OUT_MARKER, req, res, true, validation);
    }

    if (code !== 0) { // Maygen failed for a reason other than timeout
      return res.json({
        error: `Formula ${formula} nu poate fi procesată. Această formulă nu corespunde unei molecule stabile sau este greșită.`,
        type: 'invalid_formula',
        suggestions: educationalSuggestions.incepatori.slice(0, 3),
        timedOutCount: false
      });
    }

    // ---- Successful count ----
    const lines = outputData.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      return res.json({ 
        error: `Formula ${formula} nu a generat niciun rezultat. Această formulă nu corespunde unei molecule valide.`,
        type: 'invalid_formula',
        suggestions: educationalSuggestions.incepatori.slice(0, 3)
      });
    }

    const parts = lines[lines.length - 1].split(/\s+/);
    if (parts.length < 2) {
      return res.json({ 
        error: `Formula ${formula} nu poate fi interpretată. Verifică dacă este o formulă chimică validă.`,
        type: 'invalid_formula',
        suggestions: educationalSuggestions.incepatori.slice(0, 3)
      });
    }

    const formulaReturned = parts[0];
    const countStr = parts[1];
    const isomerCount = parseInt(countStr, 10);
    if (isNaN(isomerCount)) {
      return res.json({ 
        error: `Formula ${formula} nu a putut fi procesată complet. Această formulă poate fi nevalidă sau prea complexă.`,
        type: 'invalid_formula',
        suggestions: educationalSuggestions.incepatori.slice(0, 3)
      });
    }

    if (isConfirmedCall) { // This was a confirm=1 call, count succeeded
      console.log(`Apel confirmat pentru ${formula}, număr = ${isomerCount}. Încep enumerarea.`);
      return enumerateIsomersWithLimit(formula, isomerCount, req, res, false, validation);
    }
    
    if (isomerCount > 1500) { 
      return res.json({
        big: true,
        formula: formulaReturned,
        count: isomerCount,
        message: `Formula ${formulaReturned} are ${isomerCount} izomeri. Din motive de performanță, putem afișa maximum 1500. Doriți să continuați cu primii 1500?`
      });
    }

    // If count <= 1500, enumerate directly.
    console.log(`Număr = ${isomerCount}, încep enumerarea directă...`);
    enumerateIsomersWithLimit(formula, isomerCount, req, res, false, validation);
  });
}

// 2) Full enumeration with time-limit => produce .smi file
function enumerateIsomersWithLimit(formula, actualTotalIsomers, req, res, countPreviouslyTimedOut = false, validation = null) { 
  console.log(`Enumerare pentru formula: ${formula}, număr total: ${actualTotalIsomers}, timeout anterior: ${countPreviouslyTimedOut}`);

  const outDir = path.join(__dirname, formula.toLowerCase() + ".smi");
  // const outFilename = formula.toUpperCase() + ".smi"; // Maygen might use its own casing
  // const outFile = path.join(outDir, outFilename);
  console.log("Output dir:", outDir);
  // console.log("Expected output file path (approx):", outFile);

  try {
    fs.rmSync(outDir, { recursive: true, force: true });
  } catch(e) {
    console.log("No existing folder to remove or error removing:", e.message);
  }
  try {
    fs.mkdirSync(outDir, { recursive: true });
  } catch(e) {
    // If mkdir fails, it's a critical issue for Maygen output.
    console.error("Failed to create output directory:", outDir, e);
    return res.status(500).json({ error: `Eroare server: Nu s-a putut crea directorul de output pentru ${formula}.`});
  }
  

  const args = [
    "-jar", jarPath,
    "-f", formula,
    "-smi",
    "-m",
    "-v",
    "-o", outDir + "/" // Maygen requires the trailing slash for directory output
  ];

  console.log("Maygen enumeration command: java", args.join(" "));

  const child = spawn("java", args);

  let stdoutData = ""; 
  let stderrData = ""; 
  let timedOutEnumeration = false; // Renamed to distinguish from count timeout

  const killTimer = setTimeout(() => {
    console.log("Opresc Maygen (enumerare) după 45s limită de timp...");
    timedOutEnumeration = true; 
    child.kill("SIGKILL");
  }, 45000);

  child.stdout.on("data", data => {
    stdoutData += data.toString();
    // console.log("Maygen stdout (enumeration):", data.toString().trim()); // Can be very verbose
  });
  child.stderr.on("data", data => {
    stderrData += data.toString();
    console.error("Maygen stderr (enumeration):", data.toString().trim());
  });

  child.on("close", code => {
    clearTimeout(killTimer);
    console.log(`Maygen enumeration exited with code ${code}. TimedOutEnumeration: ${timedOutEnumeration}`);
    
    fs.readdir(outDir, (err, files) => {
      let errorPrefix = "";
      if (countPreviouslyTimedOut) {
        errorPrefix = `Numărarea inițială a izomerilor pentru formula ${formula} a expirat (30s). `;
      }

      if (err) {
        console.error("Error reading output directory:", err);
        let message = `${errorPrefix}Generarea listei complete de izomeri a eșuat deoarece directorul de output (${outDir}) nu a putut fi citit.`;
        if (timedOutEnumeration) {
           message = `${errorPrefix}Generarea listei complete de izomeri pentru formula ${formula} ${actualTotalIsomers === COUNT_TIMED_OUT_MARKER ? '(număr total necunoscut)' : `(care are în total ${actualTotalIsomers} izomeri)`} a expirat (60s). Directorul de output nu a putut fi citit.`;
        }
        return res.json({
          timedOutEnumerationPartial: timedOutEnumeration, // True if enumeration timed out
          originalCountUnknown: countPreviouslyTimedOut,
          formula: formula,
          actualTotalIsomers: actualTotalIsomers,
          partialSmilesCount: 0,
          message: message,
          smilesList: []
        });
      }

      const smiFile = files.find(file => file.toLowerCase().endsWith('.smi'));
      if (!smiFile) {
        let message = `${errorPrefix}MAYGEN nu a generat niciun fișier .smi.`;
        if (timedOutEnumeration) {
           message = `${errorPrefix}Generarea listei complete de izomeri pentru formula ${formula} ${actualTotalIsomers === COUNT_TIMED_OUT_MARKER ? '(număr total necunoscut)' : `(care are în total ${actualTotalIsomers} izomeri)`} a expirat (60s). Nu s-a găsit niciun fișier .smi.`;
        }
        return res.json({
          timedOutEnumerationPartial: timedOutEnumeration,
          originalCountUnknown: countPreviouslyTimedOut,
          formula: formula,
          actualTotalIsomers: actualTotalIsomers,
          partialSmilesCount: 0,
          message: message,
          smilesList: []
        });
      }

      const actualOutFile = path.join(outDir, smiFile);
      console.log("Reading SMILES from:", actualOutFile);

      fs.readFile(actualOutFile, "utf8", (fileReadErr, fileData) => {
        if (fileReadErr) {
          console.error("File read error:", fileReadErr);
          let message = `${errorPrefix}Eroare la citirea fișierului .smi: ${fileReadErr.message}.`;
          if (timedOutEnumeration) {
             message = `${errorPrefix}Generarea listei complete de izomeri pentru formula ${formula} ${actualTotalIsomers === COUNT_TIMED_OUT_MARKER ? '(număr total necunoscut)' : `(care are în total ${actualTotalIsomers} izomeri)`} a expirat (60s). Fișierul .smi nu a putut fi citit.`;
          }
          return res.json({
            timedOutEnumerationPartial: timedOutEnumeration,
            originalCountUnknown: countPreviouslyTimedOut,
            formula: formula,
            actualTotalIsomers: actualTotalIsomers,
            partialSmilesCount: 0,
            message: message,
            smilesList: []
          });
        }

        let lines = fileData.split("\n").map(l => l.trim()).filter(Boolean);
        console.log(`Găsit ${lines.length} izomeri în fișier (poate fi parțial dacă a fost timeout)`);

        // Aplicăm limita de 1500 izomeri
        const maxIsomers = 1500;
        let isLimitedTo1500 = false;
        
        if (lines.length > maxIsomers) {
          lines = lines.slice(0, maxIsomers);
          isLimitedTo1500 = true;
        }

        if (timedOutEnumeration) {
          let message = `Generarea izomerilor pentru formula ${formula} ${actualTotalIsomers === COUNT_TIMED_OUT_MARKER ? '(număr total necunoscut)' : `(care are în total ${actualTotalIsomers} izomeri)`} a expirat după 45 secunde. Am reușit să generez ${lines.length} izomeri înainte de expirare.`;
          if (countPreviouslyTimedOut) {
            message = `Numărarea inițială pentru formula ${formula} a expirat după 30 secunde. Generarea izomerilor a expirat și ea după 45 secunde. Am reușit să extragem ${lines.length} izomeri.`;
          }
          if (isLimitedTo1500) {
            message += ` Afișez primii 1500 pentru performanță optimă.`;
          }
          return res.json({
            timedOutEnumerationPartial: true,
            originalCountUnknown: countPreviouslyTimedOut,
            formula: formula,
            actualTotalIsomers: actualTotalIsomers,
            partialSmilesCount: lines.length,
            limitedTo1500: isLimitedTo1500,
            message: message,
            smilesList: lines
          });
        }
        
        if (code !== 0) { // Maygen enumeration failed for other reasons
          return res.json({
            originalCountUnknown: countPreviouslyTimedOut,
            error: `${errorPrefix}Procesul Maygen (enumerare) a eșuat (cod ${code}) dar un fișier .smi a fost găsit cu ${lines.length} izomeri. Stderr: ${stderrData}`,
            smilesList: lines.slice(0,1500) // Offer partial results if any
          });
        }

        // Normal successful completion of enumeration
        let finalMessage = null;

        if (countPreviouslyTimedOut) {
          if (isLimitedTo1500) {
            finalMessage = `Numărarea inițială pentru formula ${formula} a expirat după 30 secunde. Am generat peste 1500 izomeri; afișez primii 1500 pentru performanță optimă.`;
          } else {
            finalMessage = `Numărarea inițială pentru formula ${formula} a expirat după 30 secunde. Am reușit să generez cu succes ${lines.length} izomeri.`;
          }
        } else { // Count was successful
          if (isLimitedTo1500) {
            finalMessage = `Din totalul de ${actualTotalIsomers} izomeri, afișez primii 1500 pentru performanță optimă.`;
          } else {
            // Succes complet - nu este nevoie de mesaj special
            finalMessage = `Generarea completă: ${lines.length} izomeri pentru formula ${formula}.`;
          }
        }

        // Salvează în istoric dacă utilizatorul este autentificat
        if (req.session.userId) {
          const isomerCountToSave = isLimitedTo1500 ? actualTotalIsomers : lines.length;
          
          userDb.run(
            "INSERT INTO user_isomers (user_id, formula, isomer_count) VALUES (?, ?, ?)",
            [req.session.userId, formula, isomerCountToSave],
            function (err) {
              if (err) {
                console.error("Eroare la salvarea în istoric:", err);
              } else {
                console.log(`Salvat în istoric: ${formula} cu ${isomerCountToSave} izomeri`);
                
                // Update user stats and check for badges
                updateIsomerStats(req.session.userId);
                updateUserActivity(req.session.userId);
              }
            }
          );
        }

      res.json({
        formula,
          count: lines.length,
          limitedTo1500: isLimitedTo1500,
          actualTotalIsomers: actualTotalIsomers,
          originalCountUnknown: countPreviouslyTimedOut,
          message: finalMessage,
        smilesList: lines
      });
    });
  });
});
}



// ── Initialize Profanity Database ─────────────────────────────────
/**
 * Initialize the profanity database with common Romanian swear words
 */
function initializeProfanityDatabase() {
  // Common Romanian profanity words to block
  const initialWords = [
    // Tier 1 - Most severe
    { word: "pula", severity: 3, category: "sexual" },
    { word: "pizda", severity: 3, category: "sexual" },
    { word: "muie", severity: 3, category: "sexual" },
    { word: "futut", severity: 3, category: "sexual" },
    { word: "fute", severity: 3, category: "sexual" },
    { word: "cacat", severity: 3, category: "scatological" },
    { word: "rahat", severity: 3, category: "scatological" },
    
    // Tier 2 - Moderate
    { word: "prost", severity: 2, category: "insult" },
    { word: "idiot", severity: 2, category: "insult" },
    { word: "imbecil", severity: 2, category: "insult" },
    { word: "cretin", severity: 2, category: "insult" },
    { word: "tâmpit", severity: 2, category: "insult" },
    { word: "tampit", severity: 2, category: "insult" },
    { word: "retardat", severity: 2, category: "insult" },
    { word: "handicapat", severity: 2, category: "insult" },
    
    // Tier 1 - Mild but still inappropriate
    { word: "dracu", severity: 1, category: "mild" },
    { word: "dracului", severity: 1, category: "mild" },
    { word: "naiba", severity: 1, category: "mild" },
    { word: "dracu", severity: 1, category: "mild" },
    { word: "mortii", severity: 1, category: "mild" },
    { word: "mortilor", severity: 1, category: "mild" }
  ];
  
  // Check if database already has words
  userDb.get("SELECT COUNT(*) as count FROM profanity_words", [], (err, result) => {
    if (err) {
      console.error("Error checking profanity database:", err);
      return;
    }
    
    // Only initialize if database is empty
    if (result.count === 0) {
      console.log("Initializing profanity database with Romanian words...");
      
      initialWords.forEach(wordData => {
        addProfanityWord(wordData.word, wordData.severity, wordData.category, null)
          .catch(error => {
            console.error(`Error adding initial word "${wordData.word}":`, error);
          });
      });
      
      console.log(`Added ${initialWords.length} initial profanity words to database`);
    }
  });
}

// ── Chemical Elements API Endpoints ─────────────────────────────────
// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: "API is working!", timestamp: new Date().toISOString() });
});

// Get all chemical elements
app.get('/api/elements', (req, res) => {
  userDb.all(
    "SELECT symbol, name_ro, name_en, atomic_mass, atomic_number FROM chemical_elements ORDER BY atomic_number ASC",
    [],
    (err, elements) => {
      if (err) {
        console.error("Error fetching chemical elements:", err);
        return res.status(500).json({ error: "Database error" });
      }
      
      res.json({ elements: elements || [] });
    }
  );
});

// Get atomic masses only (for calculations)
app.get('/api/elements/masses', (req, res) => {
  userDb.all(
    "SELECT symbol, atomic_mass FROM chemical_elements ORDER BY symbol ASC",
    [],
    (err, elements) => {
      if (err) {
        console.error("Error fetching atomic masses:", err);
        return res.status(500).json({ error: "Database error" });
      }
      
      // Convert to object format for easier use in frontend
      const atomicMasses = {};
      elements.forEach(element => {
        atomicMasses[element.symbol] = element.atomic_mass;
      });
      
      res.json({ atomicMasses });
    }
  );
});

// Get element names only (for display)
app.get('/api/elements/names', (req, res) => {
  userDb.all(
    "SELECT symbol, name_ro FROM chemical_elements ORDER BY symbol ASC",
    [],
    (err, elements) => {
      if (err) {
        console.error("Error fetching element names:", err);
        return res.status(500).json({ error: "Database error" });
      }
      
      // Convert to object format for easier use in frontend
      const elementNames = {};
      elements.forEach(element => {
        elementNames[element.symbol] = element.name_ro;
      });
      
      res.json({ elementNames });
    }
  );
});

// Get specific element by symbol
app.get('/api/elements/:symbol', (req, res) => {
  const symbol = req.params.symbol;
  
  userDb.get(
    "SELECT * FROM chemical_elements WHERE symbol = ? COLLATE NOCASE",
    [symbol],
    (err, element) => {
      if (err) {
        console.error("Error fetching element:", err);
        return res.status(500).json({ error: "Database error" });
      }
      
      if (!element) {
        return res.status(404).json({ error: "Element not found" });
      }
      
      res.json({ element });
    }
  );
});

// Specific route for service worker to ensure it's served from root (MUST be before static middleware)
app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(path.join(__dirname, 'public', 'app', 'sw.js'));
});

// Specific route for manifest to ensure it's served from root (MUST be before static middleware)
app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(path.join(__dirname, 'public', 'app', 'manifest.json'));
});

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Serve PWA files with proper headers
app.use('/app', express.static(path.join(__dirname, "public", "app"), {
  setHeaders: (res, path) => {
    // Set proper headers for PWA files
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    } else if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.gif') || path.endsWith('.svg')) {
      res.setHeader('Content-Type', `image/${path.split('.').pop()}`);
    }
    
    // Cache PWA files for better performance
    if (path.includes('manifest.json') || path.includes('sw.js') || path.includes('pwa.js')) {
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache
    }
  }
}));

// Note: Root static files are now served from /public directory only
// Removed express.static(__dirname) to prevent conflicts with PWA files

// PWA status check endpoint
app.get('/pwa-status', (req, res) => {
  res.json({
    status: 'PWA Ready',
    manifest: '/manifest.json',
    serviceWorker: '/sw.js',
    installable: true,
    features: [
      'Native App Installation',
      'Install to Home Screen',
      'Push Notifications',
      'Background Sync'
    ]
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log("Server listening on port", PORT);
});

// ── Badge System Functions ─────────────────────────────────────────

// Initialize user stats when they register
function initializeUserStats(userId) {
  const today = new Date().toISOString().split('T')[0];
  
  userDb.run(`
    INSERT OR IGNORE INTO user_stats (
      user_id, account_created, days_active, last_activity_date
    ) VALUES (?, ?, 1, ?)
  `, [userId, today, today], (err) => {
    if (err) {
      console.error('Error initializing user stats:', err);
    }
  });
}

// Update user activity and streak
function updateUserActivity(userId) {
  const today = new Date().toISOString().split('T')[0];
  
  userDb.get(
    'SELECT * FROM user_stats WHERE user_id = ?',
    [userId],
    (err, stats) => {
      if (err) {
        console.error('Error fetching user stats:', err);
        return;
      }
      
      if (!stats) {
        // Initialize stats if they don't exist
        initializeUserStats(userId);
        return;
      }
      
      const lastActivity = stats.last_activity_date;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      let newStreak = stats.current_streak;
      let newDaysActive = stats.days_active;
      
      // Only update if it's a new day
      if (lastActivity !== today) {
        newDaysActive++;
        
        if (lastActivity === yesterdayStr) {
          // Consecutive day - increment streak
          newStreak++;
        } else {
          // Streak broken - reset to 1
          newStreak = 1;
        }
        
        // Update longest streak if current is higher
        const longestStreak = Math.max(stats.longest_streak, newStreak);
        
        userDb.run(`
          UPDATE user_stats 
          SET days_active = ?, current_streak = ?, longest_streak = ?, last_activity_date = ?
          WHERE user_id = ?
        `, [newDaysActive, newStreak, longestStreak, today, userId]);
        
        // Check for new badges after activity update
        checkAndAwardBadges(userId);
      }
    }
  );
}

// Update isomer generation count
function updateIsomerStats(userId) {
  userDb.run(`
    UPDATE user_stats 
    SET isomers_generated = isomers_generated + 1
    WHERE user_id = ?
  `, [userId], (err) => {
    if (err) {
      console.error('Error updating isomer stats:', err);
    } else {
      checkAndAwardBadges(userId);
    }
  });
}

// Update quiz completion stats
function updateQuizStats(userId, score, totalQuestions, timeTaken) {
  const percentage = Math.round((score / totalQuestions) * 100);
  const isPerfect = percentage === 100;
  
  userDb.run(`
    UPDATE user_stats 
    SET 
      quizzes_completed = quizzes_completed + 1,
      quizzes_perfect = quizzes_perfect + ?,
      total_quiz_score = total_quiz_score + ?,
      total_quiz_questions = total_quiz_questions + ?,
      total_study_time = total_study_time + ?
    WHERE user_id = ?
  `, [isPerfect ? 1 : 0, score, totalQuestions, timeTaken, userId], (err) => {
    if (err) {
      console.error('Error updating quiz stats:', err);
    } else {
      checkAndAwardBadges(userId);
      checkSpecialBadges(userId, timeTaken, percentage);
    }
  });
}

// Check for special badges (speed, time-based, etc.)
function checkSpecialBadges(userId, timeTaken, percentage) {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Speed Demon badge (under 2 minutes)
  if (timeTaken < 120) {
    awardSpecialBadge(userId, 'Speed Demon');
  }
  
  // Night Owl badge (after midnight)
  if (hour >= 0 && hour < 6) {
    awardSpecialBadge(userId, 'Night Owl');
  }
  
  // Early Bird badge (before 6 AM)
  if (hour >= 4 && hour < 6) {
    awardSpecialBadge(userId, 'Early Bird');
  }
  
  // Weekend Warrior badge (weekends)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    updateSpecialProgress(userId, 'Weekend Warrior');
  }
}

// Send badge notification to user
function sendBadgeNotification(userId, badge) {
  userDb.run(
    'INSERT INTO notifications (user_id, type, badge_id) VALUES (?, ?, ?)',
    [userId, 'badge_earned', badge.id],
    (err) => {
      if (err) {
        console.error('Error creating badge notification:', err);
      } else {
        console.log(`📬 Badge notification sent to user ${userId} for badge: ${badge.name}`);
      }
    }
  );
}

// Update progress for special badges that require multiple occurrences
function updateSpecialProgress(userId, badgeName) {
  userDb.get(
    'SELECT id, requirement_value FROM badges WHERE name = ?',
    [badgeName],
    (err, badge) => {
      if (err || !badge) return;
      
      userDb.run(
        'INSERT OR REPLACE INTO badge_progress (user_id, badge_id, current_progress) VALUES (?, ?, COALESCE((SELECT current_progress FROM badge_progress WHERE user_id = ? AND badge_id = ?), 0) + 1)',
        [userId, badge.id, userId, badge.id],
        (err) => {
          if (err) return;
          
          // Check if badge should be awarded
          userDb.get(
            'SELECT current_progress FROM badge_progress WHERE user_id = ? AND badge_id = ?',
            [userId, badge.id],
            (err, progress) => {
              if (err || !progress) return;
              
              if (progress.current_progress >= badge.requirement_value) {
                // Check if badge is already earned
                userDb.get(
                  'SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?',
                  [userId, badge.id],
                  (err, existing) => {
                    if (err || existing) return;
                    
                    // Award the badge
                    userDb.run(
                      'INSERT INTO user_badges (user_id, badge_id, progress_when_earned) VALUES (?, ?, ?)',
                      [userId, badge.id, progress.current_progress],
                      (err) => {
                        if (!err) {
                          console.log(`🏆 User ${userId} earned special badge: ${badgeName}`);
                          sendBadgeNotification(userId, badge);
                        }
                      }
                    );
                  }
                );
              }
            }
          );
        }
      );
    }
  );
}

// Award special badge if not already earned
function awardSpecialBadge(userId, badgeName) {
  userDb.get(
    'SELECT id FROM badges WHERE name = ?',
    [badgeName],
    (err, badge) => {
      if (err || !badge) return;
      
      userDb.get(
        'SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?',
        [userId, badge.id],
        (err, existing) => {
          if (err || existing) return;
          
          // Award the badge
          userDb.run(
            'INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)',
            [userId, badge.id],
            (err) => {
              if (!err) {
                console.log(`🏆 User ${userId} earned special badge: ${badgeName}`);
                // Send real-time notification if possible
                sendBadgeNotification(userId, badge);
              }
            }
          );
        }
      );
    }
  );
}

// Update progress for special badges that require multiple occurrences
function updateSpecialProgress(userId, badgeName) {
  userDb.get(
    'SELECT id, requirement_value FROM badges WHERE name = ?',
    [badgeName],
    (err, badge) => {
      if (err || !badge) return;
      
      userDb.run(`
        INSERT OR REPLACE INTO badge_progress (user_id, badge_id, current_progress, updated_at)
        VALUES (?, ?, COALESCE((SELECT current_progress FROM badge_progress WHERE user_id = ? AND badge_id = ?), 0) + 1, CURRENT_TIMESTAMP)
      `, [userId, badge.id, userId, badge.id], (err) => {
        if (err) return;
        
        // Check if badge should be awarded
        userDb.get(
          'SELECT current_progress FROM badge_progress WHERE user_id = ? AND badge_id = ?',
          [userId, badge.id],
          (err, progress) => {
            if (err || !progress) return;
            
            if (progress.current_progress >= badge.requirement_value) {
              awardSpecialBadge(userId, badgeName);
            }
          }
        );
      });
    }
  );
}

// Main badge checking function
function checkAndAwardBadges(userId) {
  userDb.get(
    'SELECT * FROM user_stats WHERE user_id = ?',
    [userId],
    (err, stats) => {
      if (err || !stats) return;
      
      // Get all badges and check requirements
      userDb.all(
        'SELECT * FROM badges',
        (err, badges) => {
          if (err) return;
          
          badges.forEach(badge => {
            checkBadgeRequirement(userId, badge, stats);
          });
        }
      );
    }
  );
}

// Check individual badge requirement
function checkBadgeRequirement(userId, badge, stats) {
  let currentValue = 0;
  
  switch (badge.requirement_type) {
    case 'isomers_generated':
      currentValue = stats.isomers_generated;
      break;
    case 'quizzes_completed':
      currentValue = stats.quizzes_completed;
      break;
    case 'quizzes_perfect':
      currentValue = stats.quizzes_perfect;
      break;
    case 'days_active':
      currentValue = stats.days_active;
      break;
    case 'current_streak':
      currentValue = stats.current_streak;
      break;
    case 'longest_streak':
      currentValue = stats.longest_streak;
      break;
    case 'average_score':
      currentValue = stats.total_quiz_questions > 0 ? 
        Math.round((stats.total_quiz_score / stats.total_quiz_questions) * 100) : 0;
      break;
    default:
      return; // Skip special badges
  }
  
  // Check if requirement is met and badge not already earned
  if (currentValue >= badge.requirement_value) {
    userDb.get(
      'SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?',
      [userId, badge.id],
      (err, existing) => {
        if (err || existing) return;
        
        // Award the badge
        userDb.run(
          'INSERT INTO user_badges (user_id, badge_id, progress_when_earned) VALUES (?, ?, ?)',
          [userId, badge.id, currentValue],
          (err) => {
            if (!err) {
              console.log(`🏆 User ${userId} earned badge: ${badge.name}`);
              // Send real-time notification if possible
              sendBadgeNotification(userId, badge);
            }
          }
        );
      }
    );
  }
}

// Get user's badges and progress
function getUserBadges(userId, callback) {
  const query = `
    SELECT 
      b.*,
      ub.earned_at,
      ub.progress_when_earned,
      CASE WHEN ub.id IS NOT NULL THEN 1 ELSE 0 END as earned
    FROM badges b
    LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = ?
    ORDER BY b.category, b.requirement_value
  `;
  
  userDb.all(query, [userId], (err, badges) => {
    if (err) {
      callback(err, null);
      return;
    }
    
    // Get current progress for unearned badges
    userDb.get(
      'SELECT * FROM user_stats WHERE user_id = ?',
      [userId],
      (err, stats) => {
        if (err) {
          callback(err, null);
          return;
        }
        
        const badgesWithProgress = badges.map(badge => {
          let currentProgress = 0;
          
          if (!badge.earned && stats) {
            switch (badge.requirement_type) {
              case 'isomers_generated':
                currentProgress = stats.isomers_generated;
                break;
              case 'quizzes_completed':
                currentProgress = stats.quizzes_completed;
                break;
              case 'quizzes_perfect':
                currentProgress = stats.quizzes_perfect;
                break;
              case 'days_active':
                currentProgress = stats.days_active;
                break;
              case 'current_streak':
                currentProgress = stats.current_streak;
                break;
              case 'longest_streak':
                currentProgress = stats.longest_streak;
                break;
              case 'average_score':
                currentProgress = stats.total_quiz_questions > 0 ? 
                  Math.round((stats.total_quiz_score / stats.total_quiz_questions) * 100) : 0;
                break;
            }
          }
          
          return {
            ...badge,
            current_progress: currentProgress,
            progress_percentage: badge.requirement_value > 0 ? 
              Math.min(100, Math.round((currentProgress / badge.requirement_value) * 100)) : 0
          };
        });
        
        callback(null, badgesWithProgress);
      }
    );
  });
}

// Send badge notification to user
function sendBadgeNotification(userId, badge) {
  // Store notification in session or memory for pickup
  if (!global.userNotifications) {
    global.userNotifications = {};
  }
  
  if (!global.userNotifications[userId]) {
    global.userNotifications[userId] = [];
  }
  
  global.userNotifications[userId].push({
    type: 'badge_earned',
    badge: {
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      points: badge.points,
      rarity: badge.rarity
    },
    timestamp: new Date().toISOString()
  });
  
  // Keep only last 10 notifications per user
  if (global.userNotifications[userId].length > 10) {
    global.userNotifications[userId] = global.userNotifications[userId].slice(-10);
  }
}

// ── Badge System API Endpoints ───────────────────────────────────

// Get user's profile with badges and stats
app.get("/api/profile", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const userId = req.session.userId;

  // Get user basic info
  userDb.get(
    "SELECT id, username, email, role, country, created_at FROM users WHERE id = ?",
    [userId],
    (err, user) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (!user) return res.status(404).json({ error: "User not found" });

      // Get real statistics from actual usage data
      const statsQueries = [
        // Total isomers generated
        "SELECT COUNT(*) as isomers_generated FROM user_isomers WHERE user_id = ?",
        // Total quiz attempts
        "SELECT COUNT(*) as quizzes_completed FROM quiz_results WHERE user_id = ?",
        // Perfect scores (100%)
        "SELECT COUNT(*) as quizzes_perfect FROM quiz_results WHERE user_id = ? AND percentage = 100",
        // Average score calculation
        "SELECT AVG(percentage) as average_score, SUM(time_taken) as total_study_time FROM quiz_results WHERE user_id = ?",
        // Homework submissions
        "SELECT COUNT(*) as homework_completed FROM homework_submissions WHERE user_id = ?",
        // Latest activity date
        "SELECT MAX(completed_at) as last_activity FROM quiz_results WHERE user_id = ?",
        // Quiz score totals for detailed average
        "SELECT SUM(score) as total_score, SUM(total_questions) as total_questions FROM quiz_results WHERE user_id = ?"
      ];

      let completed = 0;
      const realStats = {};

      statsQueries.forEach((query, index) => {
        userDb.get(query, [userId], (err, result) => {
          completed++;
          
          if (!err && result) {
            switch(index) {
              case 0: realStats.isomers_generated = result.isomers_generated || 0; break;
              case 1: realStats.quizzes_completed = result.quizzes_completed || 0; break;
              case 2: realStats.quizzes_perfect = result.quizzes_perfect || 0; break;
              case 3: 
                realStats.average_score = Math.round(result.average_score || 0);
                realStats.total_study_time = result.total_study_time || 0;
                break;
              case 4: realStats.homework_completed = result.homework_completed || 0; break;
              case 5: realStats.last_activity_date = result.last_activity || null; break;
              case 6:
                // More accurate average calculation
                if (result.total_questions > 0) {
                  realStats.detailed_average_score = Math.round((result.total_score / result.total_questions) * 100);
                } else {
                  realStats.detailed_average_score = 0;
                }
                break;
            }
          }

          if (completed === statsQueries.length) {
            // Get fallback stats from user_stats table for streak info
            userDb.get(
              "SELECT current_streak, longest_streak, days_active, account_created FROM user_stats WHERE user_id = ?",
              [userId],
              (err, fallbackStats) => {
                if (err || !fallbackStats) {
                  // Initialize stats if they don't exist
                  initializeUserStats(userId);
                  fallbackStats = {
                    current_streak: 0,
                    longest_streak: 0,
                    days_active: 1,
                    account_created: user.created_at || new Date().toISOString().split('T')[0]
                  };
                }

                // Combine real stats with fallback stats
                const combinedStats = {
                  ...realStats,
                  current_streak: fallbackStats.current_streak || 0,
                  longest_streak: fallbackStats.longest_streak || 0,
                  days_active: fallbackStats.days_active || 1,
                  account_created: fallbackStats.account_created || user.created_at,
                  // Use the more accurate average if available
                  average_score: realStats.detailed_average_score || realStats.average_score || 0
                };

                // Get user badges
                getUserBadges(userId, (err, badges) => {
                  if (err) return res.status(500).json({ error: "Database error" });

                  // Calculate additional stats
                  const accountAge = Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24));
                  const totalPoints = badges.filter(b => b.earned).reduce((sum, badge) => sum + badge.points, 0);
                  const earnedBadges = badges.filter(b => b.earned).length;
                  const totalBadges = badges.length;

                  // Group badges by category
                  const badgesByCategory = {};
                  badges.forEach(badge => {
                    if (!badgesByCategory[badge.category]) {
                      badgesByCategory[badge.category] = [];
                    }
                    badgesByCategory[badge.category].push(badge);
                  });

                  res.json({
                    user: {
                      ...user,
                      account_age_days: accountAge
                    },
                    stats: {
                      ...combinedStats,
                      total_points: totalPoints,
                      badges_earned: earnedBadges,
                      badges_total: totalBadges,
                      completion_percentage: totalBadges > 0 ? Math.round((earnedBadges / totalBadges) * 100) : 0
                    },
                    badges: badgesByCategory
                  });
                });
              }
            );
          }
        });
      });
    }
  );
});

// Get all badges (for reference/showcase)
app.get("/api/badges", (req, res) => {
  userDb.all(
    "SELECT * FROM badges ORDER BY category, requirement_value",
    (err, badges) => {
      if (err) return res.status(500).json({ error: "Database error" });
      
      // Group badges by category
      const badgesByCategory = {};
      badges.forEach(badge => {
        if (!badgesByCategory[badge.category]) {
          badgesByCategory[badge.category] = [];
        }
        badgesByCategory[badge.category].push(badge);
      });

      res.json({ badges: badgesByCategory });
    }
  );
});

// Get badge notifications for current user
app.get("/api/notifications", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  userDb.all(
    `SELECT n.*, b.name, b.description, b.icon, b.points, b.rarity
     FROM notifications n
     JOIN badges b ON n.badge_id = b.id
     WHERE n.user_id = ? AND n.read = 0 AND n.type = 'badge_earned'
     ORDER BY n.created_at DESC`,
    [req.session.userId],
    (err, notifications) => {
      if (err) {
        console.error("Error fetching notifications:", err);
        return res.status(500).json({ error: "DB error" });
      }
      
      const formattedNotifications = notifications.map(notification => ({
        id: notification.id,
        type: notification.type,
        badge: {
          name: notification.name,
          description: notification.description,
          icon: notification.icon,
          points: notification.points,
          rarity: notification.rarity
        },
        created_at: notification.created_at
      }));
      
      res.json({ notifications: formattedNotifications });
    }
  );
});

// Clear badge notifications for current user
app.post("/api/notifications/clear", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  userDb.run(
    "UPDATE notifications SET read = 1 WHERE user_id = ? AND type = 'badge_earned'",
    [req.session.userId],
    function(err) {
      if (err) {
        console.error("Error clearing notifications:", err);
        return res.status(500).json({ error: "DB error" });
      }
      
      res.json({ message: "Notifications cleared", cleared: this.changes });
    }
  );
});

// Debug endpoint to check database content
app.get("/debug-db", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const queries = [
    "SELECT COUNT(*) as user_count FROM users",
    "SELECT COUNT(*) as classes_count FROM classes", 
    "SELECT COUNT(*) as classrooms_count FROM classrooms",
    "SELECT COUNT(*) as class_members_count FROM class_members",
    "SELECT COUNT(*) as classroom_members_count FROM classroom_members",
    "SELECT COUNT(*) as quiz_results_count FROM quiz_results",
    "SELECT COUNT(*) as homework_count FROM homework_assignments",
    "SELECT COUNT(*) as homework_submissions_count FROM homework_submissions",
    `SELECT id, username, role FROM users WHERE id = ${req.session.userId}`,
    `SELECT * FROM class_members WHERE student_id = ${req.session.userId}`,
    `SELECT * FROM classroom_members WHERE student_id = ${req.session.userId}`,
    `SELECT * FROM quiz_results WHERE user_id = ${req.session.userId} LIMIT 3`
  ];

  const results = {};
  let completed = 0;

  queries.forEach((query, index) => {
    console.log(`🔍 Debug query ${index + 1}: ${query}`);
    userDb.all(query, [], (err, result) => {
      completed++;
      if (err) {
        console.error(`❌ Debug query ${index + 1} error:`, err);
        results[`query_${index + 1}`] = { error: err.message };
      } else {
        console.log(`✅ Debug query ${index + 1} result:`, result);
        results[`query_${index + 1}`] = result;
      }

      if (completed === queries.length) {
        res.json(results);
      }
    });
  });
});

// Get admin statistics for dashboard
app.get("/admin-stats", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  console.log("🔍 Admin stats requested for user ID:", req.session.userId);

  // Get user role to determine what stats to show
  userDb.get(
    "SELECT role, username FROM users WHERE id = ?",
    [req.session.userId],
    (err, user) => {
      if (err || !user) {
        console.error("❌ Error fetching user data:", err);
        return res.status(500).json({ error: "Error fetching user data" });
      }

      console.log("👤 User found:", user.username, "Role:", user.role);

      const isTeacher = user.role === 'professor';
      const isStudent = user.role === 'student';

      if (isTeacher) {
        console.log("👨‍🏫 Loading teacher stats...");
        // Teacher stats: classes created, students, quizzes, homework
        const statsQueries = [
          // Check both classes and classrooms tables
          "SELECT COUNT(*) as classes FROM classes WHERE professor_id = ?",
          "SELECT COUNT(*) as classrooms FROM classrooms WHERE creator_id = ?",
          // Total students in teacher's classes (check both tables)
          `SELECT COUNT(DISTINCT cm.student_id) as students_classes 
           FROM class_members cm 
           JOIN classes c ON cm.class_id = c.id 
           WHERE c.professor_id = ?`,
          `SELECT COUNT(DISTINCT cm.student_id) as students_classrooms 
           FROM classroom_members cm 
           JOIN classrooms c ON cm.classroom_id = c.id 
           WHERE c.creator_id = ?`,
          // Total quiz results/completions 
          "SELECT COUNT(*) as quiz_results FROM quiz_results WHERE user_id = ?",
          // Total homework assignments 
          "SELECT COUNT(*) as homework FROM homework_assignments WHERE professor_id = ?"
        ];

        let completed = 0;
        const results = {};

        statsQueries.forEach((query, index) => {
          console.log(`📊 Executing query ${index + 1}:`, query);
          userDb.get(query, [req.session.userId], (err, result) => {
            completed++;
            
            if (err) {
              console.error(`❌ Error in query ${index + 1}:`, err);
            } else {
              console.log(`✅ Query ${index + 1} result:`, result);
              switch(index) {
                case 0: results.classes = result.classes || 0; break;
                case 1: results.classrooms = result.classrooms || 0; break;
                case 2: results.students_classes = result.students_classes || 0; break;
                case 3: results.students_classrooms = result.students_classrooms || 0; break;
                case 4: results.quiz_results = result.quiz_results || 0; break;
                case 5: results.homework = result.homework || 0; break;
              }
            }

            if (completed === statsQueries.length) {
              // Combine results for final response
              const finalResults = {
                classes: (results.classes || 0) + (results.classrooms || 0),
                students: (results.students_classes || 0) + (results.students_classrooms || 0),
                quizzes: results.quiz_results || 0,
                homework: results.homework || 0
              };
              console.log("📈 Final teacher results:", finalResults);
              res.json(finalResults);
            }
          });
        });

      } else if (isStudent) {
        console.log("🎓 Loading student stats...");
        // Student stats: joined classes, completed homework, available quizzes
        const statsQueries = [
          // Classes student has joined (check both tables)
          "SELECT COUNT(*) as joinedClasses FROM class_members WHERE student_id = ?",
          "SELECT COUNT(*) as joinedClassrooms FROM classroom_members WHERE student_id = ?",
          // Quiz attempts by this student
          "SELECT COUNT(*) as quizzes FROM quiz_results WHERE user_id = ?",
          // Homework assignments available to this student
          `SELECT COUNT(*) as homework 
           FROM homework_assignments ha 
           JOIN class_members cm ON ha.class_id = cm.class_id 
           WHERE cm.student_id = ?`,
          // Completed homework by this student
          "SELECT COUNT(*) as completedHomework FROM homework_submissions WHERE user_id = ?"
        ];

        let completed = 0;
        const results = {};

        statsQueries.forEach((query, index) => {
          console.log(`📊 Executing student query ${index + 1}:`, query);
          userDb.get(query, [req.session.userId], (err, result) => {
            completed++;
            
            if (err) {
              console.error(`❌ Error in student query ${index + 1}:`, err);
            } else {
              console.log(`✅ Student query ${index + 1} result:`, result);
              switch(index) {
                case 0: results.joinedClasses = result.joinedClasses || 0; break;
                case 1: results.joinedClassrooms = result.joinedClassrooms || 0; break;
                case 2: results.quizzes = result.quizzes || 0; break;
                case 3: results.homework = result.homework || 0; break;
                case 4: results.completedHomework = result.completedHomework || 0; break;
              }
            }

            if (completed === statsQueries.length) {
              // Combine results for final response
              const finalResults = {
                joinedClasses: (results.joinedClasses || 0) + (results.joinedClassrooms || 0),
                quizzes: results.quizzes || 0,
                homework: results.homework || 0,
                completedHomework: results.completedHomework || 0
              };
              console.log("📈 Final student results:", finalResults);
              res.json(finalResults);
            }
          });
        });

      } else {
        console.log("❓ Unknown role, using default fallback");
        // Default fallback stats
        res.json({
          classes: 0,
          students: 0,
          quizzes: 0,
          homework: 0,
          joinedClasses: 0,
          completedHomework: 0
        });
      }
    }
  );
});

// Get badge leaderboard
app.get("/api/leaderboard/badges", (req, res) => {
  const query = `
    SELECT 
      u.username,
      u.country,
      us.total_quiz_questions,
      us.total_quiz_score,
      COUNT(ub.badge_id) as badges_earned,
      SUM(b.points) as total_points,
      us.current_streak,
      us.longest_streak,
      us.days_active
    FROM users u
    LEFT JOIN user_stats us ON u.id = us.user_id
    LEFT JOIN user_badges ub ON u.id = ub.user_id
    LEFT JOIN badges b ON ub.badge_id = b.id
    GROUP BY u.id
    ORDER BY total_points DESC, badges_earned DESC
    LIMIT 50
  `;

  userDb.all(query, (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });

    const leaderboard = results.map(result => ({
      ...result,
      average_score: result.total_quiz_questions > 0 ? 
        Math.round((result.total_quiz_score / result.total_quiz_questions) * 100) : 0,
      total_points: result.total_points || 0,
      badges_earned: result.badges_earned || 0
    }));

    res.json({ leaderboard });
  });
});

// Get recent badge awards (for activity feed)
app.get("/api/recent-badges", (req, res) => {
  const query = `
    SELECT 
      u.username,
      b.name,
      b.icon,
      b.rarity,
      ub.earned_at
    FROM user_badges ub
    JOIN users u ON ub.user_id = u.id
    JOIN badges b ON ub.badge_id = b.id
    ORDER BY ub.earned_at DESC
    LIMIT 20
  `;

  userDb.all(query, (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ recent_badges: results });
  });
});

// Manual badge check endpoint (for testing)
app.post("/api/check-badges", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  checkAndAwardBadges(req.session.userId);
  res.json({ message: "Badge check completed" });
});

// Get user notifications
app.get("/api/notifications", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const userId = req.session.userId;
  const notifications = global.userNotifications?.[userId] || [];
  
  res.json({ notifications });
});

// Clear user notifications
app.post("/api/notifications/clear", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const userId = req.session.userId;
  if (global.userNotifications && global.userNotifications[userId]) {
    global.userNotifications[userId] = [];
  }
  
  res.json({ message: "Notifications cleared" });
});