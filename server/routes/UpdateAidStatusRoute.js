const express = require("express")
const router = express.Router()
const { HouseComp } = require("../models/")

//Update aid status for multiple families
router.put("/updateAidStatus", async (req, res) => {
  try {
    const { familyIDs, aidStatus } = req.body

    if (!familyIDs || !Array.isArray(familyIDs)) {
      return res.status(400).json({ error: "familyIDs must be an array" })
    }

    //Update PreviousAid status for all specified families
    const updateResult = await HouseComp.update(
      { PreviousAid: aidStatus },
      {
        where: {
          FamilyID: familyIDs,
        },
      },
    )

    res.json({
      message: `Updated aid status for ${updateResult[0]} families`,
      updatedCount: updateResult[0],
    })
  } catch (error) {
    console.error("Error updating aid status:", error)
    res.status(500).json({ error: "Failed to update aid status" })
  }
})

//Get families by aid status
router.get("/byAidStatus/:status", async (req, res) => {
  try {
    const { status } = req.params

    const families = await HouseComp.findAll({
      where: { PreviousAid: status },
      include: [
        {
          model: require("../models").FamilyTable,
          as: "family",
        },
      ],
    })

    res.json(families)
  } catch (error) {
    console.error("Error fetching families by aid status:", error)
    res.status(500).json({ error: "Failed to fetch families" })
  }
})

module.exports = router