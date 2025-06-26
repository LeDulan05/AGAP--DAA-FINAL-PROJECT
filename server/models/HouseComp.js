module.exports = (sequelize, DataTypes) => {

    const HouseComp = sequelize.define("HouseComp",{

        HouseCompID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "HouseCompID" ,
        },

        FamilyID: {
            type: DataTypes.INTEGER,
            field: "FamilyID" ,
            references: {
                model: "FamilyTable",
                key: "FamilyID",
            }
        },

        NumChildren:{
            type: DataTypes.INTEGER,
        },

        NumSeniors:{
            type: DataTypes.INTEGER,
        },

        NumAdults:{
            type: DataTypes.INTEGER,
        },

        MedicalCondition:{
            type: DataTypes.BOOLEAN,
        },

        SpecialNeeds:{
            type: DataTypes.STRING,
        },

        HouseIncome:{
            type: DataTypes.INTEGER,
        },

        EmploymentStatus:{
            type: DataTypes.STRING,
        },  

        PreviousAid:{
            type: DataTypes.STRING,
        },

    },
    {
        timestamps:true,
        tableName: "HouseComp"
    },
    );

    HouseComp.associate = (models) => {
    HouseComp.belongsTo(models.FamilyTable, {
      foreignKey: "FamilyID",
      as: "family",
    })
  }

    return HouseComp; 
}