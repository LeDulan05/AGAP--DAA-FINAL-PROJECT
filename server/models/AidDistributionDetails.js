module.exports = (sequelize, DataTypes) => {
  const AidDistributionDetails = sequelize.define(
    "AidDistributionDetails",
    {
      DetailID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: "DetailID",
      },

      AidID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "AidID",
        references: {
          model: "AidDistributed",
          key: "AidID",
        },
      },

      FamilyID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "FamilyID",
        references: {
          model: "FamilyTable",
          key: "FamilyID",
        },
      },

      FamilyName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "FamilyName",
      },

      PriorityScore: {
        type: DataTypes.INTEGER,
        field: "PriorityScore",
      },

      FundReceived: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: "FundReceived",
      },

      FoodPacksReceived: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "FoodPacksReceived",
      },
    },
    {
      timestamps: true,
      tableName: "AidDistributionDetails",
    },
  )

  AidDistributionDetails.associate = (models) => {
    AidDistributionDetails.belongsTo(models.AidDistributed, {
      foreignKey: "AidID",
      as: "aidDistribution",
    })

    AidDistributionDetails.belongsTo(models.FamilyTable, {
      foreignKey: "FamilyID",
      as: "family",
    })
  }

  return AidDistributionDetails
}
