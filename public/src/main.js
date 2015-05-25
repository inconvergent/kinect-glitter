var Ndarray = ndarray.ndarray;

var camera;
var renderer;
var offset;
var $container;
var controls;
var stats;

var mouseX, mouseY, worldMouseX, worldMouseY;

var P;
var timeout = null;

var winWidth = window.innerWidth;
var winHeight = window.innerHeight;
var viewRatio = winWidth/winHeight;
var pixelRatio = window.devicePixelRatio || 1;

var resolution = 512;
var size = 1500;

window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame ||
          function(callback){
            window.setTimeout(callback,1000/60);
          };
})();


$(function() {
  var timer_id;
  $(window).resize(function() {
      clearTimeout(timer_id);
      timer_id = setTimeout(function() {
        windowAdjust();
      }, 300);
  });
});


function windowAdjust() {

  winWidth = window.innerWidth;
  winHeight = window.innerHeight;
  offset = $container.offset();
  pixelRatio = window.devicePixelRatio || 1;

  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(winWidth,winHeight);

  camera.aspect = winWidth/winHeight;
  camera.updateProjectionMatrix();

  console.log('window', winWidth,winHeight);
  console.log('pixel ratio', pixelRatio);

  viewRatio = window.innerWidth/window.innerHeight;
  console.log('screen ratio', viewRatio);
}


$.when(
  $.ajax({
    url: 'shaders/particle.frag',
    datatype: 'text'
  }),
  $.ajax({
    url: 'shaders/particle.vert',
    datatype: 'text'
  }),
  $.ajax({
    url: 'shaders/grid.frag',
    dataType: 'text'
  }),
  $.ajax({
    url: 'shaders/grid.vert',
    dataType: 'text'
  }),
  $.ajax({
    url: 'shaders/plane.frag',
    dataType: 'text'
  }),
  $.ajax({
    url: 'shaders/plane.vert',
    dataType: 'text'
  })
).done(function(
  particleFrag,
  particleVert,
  gridFrag,
  gridVert,
  planeFrag,
  planeVert
){

  if (!Detector.webgl){
    Detector.addGetWebGLMessage();
  }

  $(document).ready(function(){

    console.log('start');

    $container = $('#box');

    renderer = new THREE.WebGLRenderer({
      alpha: true,
      preserveDrawingBuffer: false
    });
    renderer.autoClear = true;
    $container.append(renderer.domElement);

    camera = new THREE.PerspectiveCamera(
      40,
      winWidth/winHeight,
      1,
      5000
    );

    scene = new THREE.Scene();

    var camTarget = new THREE.Vector3(0,0,0);
    var camStart = new THREE.Vector3(0,0,1200);
    //var camStart = new THREE.Vector3(0,0,2000);
    camera.position.x = camStart.x;
    camera.position.y = camStart.y;
    camera.position.z = camStart.z;
    camera.lookAt(camTarget);

    camera.aspect = viewRatio;
    camera.updateProjectionMatrix();

    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(winWidth,winHeight);

    scene.add(camera);

    windowAdjust();

    controls = new THREE.OrbitControls(camera);
    if (controls){
      controls.rotateSpeed = 1.0;
      controls.zoomSpeed = 1.2;
      controls.panSpeed = 1.0;
      controls.noZoom = false;
      controls.noPan = false;
      //controls.autoRotate = true;
      controls.staticMoving = true;
      controls.dynamicDampingFactor = 0.3;
      controls.keys = [65,83,68];
      controls.target.x = camTarget.x;
      controls.target.y = camTarget.y;
      controls.target.z = camTarget.z;
    }

    //stats = new Stats();
    if (stats){
      stats.domElement.style.position = 'absolute';
      stats.domElement.style.bottom = '0px';
      stats.domElement.style.left = '0px';
      stats.domElement.style.zIndex = 100;
      $container.append(stats.domElement);
    }

    var planeMat = new THREE.ShaderMaterial({
        vertexShader: planeVert[0],
        fragmentShader: planeFrag[0],
        transparent: true,
    });
    planeMat.side = THREE.DoubleSide;

    var plane = new THREE.PlaneBufferGeometry(2*size,2*size);
    var quad = new THREE.Mesh(plane, planeMat);
    scene.add(quad);

    P = new Particles();
    P.init(
      {
        n: resolution,
        size: size,
        particleWidth: 0.7,
        particleHeight: 200,
        particleBottom: 0
      },
      camera,
      scene,
      renderer,
      {
        vert: particleVert[0],
        frag: particleFrag[0]
      },{
        vert: gridVert[0],
        frag: gridFrag[0]
      }
    );

  var raycaster = new THREE.Raycaster();

   //$('body').on('touchmove mousemove touchstart',function(e) {

      //var mouse3D = new THREE.Vector3(
        //( e.clientX / window.innerWidth ) * 2 - 1,
        //-( e.clientY / window.innerHeight ) * 2 + 1,
        //0.5
      //);

      //raycaster.setFromCamera(mouse3D, camera);
      //var intersects = raycaster.intersectObjects([quad]);

      //if (intersects.length>0){
        //var i = intersects[0].point;
        //P.setMousePos(i, 1.0);

        //clearTimeout(timeout);
        //timeout = setTimeout(function(){
          //P.setMousePos(i, 0.0);
        //}, 100);
      //}
      //else{
        //P.setMousePos(new THREE.Vector2(10000,10000), 0.0);
      //}

    //});

    var socket = io();
    socket.on('event', function(msg){
      var a = msg.split(';');
      console.log(a[2]);

      var mouse3D = new THREE.Vector3(
        (parseFloat(a[0]) * 2 - 1),
        -parseFloat(a[1]) * 2 + 1,
        0.5
      );

      raycaster.setFromCamera(mouse3D, camera);
      var intersects = raycaster.intersectObjects([quad]);

      if (intersects.length>0){
        var inter = intersects[0].point;
        P.setMousePos(inter, 1.0);

        clearTimeout(timeout);
        timeout = setTimeout(function(){
          P.setMousePos(inter, 0.0);
        }, 500);
      }
      else{
        P.setMousePos(new THREE.Vector2(100000,100000), 0.0);
      }
    });

    renderer.setClearColor(new THREE.Color(0xFFFFFF), 1.0);

    var itt = 0;
    function animate(){
      itt += 1;
      window.requestAnimFrame(animate);

      if (controls){
        controls.update();
      }
      if (stats){
        stats.update();
      }

      P.step();
      renderer.setSize(winWidth,winHeight);
      renderer.render(scene, camera);
    }

    animate();
  });
});
