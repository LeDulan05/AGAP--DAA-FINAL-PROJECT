const express = require("express")
const router = express.Router()
const { AidDistributed, AidDistributionDetails, FamilyTable, HouseComp } = require("../models/")

//Create new aid distribution record
router.post("/", async (req, res) => {
  const transaction = await require("../models/").sequelize.transaction()

  try {
    const {
      totalFund,
      totalFoodPacks,
      fundPerFamily,
      foodPacksPerFamily,
      totalFamiliesAided,
      totalPriorityScore,
      familiesAided,
    } = req.body

    //Create main aid distribution record
    const aidDistribution = await AidDistributed.create(
      {
        TotalFund: totalFund,
        TotalFoodPacks: totalFoodPacks,
        FundPerFamily: fundPerFamily,
        FoodPacksPerFamily: foodPacksPerFamily,
        TotalFamiliesAided: totalFamiliesAided,
        TotalPriorityScore: totalPriorityScore,
        Status: "Completed",
      },
      { transaction },
    )

    //Create detail records for each family
    const detailPromises = familiesAided.map((family) => {
      //Extract FamilyID from the family ID format
      const familyIdNumber = Number.parseInt(family.id.replace("FAM", ""))

      return AidDistributionDetails.create(
        {
          AidID: aidDistribution.AidID,
          FamilyID: familyIdNumber,
          FamilyName: family.name,
          PriorityScore: family.priorityScore,
          FundReceived: family.allocatedFunds,
          FoodPacksReceived: family.allocatedFood,
        },
        { transaction },
      )
    })

    await Promise.all(detailPromises)

    //Update aid status for families
    const familyIds = familiesAided.map((family) => Number.parseInt(family.id.replace("FAM", "")))
    await HouseComp.update(
      { PreviousAid: "Yes" },
      {
        where: { FamilyID: familyIds },
        transaction,
      },
    )

    await transaction.commit()

    res.json({
      success: true,
      message: `Aid distribution recorded successfully`,
      aidId: aidDistribution.AidID,
      familiesAided: totalFamiliesAided,
    })
  } catch (error) {
    await transaction.rollback()
    console.error("Error creating aid distribution record:", error)
    res.status(500).json({
      success: false,
      error: "Failed to record aid distribution",
      details: error.message,
    })
  }
})

//Get all aid distributions
router.get("/", async (req, res) => {
  try {
    const aidDistributions = await AidDistributed.findAll({
      include: [
        {
          model: AidDistributionDetails,
          as: "distributionDetails",
          include: [
            {
              model: FamilyTable,
              as: "family",
            },
          ],
        },
      ],
      order: [["DistributionDate", "DESC"]],
    })

    res.json(aidDistributions)
  } catch (error) {
    console.error("Error fetching aid distributions:", error)
    res.status(500).json({ error: "Failed to fetch aid distributions" })
  }
})

//Get specific aid distribution by ID
router.get("/:aidId", async (req, res) => {
  try {
    const { aidId } = req.params

    const aidDistribution = await AidDistributed.findByPk(aidId, {
      include: [
        {
          model: AidDistributionDetails,
          as: "distributionDetails",
          include: [
            {
              model: FamilyTable,
              as: "family",
            },
          ],
        },
      ],
    })

    if (!aidDistribution) {
      return res.status(404).json({ error: "Aid distribution not found" })
    }

    res.json(aidDistribution)
  } catch (error) {
    console.error("Error fetching aid distribution:", error)
    res.status(500).json({ error: "Failed to fetch aid distribution" })
  }
})

//Get aid distribution statistics
router.get("/stats/summary", async (req, res) => {
  try {
    const totalDistributions = await AidDistributed.count()
    const totalFundsDistributed = await AidDistributed.sum("TotalFund")
    const totalFoodPacksDistributed = await AidDistributed.sum("TotalFoodPacks")
    const totalFamiliesAided = await AidDistributionDetails.count()

    res.json({
      totalDistributions,
      totalFundsDistributed: totalFundsDistributed || 0,
      totalFoodPacksDistributed: totalFoodPacksDistributed || 0,
      totalFamiliesAided,
    })
  } catch (error) {
    console.error("Error fetching aid distribution stats:", error)
    res.status(500).json({ error: "Failed to fetch statistics" })
  }
})

module.exports = router
