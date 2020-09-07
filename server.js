import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors";

const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
  appId: "1068049",
  key: "8c3933b6547834284f7d",
  secret: "9a8db3db9c101fee88c8",
  cluster: "ap1",
  encrypted: true,
});

app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

const connection_url =
  "mongodb+srv://risaka:risaka270894@cluster0.xjtck.gcp.mongodb.net/whatsapp?retryWrites=true&w=majority";
mongoose.connect(connection_url, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.once("open", () => {
  console.log("DB is connected");
  const msgCollection = db.collection("messageContent");
  const changeStream = msgCollection.watch();
  changeStream.on("change", (change) => {
    console.log(change, "Ini adalah perubahan.");
    if (change.operationType === insert) {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        received: messageDetails.received,
      });
    } else {
      console.log("Error triggering Pusher");
    }
  });
});

app.get("/", (req, res) => res.status(200).send("Hello World!"));
app.get("/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});
app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;
  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(`new message created: \n ${data}`);
    }
  });
});

app.listen(port, () => console.log(`Listening on localhost:${port}`));
