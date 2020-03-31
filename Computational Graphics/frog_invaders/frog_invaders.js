let container;
let camera, scene, raycaster, renderer;

let mouse = new THREE.Vector2(), INTERSECTED, CLICKED;

let objLoader = null;
let objectList = [];
let objModelUrl = {obj:'models/obj/frog/frog.obj', map:'models/obj/frog/texture.jpg'};

let duration = 4000; // ms
let currentTime = Date.now();

let number_enemies = 1;

// loading obj on screen
function promisifyLoader ( loader, onProgress ) {
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

async function loadObj(objModelUrl, objectList) {
    const objPromiseLoader = promisifyLoader(new THREE.OBJLoader());
    try {
        const object = await objPromiseLoader.load(objModelUrl.obj);      
        let texture = objModelUrl.hasOwnProperty('map') ? new THREE.TextureLoader().load(objModelUrl.map) : null;

        object.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                child.material.map = texture;
            }
        });
        
        object.scale.set(3, 3, 3);
        object.position.set(Math.random() * 200 - 100, Math.random() * 200 - 100, -400);
        object.name = "Frog";
        objectList.push(object);
        scene.add(object);
    }
    catch (err) {
        return onError(err);
    }
}

function animate() {
    let now = Date.now();
    let deltat = now - currentTime;
    currentTime = now;
    let fract = deltat / duration;
    let randomVel;
    
    objectList.forEach(object => {
        randomVel = Math.random() * 100 + 10;
        object.translateZ(randomVel * fract + 0.5);
        if(object.position.z >= -150){
            scene.remove(object);
            objectList.pop();
            if(objectList < number_enemies){
                spawnumber_enemies();
            }
        }
        let angle = Math.PI * 2 * fract;
        // object.rotation.y += angle;
    });

}

function spawnumber_enemies(){
    loadObj(objModelUrl, objectList)
}

function killEnemy(object) {
    // scene.remove(scene.getObjectByName(object));
    // object.traverse(function (child) {
    //     child.material.map.dispose();       
    // });
    console.log("Enemy killed ");
    // object.visible = false;
    scene.remove(object);
    render();
}

const onError = ( ( err ) => { console.error( err ); } );

function createScene(canvas) {
    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );

    // Set the viewport size
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Create a new Three.js scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xF0F0F0 );
    
    // Add a camera to view the scene
  
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );

    let light = new THREE.DirectionalLight( 0xFFFFFF, 0.5);
    light.position.set( 1, 2, 1 );
    scene.add(light);

    let ambientLight = new THREE.AmbientLight( 0xFFFFFF, 0.8 );
    ambientLight.position.set(0, 0, 0);
    scene.add(ambientLight);
    
    for(let i = 0; i < number_enemies; i ++) 
        spawnumber_enemies();
    
    raycaster = new THREE.Raycaster();
        
    document.addEventListener('mousemove', onDocumentMouseMove);
    document.addEventListener('mousedown', onDocumentMouseDown);
    
    window.addEventListener( 'resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function onDocumentMouseMove( event ) {
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    // find intersections
    raycaster.setFromCamera( mouse, camera );

    let intersects = raycaster.intersectObjects( scene.children, true );
    if ( intersects.length > 0 ) {
        
        let closer = intersects.length - 1;
        if ( INTERSECTED != intersects[ closer ].object ) {
            if ( INTERSECTED) {
                INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
            }
            INTERSECTED = intersects[ closer ].object;
            INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
            INTERSECTED.material.emissive.setHex( 0x0000FF );
        }
    } 
    else 
    {
        if ( INTERSECTED ) 
            INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );

        INTERSECTED = null;
    }
}

function onDocumentMouseDown(event) {
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    // find intersections
    raycaster.setFromCamera( mouse, camera );

    let intersects = raycaster.intersectObjects( scene.children, true );
    console.log('intersects: ' , intersects);
    if ( intersects.length > 0 ) {
        CLICKED = intersects[ intersects.length - 1 ].object;
        CLICKED.material.emissive.setHex( 0xFF0000 );
        // console.log(CLICKED);
        killEnemy(CLICKED);
    } 
    else {
        if ( CLICKED ) {
            CLICKED.material.emissive.setHex( CLICKED.currentHex );
        }
        CLICKED = null;
    }
}

function run() {
    requestAnimationFrame( run );
    render();
    animate();
}

function render(){
    renderer.render( scene, camera );
}
