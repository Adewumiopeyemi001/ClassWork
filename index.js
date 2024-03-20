const express = require("express");
const morgan = require("morgan");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { connectDB } = require("./Config/db");
const userRouter = require('./Routes/class.router');



const app = express();
app.use(express.json());
dotenv.config();
app.use(morgan("dev"));


const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("Class Work");
});

 app.use("/api/user", userRouter);

app.get("*", (req, res) => {
    res.status(404).json("Page Not Found");
});

app.listen(port, async() => {
    try{
        await connectDB(process.env.MONGODB_UR);
        console.log("Database connection Established")
        console.log(`Server is listening on http://localhost:${port}`);

    }catch(error) {
        console.log("Error connecting to MongoDB: " + error.message);
    }
});
