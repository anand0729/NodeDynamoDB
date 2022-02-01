const express = require("express");
const localUpload = require("express-fileupload");
const app = express();
app.use(express.static(__dirname + "/uploads"));
app.use("/uploads", express.static(__dirname + "/uploads"));
app.use(localUpload());
const server = require("http").createServer(app);
const router = express.Router();
require("dotenv").config();
require("./middleware")(app);
const routes = require("./routes")(router,{}); 
app.use("/", routes);
let port = process.env.ServerPort || 3000;
server.listen(port, () => {
  console.log("NodeStarted", port);
});