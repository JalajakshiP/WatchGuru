const Sequelize = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = require('./User')(sequelize, Sequelize.DataTypes);
db.Content = require('./Content')(sequelize, Sequelize.DataTypes);
db.Friend = require('./Friend')(sequelize, Sequelize.DataTypes);
db.Rating = require('./Rating')(sequelize, Sequelize.DataTypes);

// Run associations
Object.keys(db).forEach(model => {
  if (db[model].associate) {
    db[model].associate(db);
  }
});

module.exports = db;
