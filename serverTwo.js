const express = require("express");
const WebSocket = require("ws");
const fs = require("fs").promises;
const chokidar = require("chokidar");
// const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = 3000;
const DB_FILE = "db.json";

app.use(express.json(), function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

const wss = new WebSocket.Server({ noServer: true });

// Read data from db.json
async function readData() {
  try {
    const data = await fs.readFile(DB_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      // If the file doesn't exist, return an empty array
      return [];
    }
    throw error;
  }
}

// Write data to db.json
async function writeData(data) {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
}

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

// Watch for changes to db.json and send updates to connected clients
const watcher = chokidar.watch(DB_FILE);
watcher.on("change", async (path) => {
  console.log(`File ${path} has been changed`);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send("db_change");
    }
  });
});

// RESTful API endpoints

// Get all users
app.get("/users", async (req, res) => {
  try {
    const data = await readData();
    res.send(data.users);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

// Add a new user
app.post("/users", async (req, res) => {
  try {
    const data = await readData();
    const newItem = req.body;
    newItem.id = data.users.length + 1;
    data.users.push(newItem);
    await writeData(data);
    res.json(newItem);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

// Get all cities
app.get("/cities", async (req, res) => {
  try {
    const data = await readData();
    res.send(data.cities);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

// Add a new city
app.post("/cities", async (req, res) => {
  try {
    const data = await readData();
    const newItem = req.body;
    newItem.id = data.cities.length + 1;
    data.cities.push(newItem);
    await writeData(data);
    res.json(newItem);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

// Get all aircrafts
app.get("/aircrafts", async (req, res) => {
  try {
    const data = await readData();
    res.send(data.aircrafts);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

// update aircrafts seats
app.get("/aircrafts/:id/:updateData", async (req, res) => {
  try {
    const data = await readData();
    const itemId = req.params.id;
    const updateData = JSON.parse(req.params.updateData);
    const updateItem = data.aircrafts.filter((item) => item.id == itemId)[0];

    if (updateData.firstClassSeats) {
      updateItem.firstClassSeats = updateData.firstClassSeats;
    } else if (updateData.businessClassSeats) {
      updateItem.businessClassSeats = updateData.businessClassSeats;
    } else if (updateData.economyClassSeats) {
      updateItem.economyClassSeats = updateData.economyClassSeats;
    }
    await writeData(data);
    res.json(updateItem);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

// Add a new aircraft
app.post("/aircrafts", async (req, res) => {
  try {
    const data = await readData();
    const newItem = req.body;
    newItem.id = data.aircrafts.length + 1;
    data.aircrafts.push(newItem);
    await writeData(data);
    res.json(newItem);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

// Get all flights
app.get("/flights", async (req, res) => {
  try {
    const data = await readData();
    res.send(data.flights);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

// Add a new flight
app.post("/flights", async (req, res) => {
  try {
    const data = await readData();
    const newItem = req.body;
    newItem.id = data.flights.length + 1;
    data.flights.push(newItem);
    await writeData(data);
    res.json(newItem);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

// Get booked Flights
app.get("/bookedFlights", async (req, res) => {
  try {
    const data = await readData();
    res.send(data.bookedFlights);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

//book a flight
app.post("/bookedFlights", async (req, res) => {
  try {
    const data = await readData();
    const newItem = req.body;
    newItem.id = data.bookedFlights.length + 1;
    data.bookedFlights.push(newItem);
    await writeData(data);
    res.json(newItem);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

//admin update flight
app.get("/flights/:id/:status", async (req, res) => {
  try {
    const data = await readData();
    const itemId = req.params.id;
    const status = req.params.status;
    const updateData = data.flights.filter((item) => item.id == itemId);
    updateData[0].status = status;
    await writeData(data);
    res.json(itemId);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

//client update flight
app.get("/bookedFlights/:id/:newData", async (req, res) => {
  try {
    const updateData = JSON.parse(req.params.newData);
    const data = await readData();
    const itemId = req.params.id;
    const updatedItem = data.bookedFlights.filter(
      (item) => item.id == itemId
    )[0];

    if (updateData.type == "cancelFlight") {
      updatedItem.status = updateData.status;
    } else if (updateData.type == "addPassenger") {
      updatedItem.passengers = updateData.passengers;
      updatedItem.seats = updateData.seats;
      updatedItem.passengerQuantity = updateData.passengerQuantity;
    } else if (updateData.type == "changePassenger") {
      updatedItem.passengers = updateData.passengers;
    } else if (updateData.type == "changeClass") {
      updatedItem.selectedClass = updateData.selectedClass;
      updatedItem.seats = updateData.seats;
    } else if (updateData.type == "changeSeats") {
      updatedItem.seats = updateData.seats;
    } else if (updateData.type == "deletePassenger") {
      updatedItem.passengers = updateData.passengers;
      updatedItem.seats = updateData.seats;
    }

    await writeData(data);
    res.json(updatedItem);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});
