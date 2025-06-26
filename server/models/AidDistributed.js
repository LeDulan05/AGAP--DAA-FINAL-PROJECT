module.exports = (sequelize, DataTypes) => {
  const AidDistributed = sequelize.define(
    "AidDistributed",
    {
      AidID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: "AidID",
      },

      TotalFund: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: "TotalFund",
      },

      TotalFoodPacks: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "TotalFoodPacks",
      },

      FundPerFamily: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: "FundPerFamily",
      },

      FoodPacksPerFamily: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "FoodPacksPerFamily",
      },

      TotalFamiliesAided: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "TotalFamiliesAided",
      },

      DistributionDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: "DistributionDate",
      },

      TotalPriorityScore: {
        type: DataTypes.INTEGER,
        field: "TotalPriorityScore",
      },

      Status: {
        type: DataTypes.STRING,
        defaultValue: "Completed",
        field: "Status",
      },
    },
    {
      timestamps: true,
      tableName: "AidDistributed",
    },
  )

  AidDistributed.associate = (models) => {
    AidDistributed.hasMany(models.AidDistributionDetails, {
      foreignKey: "AidID",
      as: "distributionDetails",
      onDelete: "cascade",
    })
  }

  return AidDistributed
}