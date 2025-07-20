const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to database
const dbPath = path.join(__dirname, 'users.db');
const db = new sqlite3.Database(dbPath);

// Badge definitions organized by category
const badges = [
  // 🧪 ISOMER GENERATION BADGES
  {
    name: 'First Steps',
    description: 'Generate your first isomer',
    icon: '🧪',
    category: 'isomer_generation',
    requirement_type: 'isomers_generated',
    requirement_value: 1,
    points: 10,
    rarity: 'common'
  },
  {
    name: 'Molecule Explorer',
    description: 'Generate 10 different isomers',
    icon: '🔬',
    category: 'isomer_generation',
    requirement_type: 'isomers_generated',
    requirement_value: 10,
    points: 25,
    rarity: 'common'
  },
  {
    name: 'Isomer Specialist',
    description: 'Generate 25 different isomers',
    icon: '⚗️',
    category: 'isomer_generation',
    requirement_type: 'isomers_generated',
    requirement_value: 25,
    points: 50,
    rarity: 'uncommon'
  },
  {
    name: 'Molecular Architect',
    description: 'Generate 50 different isomers',
    icon: '🏗️',
    category: 'isomer_generation',
    requirement_type: 'isomers_generated',
    requirement_value: 50,
    points: 100,
    rarity: 'rare'
  },
  {
    name: 'Isomer Master',
    description: 'Generate 100 different isomers',
    icon: '👑',
    category: 'isomer_generation',
    requirement_type: 'isomers_generated',
    requirement_value: 100,
    points: 200,
    rarity: 'epic'
  },
  {
    name: 'Molecular Genius',
    description: 'Generate 250 different isomers',
    icon: '🧠',
    category: 'isomer_generation',
    requirement_type: 'isomers_generated',
    requirement_value: 250,
    points: 500,
    rarity: 'legendary'
  },

  // 📚 QUIZ PERFORMANCE BADGES
  {
    name: 'Quiz Rookie',
    description: 'Complete your first quiz',
    icon: '📝',
    category: 'quiz_performance',
    requirement_type: 'quizzes_completed',
    requirement_value: 1,
    points: 15,
    rarity: 'common'
  },
  {
    name: 'Knowledge Seeker',
    description: 'Complete 5 quizzes',
    icon: '📚',
    category: 'quiz_performance',
    requirement_type: 'quizzes_completed',
    requirement_value: 5,
    points: 30,
    rarity: 'common'
  },
  {
    name: 'Quiz Enthusiast',
    description: 'Complete 10 quizzes',
    icon: '🎯',
    category: 'quiz_performance',
    requirement_type: 'quizzes_completed',
    requirement_value: 10,
    points: 60,
    rarity: 'uncommon'
  },
  {
    name: 'Quiz Champion',
    description: 'Complete 25 quizzes',
    icon: '🏆',
    category: 'quiz_performance',
    requirement_type: 'quizzes_completed',
    requirement_value: 25,
    points: 150,
    rarity: 'rare'
  },
  {
    name: 'Quiz Legend',
    description: 'Complete 50 quizzes',
    icon: '🌟',
    category: 'quiz_performance',
    requirement_type: 'quizzes_completed',
    requirement_value: 50,
    points: 300,
    rarity: 'epic'
  },

  // 🎯 PERFECT SCORE BADGES
  {
    name: 'Perfect Start',
    description: 'Get 100% on your first quiz',
    icon: '✨',
    category: 'perfect_scores',
    requirement_type: 'quizzes_perfect',
    requirement_value: 1,
    points: 25,
    rarity: 'uncommon'
  },
  {
    name: 'Perfectionist',
    description: 'Get 100% on 3 quizzes',
    icon: '💎',
    category: 'perfect_scores',
    requirement_type: 'quizzes_perfect',
    requirement_value: 3,
    points: 75,
    rarity: 'rare'
  },
  {
    name: 'Flawless Mind',
    description: 'Get 100% on 5 quizzes',
    icon: '🧬',
    category: 'perfect_scores',
    requirement_type: 'quizzes_perfect',
    requirement_value: 5,
    points: 150,
    rarity: 'epic'
  },
  {
    name: 'Chemistry Prodigy',
    description: 'Get 100% on 10 quizzes',
    icon: '🔥',
    category: 'perfect_scores',
    requirement_type: 'quizzes_perfect',
    requirement_value: 10,
    points: 400,
    rarity: 'legendary'
  },

  // 📅 TIME-BASED BADGES
  {
    name: 'Dedicated Student',
    description: 'Use the platform for 7 days',
    icon: '📅',
    category: 'time_based',
    requirement_type: 'days_active',
    requirement_value: 7,
    points: 50,
    rarity: 'common'
  },
  {
    name: 'Month Warrior',
    description: 'Use the platform for 30 days',
    icon: '🗓️',
    category: 'time_based',
    requirement_type: 'days_active',
    requirement_value: 30,
    points: 100,
    rarity: 'uncommon'
  },
  {
    name: 'Semester Scholar',
    description: 'Use the platform for 90 days',
    icon: '📖',
    category: 'time_based',
    requirement_type: 'days_active',
    requirement_value: 90,
    points: 200,
    rarity: 'rare'
  },
  {
    name: 'Year Veteran',
    description: 'Use the platform for 365 days',
    icon: '🎓',
    category: 'time_based',
    requirement_type: 'days_active',
    requirement_value: 365,
    points: 500,
    rarity: 'epic'
  },

  // 🔥 STREAK BADGES
  {
    name: 'On Fire',
    description: 'Maintain a 3-day activity streak',
    icon: '🔥',
    category: 'streaks',
    requirement_type: 'current_streak',
    requirement_value: 3,
    points: 30,
    rarity: 'common'
  },
  {
    name: 'Unstoppable',
    description: 'Maintain a 7-day activity streak',
    icon: '⚡',
    category: 'streaks',
    requirement_type: 'current_streak',
    requirement_value: 7,
    points: 70,
    rarity: 'uncommon'
  },
  {
    name: 'Consistency King',
    description: 'Maintain a 14-day activity streak',
    icon: '👑',
    category: 'streaks',
    requirement_type: 'longest_streak',
    requirement_value: 14,
    points: 150,
    rarity: 'rare'
  },
  {
    name: 'Streak Master',
    description: 'Maintain a 30-day activity streak',
    icon: '🏅',
    category: 'streaks',
    requirement_type: 'longest_streak',
    requirement_value: 30,
    points: 300,
    rarity: 'epic'
  },

  // 🌟 SPECIAL ACHIEVEMENTS
  {
    name: 'Speed Demon',
    description: 'Complete a quiz in under 2 minutes',
    icon: '💨',
    category: 'special',
    requirement_type: 'special_speed',
    requirement_value: 120,
    points: 100,
    rarity: 'rare'
  },
  {
    name: 'Night Owl',
    description: 'Complete a quiz after midnight',
    icon: '🦉',
    category: 'special',
    requirement_type: 'special_night',
    requirement_value: 1,
    points: 50,
    rarity: 'uncommon'
  },
  {
    name: 'Early Bird',
    description: 'Complete a quiz before 6 AM',
    icon: '🌅',
    category: 'special',
    requirement_type: 'special_early',
    requirement_value: 1,
    points: 50,
    rarity: 'uncommon'
  },
  {
    name: 'Weekend Warrior',
    description: 'Complete 5 quizzes on weekends',
    icon: '🛡️',
    category: 'special',
    requirement_type: 'special_weekend',
    requirement_value: 5,
    points: 75,
    rarity: 'uncommon'
  },
  {
    name: 'Comeback Kid',
    description: 'Improve your score by 50% on a retaken quiz',
    icon: '📈',
    category: 'special',
    requirement_type: 'special_improvement',
    requirement_value: 50,
    points: 100,
    rarity: 'rare'
  },

  // 🎖️ MILESTONE BADGES
  {
    name: 'First Week',
    description: 'Welcome to Atomify! Complete your first week',
    icon: '🎉',
    category: 'milestones',
    requirement_type: 'days_active',
    requirement_value: 7,
    points: 25,
    rarity: 'common'
  },
  {
    name: 'High Achiever',
    description: 'Maintain an average score of 85% or higher',
    icon: '📊',
    category: 'milestones',
    requirement_type: 'average_score',
    requirement_value: 85,
    points: 200,
    rarity: 'rare'
  },
  {
    name: 'Chemistry Expert',
    description: 'Earn 1000 total points',
    icon: '🔬',
    category: 'milestones',
    requirement_type: 'total_points',
    requirement_value: 1000,
    points: 100,
    rarity: 'epic'
  }
];

