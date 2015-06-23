


var express = require('express');
var path = require('path');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);
var Spawn = require('node-spawn');

var util  = require('util');
var spawn = require('child_process').spawn;
//var kinectStream = spawn('python', ['kinect-stream.py']);

function doThing(s){
  console.log('thing');
  console.log(s);
}

function doError(e){
  console.log('error');
  console.log(e);
}

app.use(express.static(path.join(__dirname, 'public')));
spawn = Spawn({
  cmd: '/home/anders/x/kinect-glitter/kinectStream.py',
  restarts:-1,
  onStdout: doThing,
  onSterr: doError
});

try{
  spawn.start();
}
catch(e){
console.log('asdf');
}


//io.on('connection', function(socket){

  //var n = 0;

  //function doEmit(d) {
    //var s = d.toString();
    //if (n%20===0){
      //console.log(n, s);
    //}
    //n += 1;
    //socket.emit('event', s);
  //}

  //console.log('connected.');

  //kinectStream.stdout.on('data',doEmit);

//});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
