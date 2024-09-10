import {vec3} from 'gl-matrix';
const Stats = require('stats-js');
import * as DAT from 'dat.gui';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import Cube from './geometry/Cube';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import TesCube from './geometry/TesTest';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 5,
  'Load Scene': loadScene, // A function pointer, essentially
  Color: [105,0,255],
};

let icosphere: Icosphere;
let square: Square;
let square2: Square;
let square3: Square;
let cube: Cube;
let cube2: Cube;
let tesCube: TesCube;
let prevTesselations: number = 5;
let prevColor: number[] = [255, 0, 255];
let time = 0;

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  icosphere.create();

  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
  square2 = new Square(vec3.fromValues(0, 0, 0.4));
  square2.create();
  square3 = new Square(vec3.fromValues(0, 0, 0.8));
  square3.create();

  cube = new Cube(vec3.fromValues(0,0,0), 1); // adjust side length as needed
  cube.create();
  cube2 = new Cube(vec3.fromValues(0,0,0), 2); // adjust side length as needed
  cube2.create();

  tesCube = new TesCube(vec3.fromValues(0,0,0), 1);
  tesCube.create();
  
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'tesselations', 0, 8).step(1);
  gui.add(controls, 'Load Scene');
  gui.addColor(controls, 'Color');


  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));
  const renderer = new OpenGLRenderer(canvas);

  renderer.setObjColor(controls.Color[0] / 255, controls.Color[1] / 255, controls.Color[2] / 255, 1);
  renderer.setClearColor(0, 0, 0, 1);
  gl.enable(gl.DEPTH_TEST);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);

  const custom = new ShaderProgram([
      new Shader(gl.VERTEX_SHADER, require('./shaders/custom-vert.glsl')), 
      new Shader(gl.FRAGMENT_SHADER, require('./shaders/custom-frag.glsl')),
  ]);

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    
    if(controls.tesselations != prevTesselations)
    {
      prevTesselations = controls.tesselations;
      icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, prevTesselations);
      icosphere.create();
    }

    if(controls.Color != prevColor) {  // update cube color base on control
      prevColor = controls.Color;
      renderer.setObjColor(controls.Color[0] / 255, controls.Color[1] / 255, controls.Color[2] / 255, 1);
      cube = new Cube(vec3.fromValues(0, 0, 0), 1);
      cube.create();
      cube2 = new Cube(vec3.fromValues(0, 0, 0), 2);
      cube2.create();
    }
    
    // CHANGE WHAT IS RENDERED HERE
    renderer.render(camera, custom, [ // Change shaders
      // icosphere,
      //square, square2, square3
      //cube
      tesCube
    ]);
    stats.end();
    renderer.setTime(time, custom);
    time++;
    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

main();
