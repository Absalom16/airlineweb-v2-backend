const express = require("express");
const WebSocket = require("ws");
const { MongoClient, ServerApiVersion } = require("mongodb");
const dotenv = require("dotenv");

const app = express();
dotenv.config();
const PORT = process.env.PORT;

//variables to use while assigning ids
const min = 100000;
const max = 999999;

app.use(express.json(), function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

const wss = new WebSocket.Server({ noServer: true });

// MongoDB connection
const uri = process.env.URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const db = client.db(process.env.DB);

client
  .connect()
  .then(() => {
    console.log("Connected to MongoDB");

    // WebSocket server logic
    wss.on("connection", (ws) => {
      ws.on("message", (message) => {
        console.log(`Received message: ${message}`);
      });

      ws.send("connected");
    });

    // Create HTTP server with Express
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    // Upgrade HTTP server to WebSocket server
    server.on("upgrade", (request, socket, head) => {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    });

    // Watch for changes in MongoDB collection and send updates to clients
    const changeStream = db.watch({ fullDocument: "updateLookup" });

    changeStream.on("change", (change) => {
      // console.log("Change occurred:", change);
      const payload = {
        operation: change.operationType,
        collection: change.ns.coll,
      };
      const message = JSON.stringify({ type: "db_change", data: payload });
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

// RESTful API endpoints

// Get all users
app.get("/users", async (req, res) => {
  try {
    const users = await db.collection("users").find().toArray();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Add a new user
app.post("/users", async (req, res) => {
  try {
    const newUser = req.body;
    const result = await db.collection("users").insertOne(newUser);
    res.json(result);
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Get all cities
app.get("/cities", async (req, res) => {
  try {
    const cities = await db.collection("cities").find().toArray();
    res.send(cities);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

// Add a new city
app.post("/cities", async (req, res) => {
  try {
    const newCity = req.body;
    const id = Math.floor(Math.random() * (max - min + 1)) + 1;
    newCity.id = id;
    const result = await db.collection("cities").insertOne(newCity);
    res.json(result);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

// Get all aircrafts
app.get("/aircrafts", async (req, res) => {
  try {
    const aircrafts = await db.collection("aircrafts").find().toArray();
    res.json(aircrafts);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

// update aircrafts seats
app.get("/aircrafts/:id/:updateData", async (req, res) => {
  try {
    const collection = db.collection("aircrafts");
    const itemId = req.params.id;
    const updateData = JSON.parse(req.params.updateData);
    const filter = { id: Number(itemId) };
    let updateDocument;

    if (updateData.firstClassSeats) {
      updateDocument = {
        $set: {
          firstClassSeats: updateData.firstClassSeats,
        },
      };
    } else if (updateData.businessClassSeats) {
      updateDocument = {
        $set: {
          businessClassSeats: updateData.businessClassSeats,
        },
      };
    } else if (updateData.economyClassSeats) {
      updateDocument = {
        $set: {
          economyClassSeats: updateData.economyClassSeats,
        },
      };
    }

    const updatedResult = await collection.updateOne(filter, updateDocument);

    res.json(updatedResult);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

// Add a new aircraft
app.post("/aircrafts", async (req, res) => {
  try {
    const id = Math.floor(Math.random() * (max - min + 1)) + 1;
    const newAircraft = req.body;
    newAircraft.id = id;
    const result = await db.collection("aircrafts").insertOne(newAircraft);
    res.json(result);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

// Get all flights
app.get("/flights", async (req, res) => {
  try {
    const flights = await db.collection("flights").find().toArray();
    res.send(flights);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

// Add a new flight
app.post("/flights", async (req, res) => {
  try {
    const id = Math.floor(Math.random() * (max - min + 1)) + 1;
    const newFlight = req.body;
    newFlight.id = id;
    const result = await db.collection("flights").insertOne(newFlight);
    res.json(result);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});

// Get booked Flights
app.get("/bookedFlights", async (req, res) => {
  try {
    const bookedFlights = await db.collection("bookedFlights").find().toArray();
    res.send(bookedFlights);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

//book a flight
app.post("/bookedFlights", async (req, res) => {
  try {
    const id = Math.floor(Math.random() * (max - min + 1)) + 1;
    const newBooking = req.body;
    newBooking.id = id;
    const result = await db.collection("bookedFlights").insertOne(newBooking);
    res.json(result);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

//admin update flight
app.get("/flights/:id/:newData", async (req, res) => {
  try {
    const collection = db.collection("flights");
    const collection2 = db.collection("bookedFlights");
    const collection3 = db.collection("aircrafts");
    const itemId = req.params.id;
    const updateData = JSON.parse(req.params.newData);
    const filter = { id: Number(itemId) };
    const updateDocument = {
      $set: {
        status: updateData.status,
      },
    };

    const aircraftUpdateOperation = {
      $set: {
        "firstClassSeats.$[].occupied": false,
        "businessClassSeats.$[].occupied": false,
        "economyClassSeats.$[].occupied": false,
      },
    };

    //update flights with given id
    const updatedResult = await collection.updateOne(filter, updateDocument);

    // Update the booked flights with the same flight number
    const bookedFlightsResult = await collection2.updateMany(
      { flightNumber: Number(itemId) },
      updateDocument
    );

    //render all the aircraft seats as vacant
    const aircraftResult = await collection3.updateOne(
      { name: updateData.aircraft },
      aircraftUpdateOperation
    );

    res.json(updatedResult, bookedFlightsResult, aircraftResult);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

//client update flight
app.get("/bookedFlights/:id/:newData", async (req, res) => {
  try {
    const collection = db.collection("bookedFlights");
    const itemId = req.params.id;
    const updateData = JSON.parse(req.params.newData);
    const filter = { id: Number(itemId) };
    let updateDocument;

    if (updateData.type == "cancelFlight") {
      updateDocument = {
        $set: {
          status: updateData.status,
        },
      };
    } else if (updateData.type == "addPassenger") {
      updateDocument = {
        $set: {
          passengers: updateData.passengers,
          seats: updateData.seats,
          passengerQuantity: updateData.passengerQuantity,
          cost: updateData.cost,
        },
      };
    } else if (updateData.type == "changePassenger") {
      updateDocument = {
        $set: {
          passengers: updateData.passengers,
        },
      };
    } else if (updateData.type == "changeClass") {
      updateDocument = {
        $set: {
          selectedClass: updateData.selectedClass,
          seats: updateData.seats,
          cost: updateData.cost,
        },
      };
    } else if (updateData.type == "changeSeats") {
      updateDocument = {
        $set: {
          seats: updateData.seats,
        },
      };
    } else if (updateData.type == "deletePassenger") {
      updateDocument = {
        $set: {
          passengers: updateData.passengers,
          seats: updateData.seats,
          cost: updateData.cost,
        },
      };
    }

    const updatedResult = await collection.updateOne(filter, updateDocument);

    res.json(updatedResult);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});
