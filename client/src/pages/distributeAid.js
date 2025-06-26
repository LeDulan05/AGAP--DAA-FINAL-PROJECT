import { useState, useEffect } from "react"
import "./distributeAid.css"

const DistributeAid = () => {
  const [families, setFamilies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalFunds, setTotalFunds] = useState("0")
  const [totalFoodPacks, setTotalFoodPacks] = useState("0")
  const [allocationResults, setAllocationResults] = useState([])
  const [knapsackResults, setKnapsackResults] = useState(null)
  const [isDistributing, setIsDistributing] = useState(false)

  const fetchFamiliesWithHouseComp = async () => {
    try {
      setLoading(true)
      setError(null)

      //Fetch all families
      const familiesResponse = await fetch("http://localhost:3001/FamilyTableRoute")
      if (!familiesResponse.ok) throw new Error("Failed to fetch families")
      const familiesData = await familiesResponse.json()

      //Fetch household composition for each family
      const familiesWithHouseComp = await Promise.all(
        familiesData.map(async (family) => {
          try {
            const houseCompResponse = await fetch(`http://localhost:3001/HouseCompRoute/${family.FamilyID}`)
            if (!houseCompResponse.ok) throw new Error(`Failed to fetch houseComp for family ${family.FamilyID}`)
            const houseCompData = await houseCompResponse.json()

            //Get most recent household composition 
            const latestHouseComp = houseCompData[houseCompData.length - 1] || {}

            return {
              id: `FAM${family.FamilyID.toString().padStart(3, "0")}`,
              name: family.Name || "Unknown Family",
              children: latestHouseComp.NumChildren || 0,
              elderly: latestHouseComp.NumSeniors || 0,
              adults: latestHouseComp.NumAdults || 0,
              medicalCondition: latestHouseComp.MedicalCondition || false,
              employmentStatus: latestHouseComp.EmploymentStatus?.toLowerCase() || "unemployed",
              monthlyIncome: latestHouseComp.HouseIncome || 0,
              aidStatus: latestHouseComp.PreviousAid === "Yes" ? "Previously Aided" : "New",
              timesAided: await getAidHistory(family.FamilyID),

              familyID: family.FamilyID,
              address: family.Address,
              contact: family.Contact,
              email: family.Email,
              specialNeeds: latestHouseComp.SpecialNeeds,
            }
          } catch (error) {
            console.error(`Error fetching house comp for family ${family.FamilyID}:`, error)
            //Return family with default values if house comp fetch fails
            return {
              id: `FAM${family.FamilyID.toString().padStart(3, "0")}`,
              name: family.Name || "Unknown Family",
              children: 0,
              elderly: 0,
              adults: 1,
              medicalCondition: false,
              employmentStatus: "unemployed",
              monthlyIncome: 0,
              aidStatus: "New",
              timesAided: 0,
              familyID: family.FamilyID,
              address: family.Address,
              contact: family.Contact,
              email: family.Email,
            }
          }
        }),
      )

      setFamilies(familiesWithHouseComp)
    } catch (error) {
      console.error("Error fetching families:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  //Get aid history count for a family
  const getAidHistory = async (familyID) => {
    try {
      const response = await fetch(`http://localhost:3001/AidDistributionRoute`)
      if (!response.ok) return 0

      const distributions = await response.json()
      let aidCount = 0

      distributions.forEach((distribution) => {
        if (distribution.distributionDetails) {
          distribution.distributionDetails.forEach((detail) => {
            if (detail.FamilyID === familyID) {
              aidCount++
            }
          })
        }
      })

      return aidCount
    } catch (error) {
      console.error(`Error fetching aid history for family ${familyID}:`, error)
      return 0
    }
  }

  //Record aid distribution in database
  const recordAidDistribution = async (distributionData) => {
    try {
      const response = await fetch("http://localhost:3001/AidDistributionRoute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(distributionData),
      })

      if (!response.ok) {
        throw new Error("Failed to record aid distribution")
      }

      const result = await response.json()
      console.log("Aid distribution recorded:", result)
      return result
    } catch (error) {
      console.error("Error recording aid distribution:", error)
      throw error
    }
  }

  useEffect(() => {
    fetchFamiliesWithHouseComp()
  }, [])

  //Priority score calculation
  const calculatePriorityScore = (family) => {
    let score = 0

    //Number of Children 
    if (family.children === 0) score += 0
    else if (family.children >= 1 && family.children <= 2) score += 1
    else if (family.children >= 3 && family.children <= 4) score += 2
    else if (family.children >= 5) score += 3

    //Number of Seniors 
    if (family.elderly === 0) score += 0
    else if (family.elderly >= 1 && family.elderly <= 2) score += 1
    else if (family.elderly >= 3) score += 2

    //Number of Adults 
    if (family.adults >= 3) score += 0
    else if (family.adults >= 1 && family.adults <= 2) score += 1
    else if (family.adults === 0) score += 2

    //Medical Condition
    if (family.medicalCondition) score += 2

    //Employment Status &  Monthly Income
    if (family.employmentStatus === "unemployed") {
      score += 2
    } else if (family.employmentStatus === "employed") {
      if (family.monthlyIncome <= 4999) score += 3
      else if (family.monthlyIncome >= 5000 && family.monthlyIncome <= 10000) score += 2
      else if (family.monthlyIncome >= 10001) score += 1
    }

    return score
  }

  //Add priority scores to families
  const familiesWithScores = families.map((family) => ({
    ...family,
    priorityScore: calculatePriorityScore(family),
  }))

  //Insertion sort by priority
  const insertionSortByPriority = (arr) => {
    const sortedArray = [...arr]
    for (let i = 1; i < sortedArray.length; i++) {
      const current = sortedArray[i]
      let j = i - 1

      while (j >= 0 && sortedArray[j].priorityScore < current.priorityScore) {
        sortedArray[j + 1] = sortedArray[j]
        j--
      }
      sortedArray[j + 1] = current
    }
    return sortedArray
  }

  //Knapsack exhaustive algorithm
  const knapsackExhaustive = (families, totalCash, totalPacks) => {
  const sortedFamilies = insertionSortByPriority([...families])
  const n = sortedFamilies.length
  const totalCombinations = 1 << n
  let bestSubset = []
  let bestScore = 0

  for (let subset = 1; subset < totalCombinations; subset++) {
    const currentSubset = []
    let currentScore = 0

    for (let i = 0; i < n; i++) {
      if (subset & (1 << i)) {
        currentSubset.push(sortedFamilies[i])
        currentScore += sortedFamilies[i].priorityScore
      }
    }

    const count = currentSubset.length
    const cashPerFamily = Math.floor(totalCash / count)
    const packsPerFamily = Math.floor(totalPacks / count)

    // Check if minimum requirements are met
    if (cashPerFamily >= 1000 && packsPerFamily >= 1) {
      // Calculate remainders
      const remainingCash = totalCash - (cashPerFamily * count)
      const remainingPacks = totalPacks - (packsPerFamily * count)

      // Create allocation with base amounts
      const allocation = currentSubset.map((fam) => ({
        ...fam,
        allocatedFunds: cashPerFamily,
        allocatedFood: packsPerFamily,
      }))

      // Distribute remaining cash to highest priority families
      // (Only if each family can get at least 500 more)
      if (remainingCash >= 1000) {
        const cashBonusPerFamily = Math.floor(remainingCash / count)
        if (cashBonusPerFamily >= 500) {
          const cashFamiliesCount = Math.floor(remainingCash / cashBonusPerFamily)
          for (let i = 0; i < Math.min(cashFamiliesCount, count); i++) {
            allocation[i].allocatedFunds += cashBonusPerFamily
          }
        }
      }

      // Distribute remaining food packs to highest priority families
      // Sort allocation by priority to ensure highest priority gets remainder
      allocation.sort((a, b) => b.priorityScore - a.priorityScore)
      
      for (let i = 0; i < remainingPacks && i < count; i++) {
        allocation[i].allocatedFood += 1
      }

      // Calculate total score with bonus for efficient resource usage
      const resourceUtilization = ((totalCash - (remainingCash % count)) + (totalPacks - (remainingPacks % count))) / (totalCash + totalPacks)
      const adjustedScore = currentScore + (resourceUtilization * 0.1) // Small bonus for better resource usage

      if (adjustedScore > bestScore) {
        bestScore = adjustedScore
        bestSubset = allocation
      }
    }
  }

  // Calculate final totals
  const totalCashUsed = bestSubset.reduce((sum, fam) => sum + fam.allocatedFunds, 0)
  const totalPacksUsed = bestSubset.reduce((sum, fam) => sum + fam.allocatedFood, 0)

  return {
    selectedFamilies: bestSubset,
    totalSelected: bestSubset.length,
    cashPerFamily: bestSubset.length > 0 ? Math.min(...bestSubset.map(f => f.allocatedFunds)) : 0, // Minimum allocation
    packsPerFamily: bestSubset.length > 0 ? Math.min(...bestSubset.map(f => f.allocatedFood)) : 0, // Minimum allocation
    totalCashUsed: totalCashUsed,
    totalPacksUsed: totalPacksUsed,
    totalScore: Math.floor(bestScore), // Remove the small bonus from display
    remainderDistributed: true,
    distributionDetails: bestSubset.map(fam => ({
      id: fam.id,
      name: fam.name,
      priorityScore: fam.priorityScore,
      allocatedFunds: fam.allocatedFunds,
      allocatedFood: fam.allocatedFood
    }))
  }
}


  //Handle funds input change
  const handleFundsChange = (e) => {
    const value = e.target.value
    if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setTotalFunds(value)
    }
  }

  //Handle food packs input change
  const handleFoodChange = (e) => {
    const value = e.target.value
    if (value === "" || /^[0-9]*$/.test(value)) {
      setTotalFoodPacks(value)
    }
  }

  //Calculate allocation
  useEffect(() => {
    if (familiesWithScores.length > 0) {
      const fundsValue = totalFunds === "" ? 0 : Number(totalFunds)
      const foodValue = totalFoodPacks === "" ? 0 : Number(totalFoodPacks)

      const knapsackResult = knapsackExhaustive(familiesWithScores, fundsValue, foodValue)
      setKnapsackResults(knapsackResult)
      setAllocationResults(knapsackResult.selectedFamilies)
    }
  }, [totalFunds, totalFoodPacks, families])

  const handleDistribute = async () => {
    if (allocationResults.length === 0) {
      alert("No families selected for aid distribution!")
      return
    }

    setIsDistributing(true)

    try {
      //Prepare distribution data
      const distributionData = {
        totalFund: knapsackResults.totalCashUsed,
        totalFoodPacks: knapsackResults.totalPacksUsed,
        fundPerFamily: knapsackResults.cashPerFamily,
        foodPacksPerFamily: knapsackResults.packsPerFamily,
        totalFamiliesAided: knapsackResults.totalSelected,
        totalPriorityScore: knapsackResults.totalScore,
        familiesAided: allocationResults,
      }

      //Record the distribution in database
      const result = await recordAidDistribution(distributionData)

      //Update local state to reflect new aid counts
      const familiesToAid = allocationResults.map((f) => f.id)
      setFamilies((prev) =>
        prev.map((family) =>
          familiesToAid.includes(family.id)
            ? {
                ...family,
                aidStatus: "Previously Aided",
                timesAided: family.timesAided + 1,
              }
            : family,
        ),
      )

      alert(`Aid distributed successfully! 
      Aid ID: ${result.aidId}
      Families Aided: ${result.familiesAided}
      Total Fund: ₱${knapsackResults.totalCashUsed}
      Total Food Packs: ${knapsackResults.totalPacksUsed}`)
    } catch (error) {
      console.error("Distribution failed:", error)
      alert("Failed to distribute aid. Please try again.")
    } finally {
      setIsDistributing(false)
    }
  }

  //Helper function for priority class
  const getPriorityClass = (score) => {
    if (score >= 8) return "high"
    if (score >= 6) return "medium"
    if (score >= 4) return "medium"
    return "low"
  }

  //Helper function for aid status class
  const getAidStatusClass = (status) => {
    if (status === "New") return "new"
    return "previously-aided"
  }

  return (
    <div className="distribute-aid-container">
      <h1 className="page-title">Distribute Aid</h1>

      <div className="input-section">
        <div className="input-row">
          <div className="input-group">
            <label className="input-label">Total Funds (₱)</label>
            <input
              type="text"
              className="form-input"
              value={totalFunds}
              onChange={handleFundsChange}
              placeholder="Enter amount"
              disabled={isDistributing}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Relief Pack</label>
            <input
              type="text"
              className="form-input"
              value={totalFoodPacks}
              onChange={handleFoodChange}
              placeholder="Enter quantity"
              disabled={isDistributing}
            />
          </div>
        </div>
      </div>

      <div className="summary-section">
        <h3 className="summary-title">Distribution Summary</h3>
        {knapsackResults && (
          <div className="summary-stats">
            <p>
              <strong>Selected Families:</strong> {knapsackResults.totalSelected}
            </p>
            <p>
              <strong>Funds per Family:</strong> ₱{knapsackResults.cashPerFamily}
            </p>
            <p>
              <strong>Relief per Family:</strong> {knapsackResults.packsPerFamily} packs
            </p>
            <p>
              <strong>Total Priority Score:</strong> {knapsackResults.totalScore}
            </p>
            <p>
              <strong>Cash Used:</strong> ₱{knapsackResults.totalCashUsed}
            </p>
            <p>
              <strong>Packs Used:</strong> {knapsackResults.totalPacksUsed}
            </p>
            <p>
              <strong>Total Packs Used:</strong> {knapsackResults.totalPacksUsed}
              <span className="efficiency-indicator">
              ({((knapsackResults.totalPacksUsed / Number(totalFoodPacks)) * 100).toFixed(1)}% utilized)
              </span>
            </p>
              {knapsackResults.remainderDistributed && (
            <p className="remainder-note">
              <strong>Note:</strong> Remaining relief packs distributed to highest priority families
            </p>
            )}  
          </div>
        )}
      </div>

      {familiesWithScores.length > 0 ? (
        <>
          <div className="results-section">
            <h3 className="results-title">
              Allocation Results <span className="sorted-badge">(Sorted by Priority)</span>
            </h3>
            <table className="allocation-table">
              <thead>
                <tr>
                  <th>Family ID</th>
                  <th>Name</th>
                  <th>Priority</th>
                  <th>Children</th>
                  <th>Elderly</th>
                  <th>Funds</th>
                  <th>Relief Pack</th>
                  <th>Extra Pack</th>
                </tr>
              </thead>
              <tbody>
                {allocationResults.map((family) => {
                const minFunds = knapsackResults?.cashPerFamily || 0;
                const minFood = knapsackResults?.packsPerFamily || 0;
                const extraFood = family.allocatedFood - minFood;
        
                return (
                  <tr key={family.id}>
                    <td>{family.id}</td>
                    <td>{family.name}</td>
                      <td className={`priority-score priority-${getPriorityClass(family.priorityScore)}`}>
                      {family.priorityScore}
                    </td>
                    <td>{family.children}</td>
                    <td>{family.elderly}</td>
                    <td>₱{family.allocatedFunds.toFixed(2)}</td>
                    <td>{family.allocatedFood} packs</td>
                    <td className={extraFood > 0 ? 'extra-food' : ''}>
                      {extraFood > 0 ? `+${extraFood}` : '-'}
                    </td>
                  </tr>
                )
              })}
              </tbody>
            </table>
          </div>

          <button
            className="distribute-btn"
            onClick={handleDistribute}
            disabled={isDistributing || allocationResults.length === 0}
          >
            {isDistributing ? "Distributing..." : "Confirm Distribution"}
          </button>
        </>
      ) : (
        <div className="no-families-message">
          <p>No families currently registered in the system.</p>
          <p>Please register families first before distributing aid.</p>
        </div>
      )}
    </div>
  )
}

export default DistributeAid
