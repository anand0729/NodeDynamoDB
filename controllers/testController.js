const testAPIs = require("../api/test");
class testController extends testAPIs {
  constructor(req) {
    super(req);
    this.action = "";
    this.requestParams = req.params;
    this.requestBody = req.body;
    this.header = req.headers;
    this.file = req.importedFileInfo;
  }

  doPostAction() {
    this.action = this.requestParams.action;

    try {
      switch (this.action) {
        case "login":
          return this.login(this.requestBody);
        
        case "import":
        return this.import(this.file);

        default:
          var response = {
            status: 200,
            msg: "Invalid Request",
          };
          return Promise.resolve(response);
      }
    } catch (error) {
      
      var response = {
        status: 200,
        msg: "Invalid Request",
        error: error.message,
      };
      return Promise.resolve(response);
    }
  }

  doGetAction() {
    this.action = this.requestParams.action;

    try {
      switch (this.action) {
        case "tokenRegenerate":
          return this.tokenRegenerate(this.header);
        default:
          var response = {
            status: 200,
            msg: "Invalid Request",
          };
          return Promise.resolve(response);
      }
    } catch (error) {
      
      var response = {
        status: 200,
        msg: "Invalid Request",
        error: error.message,
      };
      return Promise.resolve(response);
    }
  }
}

module.exports = testController;
