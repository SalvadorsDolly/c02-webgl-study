// adding variables

var SCREEN_WIDTH = window.innerWidth,
    SCREEN_HEIGHT = window.innerHeight,
    mouseX = 0, 
    mouseY = 0, 
    windowHalfX = window.innerWidth / 2,
    windowHalfY = window.innerHeight / 2,
    camera, scene, renderer, water, waterHt = 1;

var textureLoader = new THREE.TextureLoader();
var composer, shaderTime = 0,
    filmPass, renderPass, copyPass, effectVignette, group, lastVal = 0;

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
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

	// intialize lighting, color, lumes etc
	var light = new THREE.HemisphereLight(0xa1e2f5, 0x6f4d25, 0.5);
    scene.add(light);

	//POST PROCESSING
    //Create Shader Passes
    renderPass = new THREE.RenderPass(scene, camera);
    hblur = new THREE.ShaderPass(THREE.HorizontalTiltShiftShader);
    vblur = new THREE.ShaderPass(THREE.VerticalTiltShiftShader);
    filmPass = new THREE.ShaderPass(THREE.FilmShader);
    effectVignette = new THREE.ShaderPass(THREE.VignetteShader);
    copyPass = new THREE.ShaderPass(THREE.CopyShader);

	//Above effects stack up in the Three Effects composer and get displayed through renderer
	//below add processing effects.
	composer = new THREE.EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(hblur);
    composer.addPass(vblur);
    composer.addPass(filmPass);
    composer.addPass(effectVignette);
    composer.addPass(copyPass);
    copyPass.renderToScreen = true;

	// params function sets individual parameters of post effects and creates a group to hold scene content. This makes it
	//easier to rotate all objects in the scene as a group.
	params();
	group = new THREE.Group();
	scene.add( group );

	var cloud = textureLoader.load( "img/cloud.png");
	material = new THREE.SpriteMaterial( {map:cloud, opacity:0.6, color:0x888888, fog:true } );
	// 8 groups of 35 clouds each are made, placed random, set to loop and controlled by slider
	for ( j = 0; j < 8; j++ ) {
		var g = new THREE.Group();
		for ( i = 0; i < 35; i++ ) {
			var x = 400 * Math.random() - 200;
			var y =  60 * Math.random() + 60;
			var z = 400 * Math.random() -200;
			//cloud positions and scale
			sprite = new THREE.Sprite(material);
			sprite.position.set( x, y, z );
			sprite.scale.x = sprite.scale.y = sprite.scale.z = 70;
			g.add(sprite);
		}
		if( j > 0 ) {
			g.scale.x = g.scale.y = g.scale.z = 0.001;	
		}
		group.add(g);
	}
	// now we load a Collada dae model and any mesh is made to cast shadows.
	var loader = new THREE.ColladaLoader();
	loader.options.convertUpAxis = true;
	loader.load( 'scene.dae', function(collada) {
		var dae = collada.scene;
		dae.traverse( function(child) {
			if(child instanceof THREE.Mesh ) {
				child.castShadow = true;
				child.receiveshadow = true;
			}
		});
		// water and light is passed into global variable for scene interaction.
		dae.scale.x = dae.scale.y = dae.scale.z = 0.5;
		dae.updateMatrix();
		group.add(dae);
		water = scene.getObjectByName("Water", true );
		water = water.children[0];
		light = scene.getObjectByName("SpLight", true );
		light = light.children[0];
		// light controls and settings
		light.target.position.set( 0, 0, 0 );
		light.castShadow = true;
		light.shadow = new THREE.LightShadow( new THREE.PerspectiveCamera(90, 1, 90, 5000 ));
		light.shadow.bias = 0.0008;
		light.shadow.mapSize.width = 1024;
		light.shadow.mapSize.height = 1024;
		light.pernumbra = 1;
		light.decay = 5;
		// render scene
		render();
	});

	// final init section to set mouse movement interaction with camera
	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	document.addEventListener( 'touchstart', onDocumentTouchStart, false );
	document.addEventListener( 'touchmove', onDocumentTouchMove, false );
	window.addEventListener( 'resize', onWindowResize, false );
 }
 	// render fuction set frame rate to 60 fps if possible, the models rotate slowly as a group and camera 
 	//position rendering is updated with each mouse movement while staying locked to center.
 	function render() {
 		requestAnimationFrame(render);
 		group.rotation.y += 0.005;
 		camera.position.x += 5 + ( (mouseX / 4) + 200 - camera.position.x ) * 0.05;
 		camera.position.y += 8 + ( -(mouseY / 4) - camera.position.y ) * 0.05;
 		camera.lookAt( scene.position );
 		shaderTime += 0.1;
 		filmPass.uniforms[ 'time' ].value = shaderTime;
 		composer.render( 0.1 );
 		TWEEN.update();
 	}

 	init();

 	// input slider on html document calls showVal and scales water larger if slider is moved. It tweens over 0.8 sec
 	function showVal(val) {
 		if ( val != lastVal ) {
 			if (val > lastVal) {
                    new TWEEN.Tween(group.children[val].scale).to({
                        x: 1,
                        y: 1,
                        z: 1
                    }, 800).easing(TWEEN.Easing.Quadratic.InOut).start();

 				waterHt += 0.07;
 				new TWEEN.Tween(water.scale).to({
 					y: waterHt
 				}, 800).easing(TWEEN.Easing.Quadratic.InOut).start();

 				// temp var finds select tree groups and scales them to zero as slider moves indicating global warming
 				var temp = scene.getObjectByName( "TreeG" + val, true );
 				new TWEEN.Tween(temp.scale).to({
 					y: 0.001
 				}, 1000).easing(TWEEN.Easing.Elastic.InOut).start();
 			}else{
 				new TWEEN.Tween(group.children[lastVal].scale).to({
 					x: 0.001,
 					y: 0.001,
 					z: 0.001
 				}, 800).easing(TWEEN.Easing.Quadratic.InOut).start();
 				waterHt -= 0.07;
 				new TWEEN.Tween(water.scale).to({
 					y: waterHt
 				}, 800).easing(TWEEN.Easing.Quadratic.InOut).start();
 				var temp = scene.getObjectByName( "TreeG" + lastVal, true );
 				new TWEEN.Tween(temp.scale).to({
 					y: 1
 				}, 1000).easing(TWEEN.Easing.Elastic.InOut).start();
 			}
 			lastVal = val;
 			//From Above else statement checks to see if slider is reversed backwards
 		}
 	}

 	function onWindowResize() {
            windowHalfX = window.innerWidth / 2;
            windowHalfY = window.innerHeight / 2;
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function onDocumentMouseMove(event) {
    	mouseX = event.clientX - windowHalfX;
    	mouseY = event.clientY - windowHalfY;
    }

    function onDocumentTouchStart(event) {
    	if ( event.touches.length > 1 ) {
    		event.preventDefault();
    		mouseX = event.touches[0].pageX - windowHalfX;
    		mouseY = event.touches[0].pageY - windowHalfY;
    	}
    }

    function onDocumentTouchMove(event) {
    	if ( event.touches.length == 1 ) {
    		event.preventDefault();
    		mouseX = event.touches[0].pageX - windowHalfX;
    		mouseY = event.touches[0].pageY - windowHalfY;
    	}
    }

    function params() {
    	var bluriness = 5;
    	hblur.uniforms['h'].value = bluriness / window.innerWidth;
    	vblur.uniforms['v'].value = bluriness / window.innerHeight;
    	hblur.uniforms['r'].value = vblur.uniforms['r'].value = 0.5;
    	filmPass.uniforms.grayscale.value = 0;
    	filmPass.uniforms['sCount'].value = 0;
    	filmPass.uniforms['sIntensity'].value = 0.4;
    	filmPass.uniforms['nIntensity'].value = 0.4;
    	effectVignette.uniforms["offset"].value = 0.95;
    	effectVignette.uniforms["darkness"].value = 1.8;
    }
