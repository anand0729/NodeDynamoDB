const bodyParser = require("body-parser");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const jwt = require("jsonwebtoken");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
let moment = require("moment");

module.exports = function (app) {
  const limiter = rateLimit({
    rateLimit: 1 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP to 100 requests per windowMs
  });
  app.use(limiter);
  app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
  app.use(bodyParser.json({ limit: "5mb" }));
  app.use(compression());
  app.use(helmet());
  
  var whitelist = [
    "http://localhost:3000",
    "http://localhost:5000",
  ]; 
  var corsOptions = {
    origin: function (origin, callback) {
      if (whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    methods: ["POST"],
  };
  app.use(cors(corsOptions));
 
  let CurrentDate = moment().format("MMMM Do YYYY");
  /* console.log(CurrentDate); */
  let accessLogStream = fs.createWriteStream(
    path.join(__dirname, "../accessLog/" + CurrentDate + ".log"),
    { flags: "a" }
  );
  morgan.token("date", function () {
    var p = new Date()
      .toString()
      .replace(/[A-Z]{3}\+/, "+")
      .split(/ /);
    return p[2] + "/" + p[1] + "/" + p[3] + ":" + p[4] + " " + p[5];
  });
  app.use(morgan("combined", { stream: accessLogStream }));
  
  app.use((req, res, next) => {
    if (req.path.includes("login")) next();
    else {
      try {
        let token = req.headers.authorization.split(" ")[1];
        
        if (!token) {
          
          let resp = {
            status: 403,
            msg: "Access Denied",
            err: "Authorization Not Found !",
          };
          res.status(403).send(resp);
        }
        try {
          jwt.verify(token, process.env.TokenSecret);
          next();
        } catch (err) {
          let resp = {
            status: 403,
            msg: "Access Denied",
            err: "Token Expired (or) Invalid Token",
          };
          res.status(401).send(resp);
        }
      } catch (err) {
        let resp = {
          status: 403,
          msg: "Access Denied",
          err: "Authorization Not Found !",
        };

        res.status(403).send(resp);
      }
    }
  });

  app.use((req, res, next) => {

    if (req.files && req.files.csvImport) {
      let file = req.files.csvImport;
      let fileName = new Date().getTime() + "_" + file.name;
      let uploadPath = __dirname + "./../uploads/" + fileName;
      let fileCheck = req.files.csvImport.name.toLowerCase();
      /* console.log(fileCheck); */
      try {
        if (path.extname(fileCheck) == ".csv") {
          file.mv(uploadPath, function (err) {
            if (err) {
              let resp = {
                status: 403,
                msg: "Error while importing File",
                err: err,
              };
              res.status(403).send(resp);
            } else {
              let fileResp = {
                orgFile: req.files.csvImport.name,
                newFile: fileName,
              };
              req.importedFileInfo = fileResp;
              /* console.log(fileResp); */
              next();
            }
          });
        } else {
          next();
        }
      } catch (error) {
        let resp = {
          status: 403,
          msg: "Error while importing File",
          err: err,
        };
        res.status(403).send(resp); 
      }
      
    } else {
      next();
    }
  });
};
