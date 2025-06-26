const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(
  'postgres',
  'postgres.zwrbxuvhhfbtswsebcwy',
  'MNCkRR67TDqj2RRR',
  {
    host: 'aws-0-ap-southeast-1.pooler.supabase.com',
    dialect: 'postgres',
    port: 5432,
  }
);

const db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.FamilyTable = require('./FamilyTable')(sequelize,Sequelize.DataTypes);
db.HouseComp = require('./HouseComp')(sequelize,Sequelize.DataTypes);
db.AidDistributed = require("./AidDistributed")(sequelize, Sequelize.DataTypes)
db.AidDistributionDetails = require("./AidDistributionDetails")(sequelize, Sequelize.DataTypes)


Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db)
  }
})

async function initialize() {
  try {
    //Connection test
    await sequelize.authenticate();
    console.log('✓ Database connection established');

    //Sync models
    await sequelize.sync({ alter: false });
    console.log('✓ Models synchronized');

  } catch (error) {
    console.error('! Initialization failed:', error);
    process.exit(1); // Exit if error
  }
}

initialize();

module.exports = db;
