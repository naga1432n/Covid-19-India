const express = require('express')
const sqlite3 = require('sqlite3')
const path = require('path')

const app = express()
app.use(express.json())

const dbpath = path.join(__dirname, 'covid19India.db')
const db = new sqlite3.Database(dbpath)

// API 1: Get all states
app.get('/states/', (req, res) => {
  const query = `SELECT * FROM state`
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).send({error: 'Database error'})
    } else {
      const states = rows.map(row => ({
        stateId: row.state_id,
        stateName: row.state_name,
        population: row.population,
      }))
      res.send(states)
    }
  })
})

// API 2: Get a state by ID
app.get('/states/:stateId/', (req, res) => {
  const {stateId} = req.params
  const query = `SELECT * FROM state WHERE state_id = ?`
  db.get(query, [stateId], (err, row) => {
    if (err) {
      res.status(500).send({error: 'Database error'})
    } else if (row) {
      res.send({
        stateId: row.state_id,
        stateName: row.state_name,
        population: row.population,
      })
    } else {
      res.status(404).send({error: 'State not found'})
    }
  })
})

// API 3: Create a district
app.post('/districts/', (req, res) => {
  const {districtName, stateId, cases, cured, active, deaths} = req.body
  const query = `
       INSERT INTO district (district_name, state_id, cases, cured, active, deaths)
       VALUES (?, ?, ?, ?, ?, ?)
    `
  db.run(
    query,
    [districtName, stateId, cases, cured, active, deaths],
    function (err) {
      if (err) {
        res.status(500).send({error: 'Database error'})
      } else {
        res.send('District Successfully Added')
      }
    },
  )
})

// API 4: Get a district by ID
app.get('/districts/:districtId/', (req, res) => {
  const {districtId} = req.params
  const query = `SELECT * FROM district WHERE district_id = ?`
  db.get(query, [districtId], (err, row) => {
    if (err) {
      res.status(500).send({error: 'Database error'})
    } else if (row) {
      res.send({
        districtId: row.district_id,
        districtName: row.district_name,
        stateId: row.state_id,
        cases: row.cases,
        cured: row.cured,
        active: row.active,
        deaths: row.deaths,
      })
    } else {
      res.status(400).send({error: 'District not found'})
    }
  })
})

// API 5: Delete a district by ID
app.delete('/districts/:districtId/', (req, res) => {
  const {districtId} = req.params
  const query = `DELETE FROM district WHERE district_id = ?`
  db.run(query, [districtId], function (err) {
    if (err) {
      res.status(500).send({error: 'Database error'})
    } else {
      res.send('District Removed')
    }
  })
})

// API 6: Upadate a district by ID
app.put('/districts/:districtId/', (req, res) => {
  const {districtId} = req.params
  const {districtName, stateId, cases, cured, active, deaths} = req.body
  const query = `
       UPDATE district 
       SET district_name = ?, state_id = ?, cases = ?, cured =?, active = ?, deaths = ?
       WHERE district_id = ?
    `
  db.run(
    query,
    [districtName, stateId, cases, cured, active, deaths, districtId],
    function (err) {
      if (err) {
        res.status(500).send({error: 'Database error'})
      } else {
        res.send('District Details Updated')
      }
    },
  )
})

// API 7: Get statistics of a state by state ID
app.get('/states/:stateId/stats/', (req, res) => {
  const {stateId} = req.params
  const query = `
      SELECT
        SUM(cases) as totalCases,
        SUM(cured) as totalCured,
        SUM(active) as totalActive,
        SUM(deaths) as totalDeaths
      FROM district
      WHERE state_id = ?  
    `
  db.get(query, [stateId], (err, row) => {
    if (err) {
      res.status(500).send({error: 'Database error'})
    } else {
      res.send({
        totalCases: row.totalCases,
        totalCured: row.totalCured,
        totalActive: row.totalActive,
        totalDeaths: row.totalDeaths,
      })
    }
  })
})

// API 8: Get state name of a district by district ID
app.get('/districts/:districtId/details/', (req, res) => {
  const {districtId} = req.params
  const query = `
      SELECT state.state_name
      FROM district
      INNER JOIN state ON district.state_id = state.state_id
      WHERE district.district_id = ?    
`
  db.get(query, [districtId], (err, row) => {
    if (err) {
      res.status(500).send({error: 'Database error'})
    } else if (row) {
      res.send({stateName: row.state_name})
    } else {
      res.status(400).send({error: 'District not found'})
    }
  })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

module.exports = app
