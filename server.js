


var express = require('express');
var path = require('path');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);
var Spawn = require('node-spawn');

app.use(express.static(path.join(__dirname, 'public')));

var cmd = '/home/anders/x/kinect-glitter/kinectStream.py';
var cmd = '/Users/kinect1/kinect-glitter/kinectStream.py';

var kinectStream;

var n = 0;


io.on('connection', function(socket){

  if (kinectStream){
    try{
      console.log('killing old stram ...');
      kinectStream.kill();
      console.log('killed.');
      n = 0;
    }
    catch(e){
      console.log('Error when killing stream.');
    }
  }

  console.log('connected.');

  function doEmit(d) {
    var s = d.toString();
    if (n%20===0){
      console.log(n, s);
    }
    n += 1;
    socket.emit('event', s);
  }

  function doError(e){
    console.log('error: ');
    console.log(e.toString());
  }

  kinectStream = Spawn({
    cmd: cmd,
    restarts: -1,
    onStdout: doEmit,
    onSterr: doError
  });
 
  console.log('spawning ...');
  kinectStream.start();
  console.log('spawned.');

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
