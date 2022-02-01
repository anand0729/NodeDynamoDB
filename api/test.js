const jwt = require("jsonwebtoken");
const Joi = require("@hapi/joi");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
var AWS = require("aws-sdk");
class testAPIs {
  login(data) {
    const schema = Joi.object({
      username: Joi.string().required(),
      password: Joi.string().required(),
    });

    const errorCheck = schema.validate(data);
    if (errorCheck.error) {
      let response = {
        status: 400,
        data: errorCheck.error.details,
      };
      return Promise.resolve(response);
    }

    if (data.username == "Admin" && data.password == "Password") {
      return this.tokenGenerate({
        Name: "TestUser",
        uId: 10,
      });
    }

    let resp = {
      status: 201,
      message: "Invalid User",
    };
    return Promise.resolve(resp);
  }

  tokenGenerate(dataCame) {
    try {
      console.log(dataCame);
      const token = jwt.sign({ dataCame }, process.env.TokenSecret, {
        expiresIn: 60 * 60,
      });
      let response = {
        status: 200,
        token: token,
      };

      return Promise.resolve(response);
    } catch (error) {
      let response = {
        status: 401,
        error: error.message,
      };
      return Promise.resolve(response);
    }
  }

  tokenRegenerate(dataCame) {
    try {
      let userInfo = jwt.verify(
        dataCame.authorization.split(" ")[1],
        process.env.TokenSecret,
        { ignoreExpiration: true }
      );

      const token = jwt.sign({ data: userInfo }, process.env.TokenSecret, {
        expiresIn: 60 * 60,
      });
      let response = {
        status: 200,
        token: token,
      };

      return Promise.resolve(response);
    } catch (error) {
      let response = {
        status: 401,
        error: error.message,
      };
      return Promise.resolve(response);
    }
  }


  async import(fileDetails) {
    if (fileDetails) {
      let filePath = path.join(
        __dirname,
        "./../uploads/" + fileDetails.newFile
      );

      try {
        let csvData = await this.readCSVData(fileDetails, filePath);
        await this.deleteCSVData(fileDetails, filePath);
        if (csvData.length > 1) {
          let promiseArray = [];

          for (let i = 0; i < csvData.length; i++) {
            let promise = new Promise((resolve) => {
              csvData[i].Status = 1;
              if (!csvData[i].Email_ID) {
                csvData[i].Status = 0;
                csvData[i].error_log = "Email Missing";
              }
              if (!csvData[i].Mobile) {
                csvData[i].Status = 0;
                csvData[i].error_log = "Mobile Missing";
              }
              if (!csvData[i].Email_ID && !csvData[i].Mobile) {
                csvData[i].Status = 0;
                csvData[i].error_log = "Email & Mobile Number Missing";
              }

              /* console.log(csvData[i]); */

              AWS.config.update({
                region: "ap-south-1",
              });

              docClient = new AWS.DynamoDB.DocumentClient();
              let params = {
                TableName: "users",
                Item: csvData,
              };

              docClient.put(params).promise().then(data =>{
                resolve(data);
              });
            });

            promiseArray.push(promise);
          }
          return Promise.all(promiseArray)
            .then((values) => {
              var response = {
                status: 200,
                values: values,
              };
              return Promise.resolve(response);
            })
            .catch(function (err) {
              var response = {
                status: 200,
                msg: "err",
                data: err.message,
              };
              return Promise.reject(response);
            });
        } else {
          var response = {
            status: 200,
            msg: "Empty File Uploaded",
          };
          return Promise.resolve(response);
        }
      } catch (error) {
        let response = {
          status: 200,
          msg: error.message,
        };
        return Promise.resolve(response);
      }
    } else {
      let response = {
        status: 200,
        msg: "Invalid File / File Not Found!",
      };
      return Promise.resolve(response);
    }
  }

  readCSVData(fileDetails, filePath) {
    return new Promise((resolve, reject) => {
      let dataArray = [];
      fs.createReadStream(filePath)
        .on("error", (error) => {
          console.log(error);
          let response = {
            status: 200,
            error: error,
          };
          return reject(response);
        })
        .pipe(csv())
        .on("data", (cData) => {
          dataArray.push(cData);
        })
        .on("end", () => {
          return resolve(dataArray);
        });
    });
  }

  deleteCSVData(fileDetails, filePath) {
    return new Promise((resolve, reject) => {
      fs.unlink(filePath, (error) => {
        if (error) {
          let response = {
            status: 200,
            error: error,
          };
          return reject(response);
        }

        return resolve(fileDetails);
      });
    });
  }
}

module.exports = testAPIs;