// Initialize badges in database
async function initializeBadges() {
  return new Promise((resolve, reject) => {
    console.log('🏆 Starting badge system initialization...');
    
    // First, check if badges already exist
    db.get('SELECT COUNT(*) as count FROM badges', (err, row) => {
      if (err) {
        console.error('❌ Error checking existing badges:', err);
        reject(err);
        return;
      }
      
      if (row.count > 0) {
        console.log(`✅ Found ${row.count} existing badges. Skipping initialization.`);
        console.log('💡 To reinitialize badges, delete them from the database first.');
        resolve();
        return;
      }
      
      // Insert all badges
      const insertBadge = db.prepare(`
        INSERT INTO badges (name, description, icon, category, requirement_type, requirement_value, points, rarity)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      let completed = 0;
      const total = badges.length;
      
      badges.forEach((badge, index) => {
        insertBadge.run(
          badge.name,
          badge.description,
          badge.icon,
          badge.category,
          badge.requirement_type,
          badge.requirement_value,
          badge.points,
          badge.rarity,
          (err) => {
            if (err) {
              console.error(`❌ Error inserting badge "${badge.name}":`, err);
            } else {
              console.log(`✅ ${badge.icon} ${badge.name} (${badge.rarity})`);
            }
            
            completed++;
            if (completed === total) {
              insertBadge.finalize();
              console.log(`\n🎉 Successfully initialized ${total} badges!`);
              console.log('\n📊 Badge Summary:');
              
              // Group badges by category
              const categories = {};
              badges.forEach(badge => {
                if (!categories[badge.category]) {
                  categories[badge.category] = [];
                }
                categories[badge.category].push(badge);
              });
              
              Object.keys(categories).forEach(category => {
                console.log(`  ${category}: ${categories[category].length} badges`);
              });
              
              resolve();
            }
          }
        );
      });
    });
  });
}

// Initialize user stats for existing users
async function initializeUserStats() {
  return new Promise((resolve, reject) => {
    console.log('\n👤 Initializing user statistics...');
    
    // Get all users
    db.all('SELECT id, created_at FROM users', (err, users) => {
      if (err) {
        console.error('❌ Error fetching users:', err);
        reject(err);
        return;
      }
      
      if (users.length === 0) {
        console.log('✅ No users found. User stats will be created when users register.');
        resolve();
        return;
      }
      
      const insertStats = db.prepare(`
        INSERT OR IGNORE INTO user_stats (user_id, account_created, days_active)
        VALUES (?, ?, ?)
      `);
      
      let completed = 0;
      const total = users.length;
      
      users.forEach(user => {
        const accountCreated = user.created_at ? user.created_at.split(' ')[0] : new Date().toISOString().split('T')[0];
        const daysActive = Math.floor((new Date() - new Date(accountCreated)) / (1000 * 60 * 60 * 24));
        
        insertStats.run(user.id, accountCreated, Math.max(1, daysActive), (err) => {
          if (err) {
            console.error(`❌ Error initializing stats for user ${user.id}:`, err);
          } else {
            console.log(`✅ Initialized stats for user ${user.id}`);
          }
          
          completed++;
          if (completed === total) {
            insertStats.finalize();
            console.log(`\n🎉 Successfully initialized stats for ${total} users!`);
            resolve();
          }
        });
      });
    });
  });
}

// Main initialization function
async function main() {
  try {
    console.log('🚀 Starting Atomify Badge System Setup...\n');
    
    await initializeBadges();
    await initializeUserStats();
    
    console.log('\n✨ Badge system initialization complete!');
    console.log('📝 Next steps:');
    console.log('  1. Restart your server to load the new badge system');
    console.log('  2. Check the profile page to see your badges');
    console.log('  3. Complete activities to start earning badges!');
    
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err);
      } else {
        console.log('📪 Database connection closed.');
      }
    });
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { initializeBadges, initializeUserStats }; 