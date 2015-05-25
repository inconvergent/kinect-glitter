var express = require('express');
var path = require('path');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

var util  = require('util');
var spawn = require('child_process').spawn;
var ls = spawn('python', ['kinect-stream.py']);

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', function(socket){
  var n = 0;
  console.log('connected.');
  ls.stdout.on('data', function (gdata) {
    s = gdata.toString();

    if (n%20===0){
      console.log(n, s);
    }
    

    n += 1;

    socket.emit('event', s);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
