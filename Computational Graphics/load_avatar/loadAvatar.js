// Assignment: Load Avatar and Use Transform Controls to only rotate the Avatar on the Y axis
// Author: Daniela Vignau 
// Date: March 24, 2020

let renderer = null, 
scene = null, 
camera = null,
root = null,
group = null,
objectList = [],
orbit = null,
control = null;

let objLoader = null;

let duration = 20000; // ms
let currentTime = Date.now();

let directionalLight = null;
let spotLight = null;
let ambientLight = null;
let pointLight = null;
let mapUrl = "../images/checker_large.gif";

let SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 2048;
let objModelUrl = {obj:'../models/obj/human/BodyMesh.obj'};

function promisifyLoader ( loader, onProgress ) 
{
    function promiseLoader ( url ) {
  
      return new Promise( ( resolve, reject ) => {
  
        loader.load( url, resolve, onProgress, reject );
  
      } );
    }
  
    return {
      originalLoader: loader,
      load: promiseLoader,
    };
}

const onError = ( ( err ) => { console.error( err ); } );

async function loadObj(objModelUrl, objectList)
{
    const objPromiseLoader = promisifyLoader(new THREE.OBJLoader());

    try {
        const object = await objPromiseLoader.load(objModelUrl.obj);
        object.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material.color.setHex(0xFF0000);
            }
        });

        object.scale.set(3, 3, 3);
        object.position.z = 0;
        object.position.x = 0;
        object.position.y = 1   ;
        object.rotation.y = -0.65;
        object.name = "objObject";
        objectList.push(object);
        scene.add(object);
        control.attach(object);
    }
    catch (err) {
        return onError(err);
    }
}

function run() 
{
    requestAnimationFrame(function() { run(); });
    
    // Render the scene
    renderer.render( scene, camera );

}

function setLightColor(light, r, g, b)
{
    r /= 255;
    g /= 255;
    b /= 255;
    
    light.color.setRGB(r, g, b);
}

function createScene(canvas) 
{
    // Create the Three.js renderer and attach it to our canvas
    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );

    // Set the viewport size
    renderer.setSize(canvas.width, canvas.height);

    // Turn on shadows
    renderer.shadowMap.enabled = true;
    // Options are THREE.BasicShadowMap, THREE.PCFShadowMap, PCFSoftShadowMap
    renderer.shadowMap.type = THREE.BasicShadowMap;
    
    // Create a new Three.js scene
    scene = new THREE.Scene();

    // Add  a camera so we can view the scene
    camera = new THREE.PerspectiveCamera( 45, canvas.width / canvas.height, 1, 4000 );
    camera.position.set(-11, 3, 12);
    scene.add(camera);

    orbit = new THREE.OrbitControls(camera, renderer.domElement);
    orbit.enabled = false;

    control = new THREE.TransformControls( camera, renderer.domElement );   
    control.addEventListener('change', function( event ) {
        control.setMode("rotate");
    });

    control.showX = ! control.showX;
    control.showZ = ! control.showZ;

    
    // Create a group to hold all the objects
    root = new THREE.Object3D;
    
    // Add a directional light to show off the object
    directionalLight = new THREE.DirectionalLight( 0xFFFFFF, 1);

    // Create and add all the lights
    directionalLight.position.set(.5, 4, -3);
    directionalLight.target.position.set(0, 4, 0);
    directionalLight.castShadow = true;
    root.add(directionalLight);

    spotLightLeft = new THREE.SpotLight (0xFFFFFF);
    spotLightLeft.position.set(-10, 8, 15);
    spotLightLeft.target.position.set(-2, 0, -2);
    root.add(spotLightLeft);

    spotLightLeft.castShadow = true;

    spotLightLeft.shadow.camera.near = 1;
    spotLightLeft.shadow.camera.far = 200;
    spotLightLeft.shadow.camera.fov = 45;
    
    spotLightLeft.shadow.mapSize.width = SHADOW_MAP_WIDTH;
    spotLightLeft.shadow.mapSize.height = SHADOW_MAP_HEIGHT;

    spotLightRight = new THREE.SpotLight (0xFFFFFF);
    spotLightRight.position.set(10, 8, 15);
    spotLightRight.target.position.set(-2, 0, -2);
    root.add(spotLightRight);

    spotLightRight.castShadow = true;

    spotLightRight.shadow.camera.near = 1;
    spotLightRight.shadow. camera.far = 200;
    spotLightRight.shadow.camera.fov = 45;
    
    spotLightRight.shadow.mapSize.width = SHADOW_MAP_WIDTH;
    spotLightRight.shadow.mapSize.height = SHADOW_MAP_HEIGHT;

    ambientLight = new THREE.AmbientLight ( 0x000000, 0.8);
    root.add(ambientLight);
    
    // Create the objects
    loadObj(objModelUrl, objectList);

    // Create a group to hold the objects
    group = new THREE.Object3D;
    root.add(group);

    // Create a texture map
    let map = new THREE.TextureLoader().load(mapUrl);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(8, 8);

    let color = 0xffffff;

    // Put in a ground plane to show off the lighting
    let geometry = new THREE.PlaneGeometry(200, 200, 50, 50);
    let mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:color, map:map, side:THREE.DoubleSide}));

    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -4.02;
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    group.add( mesh );
    
    scene.add( root );

    scene.add(control);
}