var SCREEN_WIDTH = window.innerWidth,
    SCREEN_HEIGHT = window.innerHeight,
    mouseX = 0, mouseY = 0, 
    windowHalfX = window.innerWidth / 2,
    windowHalfY = window.innerHeight / 2,
    camera, scene, renderer, water, waterHt = 1;

var textureLoader = new THREE.TextureLoader();
var composer, shaderTime = 0, filmPass, renderPass, copyPass, effectVignette,
    group, lastVal = 0;
