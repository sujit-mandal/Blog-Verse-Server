const express = require("express");
const cors = require("cors");
const app = express();
const moment = require("moment-timezone");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.w7djr5h.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

    const blogCollection = client.db("blogDB").collection("blogCollection");

    app.post("/api/v1/create-new-blog", async (req, res) => {
      const currentUTC = moment().utc();

      // Convert the UTC time to Bangladeshi time (BST, UTC+6)
      const addedTimeBD = currentUTC.tz("Asia/Dhaka");
      const blog = req.body;
      blog.addedTime = addedTimeBD._d;
      const result = await blogCollection.insertOne(blog);
      res.send(result);
    });

    app.get("/api/v1/recent-blogs", async (req, res) => {
      const result = await blogCollection
        .find()
        .sort({ addedTime: -1 })
        .limit(6)
        .toArray();
      console.log(result);
      res.send(result);
    });

    app.get("/api/v1/all-blogs", async (req, res) => {
      const searchQuery = req.query.q;
      const category = req.query.category;
      const query = category ? { category } : {};
      if (searchQuery) {
        const regex = new RegExp(searchQuery, "i");
        query.title = { $regex: regex };
      }
      const result = await blogCollection.find(query).toArray();
      console.log(searchQuery);
      console.log(query);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running.");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

