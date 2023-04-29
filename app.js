const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "covid19India.db");
const app = express();
app.use(express.json());
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => 
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();


const convertStateDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictDbObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

// const reportSnakeToCamel = (newObject) => {
//   return {
//     totalCases: newObject.cases,
//     totalCured: newObject.cured,
//     totalActive: newObject.active,
//     totalDeaths: newObject.deaths,
//   };
// };


//Returns list of all states in the state table

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT *
    FROM state;
    `;
  const statesArray = await db.all(getStatesQuery);
  response.send(statesArray.map((eachState) => 
     convertStateDbObjectToResponseObject(eachState)
  );
//   response.send(statesResult);
});

//Return a state based on the state ID

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT *
    FROM state
    WHERE 
        state_id = ${stateId};
    `;
  const newState = await db.get(getStateQuery);
//   const stateResult = convertStateDbObjectToResponseObject(newState);
  response.send(convertStateDbObjectToResponseObject(newState));
});

//Return a district based on the district Id

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrict = `
        SELECT *
        FROM district
        WHERE district_id = ${districtId};
    `;
  const newDistrict = await db.get(getDistrict);
//   const districtResult = convertDistrictDbObjectToResponseObject(newDistrict);
  response.send(convertDistrictDbObjectToResponseObject(newDistrict));
});



//create a district in the district table

app.post("/districts/", async (request, response) => {
//   const createDistrict = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = request.body;
  const newDistrict = `
    INSERT INTO
        district(district_name,state_id,cases,cured,active,deaths)
    VALUES
        ('${districtName}',
         ${stateId},
         ${cases},
         ${cured},
         ${active},
         ${deaths});
    `;
//   const addDistrict = 
await db.run(newDistrict);
//   const districtId = addDistrict.lastId;
  response.send("District Successfully Added");
});


//Deletes a district from district table based on district id

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrict = `
    DELETE 
    FROM district
    WHERE district_id = ${districtId}
    `;
  await db.run(deleteDistrict);
  response.send("District Removed");
});

//Updates the details of a specific district based on the district Id

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrict = `
    UPDATE district
    SET 
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
    WHERE district_id = ${districtId};
    `;
  await db.run(updateDistrict);
  response.send("District Details Updated");
});

//Returns a State Report

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateReport = `
    SELECT SUM(cases),
        SUM(cured) ,
        SUM(active),
        SUM(deaths)
    FROM district
    WHERE state_id = ${stateId};
    `;
  const stateReport = await db.get(getStateReport);
//   const resultReport = reportSnakeToCamel(stateReport);
//   response.send(resultReport);
    response.send({
        totalCases: stats["SUM(cases)"],
        totalCured: stats["SUM(cured)"],
        totalActive: stats["SUM(active)"],
        totalDeath: stats["SUM(deaths)"],
    });
});

//Return a stateName based on district Id

app.get("/districts/:districtId/details/", async (request.response) => {
  const { districtId } = request.params;
  const stateDetails = `
    SELECT state_name
    FROM district NATURAL JOIN state
    WHERE district.district_id = ${districtId};
    `;
  const stateName = await db.get(stateDetails);
  response.send({ stateName: stateName.state_name });
});

module.exports = app;
