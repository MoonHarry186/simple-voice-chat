const express = require("express");
const app = express();
const handlebars = require("express-handlebars");
const http = require("http").Server(app);
const io = require("socket.io")(http);

//To holding users information 
const socketsStatus = {};

//config and set handlebars to express
// const customHandlebars = handlebars.create({ layoutsDir: "./views" });
const path = require('path');
console.log(path)
const customHandlebars = handlebars.create({ layoutsDir: path.join(__dirname, 'views') });

app.engine("handlebars", customHandlebars.engine);
app.set('views', path.join(__dirname, 'views')); // Ensure the views directory is correctly referenced
app.set("view engine", "handlebars");

//enable user access to public folder 
// app.use("/files", express.static("public"));
// Set the static folder and ensure correct MIME type
app.use("/files", express.static(path.join(__dirname, "public"), {
  setHeaders: (res, path) => {
    if (path.endsWith(".css")) {
      res.setHeader("Content-Type", "text/css");
    }
  }
}));

app.get("/" , (req , res)=>{
    res.render("index");
});

io.on("connection", function (socket) {
  const socketId = socket.id;
  socketsStatus[socket.id] = {};


  console.log("connect");

  socket.on("voice", function (data) {

    var newData = data.split(";");
    newData[0] = "data:audio/ogg;";
    newData = newData[0] + newData[1];

    for (const id in socketsStatus) {

      if (id != socketId && !socketsStatus[id].mute && socketsStatus[id].online)
        socket.broadcast.to(id).emit("send", newData);
    }

  });

  socket.on("userInformation", function (data) {
    socketsStatus[socketId] = data;

    io.sockets.emit("usersUpdate",socketsStatus);
  });


  socket.on("disconnect", function () {
    delete socketsStatus[socketId];
  });

});

const port = process.env.PORT || 3000;
http.listen(port, () => {
  console.log(`The app is running on port ${port}!`);
});
