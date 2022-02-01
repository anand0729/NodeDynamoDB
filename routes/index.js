module.exports = (app) => {
  app.post("/:controller/:action/", (req, res) => {
    let controllerName = req.params.controller;
    /* console.log("####################");
    console.log(controllerName); */
    let controller = require("../controllers/" + controllerName + "Controller");
    let controllerObj = new controller(req);

    controllerObj
      .doPostAction()
      .then((data) => {
        res.status(data.status);
        res.send(data);
      })
      .catch((err) => {
        
        res.status(err.status);
        res.send(err.message);
      });
  });

  app.get("/:controller/:action/", (req, res) => {
    let controllerName = req.params.controller;
    let controller = require("../controllers/" + controllerName + "Controller");
    let controllerObj = new controller(req);

    controllerObj
      .doGetAction()
      .then((data) => {
        res.status(data.status);
        res.send(data);
      })
      .catch((err) => {
        res.status(err.status);
        res.send(err);
      });
  });

  return app;
};
