const express = require("express");
const cors = require("cors");
const app = express();
const moment = require("moment-timezone");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    const blogCollection = client.db("blogDB").collection("blogCollection");
    const commentCollection = client
      .db("blogDB")
      .collection("commentCollection");
    const wishlist = client.db("blogDB").collection("wishlistCollection");

    app.post("/api/v1/create-new-blog", async (req, res) => {
      const blog = req.body;
      const currentUTC = moment().utc();
      // Convert the UTC time to Bangladeshi time (BST, UTC+6)
      const addedTimeBD = currentUTC.tz("Asia/Dhaka");
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

    app.get("/api/v1/featured-blogs", async (req, res) => {
      const documents = await blogCollection.find({}).toArray();

      // Sort the documents based on the length of the "longDescription" property
      documents.sort(
        (a, b) => b.longDescription.length - a.longDescription.length
      );
      const result = documents.slice(0, 10);
      console.log(result);
      res.send(result);
    });
    app.get("/api/v1/blog-details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await blogCollection.findOne(query);
      console.log(id, result);
      res.send(result);
    });

    app.post("/api/v1/add-blog-comment", async (req, res) => {
      const blogComment = req.body;
      const result = await commentCollection.insertOne(blogComment);
      res.send(result);
    });

    app.get("/api/v1/comment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { postID: id };
      const result = await commentCollection.find(query).toArray();
      res.send(result);
    });

    app.delete("/api/v1/delete-comment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await commentCollection.deleteOne(query);
      res.send(result);
    });
    app.post("/api/v1/create-wishlist", async (req, res) => {
      const wish = req.body;
      const result = await wishlist.insertOne(wish);
      res.send(result);
    });

    app.get("/api/v1/wishlist", async (req, res) => {
      const email = req.query.email;
      const query = { userMail: email };
      const result = await wishlist.find(query).toArray();
      res.send(result);
    });

    app.get("/api/v1/trending-blogs", async (req, res) => {
      const result = await blogCollection.find().skip(5).limit(10).toArray();
      res.send(result);
    });

    app.delete("/api/v1/remove-wishlist/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await wishlist.deleteOne(query);
      res.send(result);
    });

    app.get("/api/v1/banner-blogs", async (req, res) => {
      const result = await blogCollection.find().limit(5).toArray();
      res.send(result);
    });

    app.get("/api/v1/blog/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await blogCollection.find(query).toArray();
      res.send(result);
    });

    app.put("/api/v1/update-blog/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedBlog = req.body;
      const blog = {
        $set: {
          title: updatedBlog.title,
          blogImage: updatedBlog.blogImage,
          category: updatedBlog.category,
          shortDescription: updatedBlog.shortDescription,
          longDescription: updatedBlog.longDescription,
          userName: updatedBlog.displayName,
          userMail: updatedBlog.email,
          userPhoto: updatedBlog.photoURL,
        },
      };
      const result = await blogCollection.updateOne(filter, blog, options);
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
