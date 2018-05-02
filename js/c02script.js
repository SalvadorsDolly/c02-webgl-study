// adding variables

var SCREEN_WIDTH = window.innerWidth,
    SCREEN_HEIGHT = window.innerHeight,
    mouseX = 0, mouseY = 0, 
    windowHalfX = window.innerWidth / 2,
    windowHalfY = window.innerHeight / 2,
    camera, scene, renderer, water, waterHt = 1;

var textureLoader = new THREE.TextureLoader();
var composer, shaderTime = 0, filmPass, renderPass, copyPass, effectVignette,
    group, lastVal = 0;

// initialize scene

function init() {
	var container = document.createElement('div');
	document.body.appendChild(container);

	// set camera type, field of view and position
	camera = new THREE.PerspectiveCamera( 75, SCREEN_WIDTH/ SCREEN_HEIGHT, 1, 1000 );
	camera.position.set( 2000, 100, 0 );

	// adds fog to scene and sets color and opacity
	scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2( 0xb6d9e6, 0.0025 );

	//initialize renderer, pixel ratio and the shadow maps
	renderer = new THREE.WebGLRenderer( {antialias: true} );
	renderer.setClearColor(0xadc9d4);
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( SCREEN_WIDTH / SCREEN_HEIGHT );
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	container.appendChild( renderer.domElement );

	// intialize lighting, color, lumes etc
	var light = new THREE.HemisphereLight( 0xa1e2f5, 0x6f4d25, 0.5 );
	scene.add( light );

	// These are shader variables that work with the post processing effects
	renderPass = new THREE.RenderPass( scene, camera );
	hBlur = new THREE.ShaderPass( THREE.HorizontalTiltShiftShader );
	vBlur = new THREE.ShaderPass( THREE.VerticalTiltShiftShader );
	filmPass = new THREE.ShaderPass( THREE.FilmShader );
	effectVignette = new THREE.ShaderPass( THREE.VignetteShader );
	copyPass = new THREE.ShaderPass( THREE.CopyShader );
		//Above effects stack up in the Three Effects composer and get displayed through renderer

	// params function sets parameters of post effects and creates a group to hold scene content. This makes it
	//easier to rotate all objects in the scene as a group.
	params();
	group = new THREE.Group();
	scene.add( group );

	var cloud = textureLoader.load( "img/cloud.png");
	material = new THREE.SpriteMaterial( {map:cloud, opacity:0.6, color:0x888888, fog:true } );
}
