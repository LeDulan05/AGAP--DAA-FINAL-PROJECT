module.exports = (sequelize, DataTypes) => {

    const FamilyTable = sequelize.define("FamilyTable",{

        FamilyID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "FamilyID" ,
        },

        Name: {
            type: DataTypes.STRING,
        },

        Address: {
            type: DataTypes.STRING,
        },

        Contact: {
            type: DataTypes.STRING,
        },

        Email:{
            type: DataTypes.STRING,
        },



    },
    {
        timestamps:false,
        tableName: "FamilyTable"
    },
    );

    FamilyTable.associate = (models)=>{
        FamilyTable.hasMany(models.HouseComp, {
            foreignKey: "FamilyID",
            as: "houseComponents",
            onDelete: "cascade",

        })
    };

    return FamilyTable; 
}