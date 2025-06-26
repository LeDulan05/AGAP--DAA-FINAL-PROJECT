import { useState, useEffect } from "react"
import "./dashboard.css"

const DashboardOverview = () => {
  const [families, setFamilies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dashboardStats, setDashboardStats] = useState({
    totalFamilies: 0,
    totalAidDistributed: 0,
    averagePriorityScore: 0,
    totalFamiliesAided: 0,
  })

  //Search and filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [medicalFilter, setMedicalFilter] = useState("all")
  const [aidStatusFilter, setAidStatusFilter] = useState("all")

  //Fetch families with household composition
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
            if (!houseCompResponse.ok)
              throw new Error(`Failed to fetch household composition for family ${family.FamilyID}`)
            const houseCompData = await houseCompResponse.json()

            //Get the most recent household composition
            const latestHouseComp = houseCompData[houseCompData.length - 1] || {}

            //Calculate priority score
            const priorityScore = calculatePriorityScore({
              children: latestHouseComp.NumChildren || 0,
              elderly: latestHouseComp.NumSeniors || 0,
              adults: latestHouseComp.NumAdults || 0,
              medicalCondition: latestHouseComp.MedicalCondition || false,
              employmentStatus: latestHouseComp.EmploymentStatus?.toLowerCase() || "unemployed",
              monthlyIncome: latestHouseComp.HouseIncome || 0,
            })

            return {
              id: `FAM${family.FamilyID.toString().padStart(3, "0")}`,
              name: family.Name || "Unknown Family",
              children: latestHouseComp.NumChildren || 0,
              elderly: latestHouseComp.NumSeniors || 0,
              adults: latestHouseComp.NumAdults || 0,
              medicalCondition: latestHouseComp.MedicalCondition || false,
              employmentStatus: latestHouseComp.EmploymentStatus || "unemployed",
              monthlyIncome: latestHouseComp.HouseIncome || 0,
              aidStatus: latestHouseComp.PreviousAid === "Yes" ? "Aided" : "Unaided",
              priorityScore: priorityScore,
              
              familyID: family.FamilyID,
              address: family.Address,
              contact: family.Contact,
              email: family.Email,
              specialNeeds: latestHouseComp.SpecialNeeds,
            }
          } catch (error) {
            console.error(`Error fetching household composition for family ${family.FamilyID}:`, error)
            //Return family with default values if household composition fetch fails
            return {
              id: `FAM${family.FamilyID.toString().padStart(3, "0")}`,
              name: family.Name || "Unknown Family",
              children: 0,
              elderly: 0,
              adults: 1,
              medicalCondition: false,
              employmentStatus: "unemployed",
              monthlyIncome: 0,
              aidStatus: "Unaided",
              priorityScore: 0,
              familyID: family.FamilyID,
              address: family.Address,
              contact: family.Contact,
              email: family.Email,
            }
          }
        }),
      )

      setFamilies(familiesWithHouseComp)

      //Dashboard statistics
      calculateDashboardStats(familiesWithHouseComp)
    } catch (error) {
      console.error("Error fetching families:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  //Aid distribution statistics
  const fetchAidStats = async () => {
    try {
      const response = await fetch("http://localhost:3001/AidDistributionRoute/stats/summary")
      if (!response.ok) throw new Error("Failed to fetch aid statistics")
      const stats = await response.json()

      setDashboardStats((prev) => ({
        ...prev,
        totalAidDistributed: stats.totalFundsDistributed || 0,
        totalFamiliesAided: stats.totalFamiliesAided || 0,
      }))
    } catch (error) {
      console.error("Error fetching aid statistics:", error)
    }
  }

  //Priority score
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

    // Employment Status & Monthly Income
    if (family.employmentStatus === "unemployed") {
      score += 2
    } else if (family.employmentStatus === "employed") {
      if (family.monthlyIncome <= 4999) score += 3
      else if (family.monthlyIncome >= 5000 && family.monthlyIncome <= 10000) score += 2
      else if (family.monthlyIncome >= 10001) score += 1
    }

    return score
  }

  //Calculate dashboard statistics
  const calculateDashboardStats = (familiesData) => {
    const totalFamilies = familiesData.length
    const averagePriorityScore =
      familiesData.length > 0
        ? familiesData.reduce((sum, family) => sum + family.priorityScore, 0) / familiesData.length
        : 0

    setDashboardStats((prev) => ({
      ...prev,
      totalFamilies,
      averagePriorityScore,
    }))
  }

  //Linear search implementation
  const linearSearch = (array, searchTerm) => {
    const results = []
    const lowerSearchTerm = searchTerm.toLowerCase()

    for (let i = 0; i < array.length; i++) {
      const family = array[i]
      if (family.name.toLowerCase().includes(lowerSearchTerm) || family.id.toLowerCase().includes(lowerSearchTerm)) {
        results.push(family)
      }
    }
    return results
  }

  //Filter families based on search and filters
  const filteredFamilies = () => {
    let result = searchTerm ? linearSearch(families, searchTerm) : [...families]

    //Medical condition filter
    if (medicalFilter !== "all") {
      result = result.filter((family) => (medicalFilter === "yes" ? family.medicalCondition : !family.medicalCondition))
    }

    //Aid status filter
    if (aidStatusFilter !== "all") {
      result = result.filter((family) => family.aidStatus.toLowerCase() === aidStatusFilter.toLowerCase())
    }

    //Sort by priority score (high to low)
    return result.sort((a, b) => b.priorityScore - a.priorityScore)
  }

  //Helper function to determine priority class
  const getPriorityClass = (score) => {
    if (score >= 7) return "high"
    if (score >= 4) return "medium"
    return "low"
  }

  //Fetch data on component mount
  useEffect(() => {
    fetchFamiliesWithHouseComp()
    fetchAidStats()
  }, [])

  //Loading
  if (loading) {
    return (
      <div className="dashboard-container">
        <h1>Dashboard Overview</h1>
        <div className="loading-message">
          <p>Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  //Error
  if (error) {
    return (
      <div className="dashboard-container">
        <h1>Dashboard Overview</h1>
        <div className="error-message">
          <p>Error loading data: {error}</p>
          <button onClick={fetchFamiliesWithHouseComp} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    )
  }

  //Get aided families for priority distribution
  const aidedFamilies = families.filter((family) => family.aidStatus === "Aided")

  return (
    <div className="dashboard-container">
      <h1>Dashboard Overview</h1>

      <div className="dashboard-metrics">
        <div className="metric-card">
          <h2>Total Families Registered</h2>
          <p className="metric-value">{dashboardStats.totalFamilies}</p>
          <p className="metric-subtext">Currently in system</p>
        </div>

        <div className="metric-card">
          <h2>Total Aid Distributed</h2>
          <p className="metric-value">₱{dashboardStats.totalAidDistributed.toLocaleString()}</p>
          <p className="metric-subtext">All time distributions</p>
        </div>

        <div className="metric-card">
          <h2>Average Priority Score</h2>
          <p className="metric-value">{dashboardStats.averagePriorityScore.toFixed(1)}</p>
          <p className="metric-subtext">Higher score indicates greater need</p>
        </div>
      </div>

      <div className="priority-distribution">
        <h2>Family Priority Distribution (Aided Families)</h2>
        <p>Sorted list of aided families by priority score</p>
        {aidedFamilies.length > 0 ? (
          <div className="priority-list">
            {aidedFamilies
              .sort((a, b) => b.priorityScore - a.priorityScore)
              .map((family) => (
                <div key={family.id} className="priority-item">
                  <span className="family-name">{family.name}</span>
                  <span className={`priority-score ${getPriorityClass(family.priorityScore)}`}>
                    {family.priorityScore}
                  </span>
                </div>
              ))}
          </div>
        ) : (
          <p className="no-data-message">No families have received aid yet.</p>
        )}
      </div>

      <div className="families-overview">
        <h2>Registered Families Overview</h2>
        <p>Detailed list of all registered families, their assessed needs, and aid status.</p>

        <div className="filters">
          <input
            type="text"
            placeholder="Search by family name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select value={medicalFilter} onChange={(e) => setMedicalFilter(e.target.value)}>
            <option value="all">All Medical Conditions</option>
            <option value="yes">With Conditions</option>
            <option value="no">Without Conditions</option>
          </select>
          <select value={aidStatusFilter} onChange={(e) => setAidStatusFilter(e.target.value)}>
            <option value="all">All Aid Statuses</option>
            <option value="unaided">Unaided</option>
            <option value="aided">Aided</option>
          </select>
        </div>

        <table className="families-table">
          <thead>
            <tr>
              <th>Family ID</th>
              <th>Name</th>
              <th>Priority Score</th>
              <th>Children</th>
              <th>Elderly</th>
              <th>Medical Condition</th>
              <th>Income (Est.)</th>
              <th>Aid Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredFamilies().map((family) => (
              <tr key={family.id}>
                <td>
                  <strong>{family.id}</strong>
                </td>
                <td>
                  <strong>{family.name}</strong>
                </td>
                <td>
                  <span className={`priority-score ${getPriorityClass(family.priorityScore)}`}>
                    {family.priorityScore}
                  </span>
                </td>
                <td>{family.children}</td>
                <td>{family.elderly}</td>
                <td>{family.medicalCondition ? "Yes" : "No"}</td>
                <td>₱{family.monthlyIncome.toLocaleString()}/month</td>
                <td>
                  <span className={`aid-status ${family.aidStatus.toLowerCase()}`}>{family.aidStatus}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredFamilies().length === 0 && (
          <div className="no-results-message">
            <p>No families match your current filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardOverview