let container;
let camera, scene, raycaster, renderer;

let mouse = new THREE.Vector2(), INTERSECTED, CLICKED;
let clock = new THREE.Clock();

let objLoader = null;
let objectList = [];
let objModelUrl = {obj:'models/obj/frog/frog.obj', map:'models/obj/frog/texture.jpg'};

let duration = 2000; // ms
let currentTime = Date.now();

let number_enemies = 1;

let score = 0;
let seconds = 15;

let requestId;

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
        
        object.scale.set(6, 6, 6);
        object.position.set(Math.random() * 200 - 100, Math.random() * 200 - 100, -600);
        object.name = "Frog";
        objectList.push(object);
        scene.add(object);
    }
    catch (err) {
        return onError(err);
    }
}

const onError = ( ( err ) => { console.error( err ); } );

function animate() {
    let now = Date.now();
    let deltat = now - currentTime;
    currentTime = now;
    let fract = deltat / duration;
    let randomVel;
    
    objectList.forEach(object => {
        randomVel = Math.random() * 200 + 50;
        object.translateZ(randomVel * fract + 0.5);
        damage_from_enemy(object);
    });

}

let countdown = setInterval(function() {
    seconds--;
    document.getElementById("timer").textContent = seconds;
        if (seconds <= 0) {
            game_over();
            clearInterval(countdown);
        }
    }, 1000);

function damage_from_enemy(object){
    // Change the object color when reaching a certain distance
    if(object.position.z >= -150 || object.position.z >= -200){
        object.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                child.material.emissive.setHex(0xFF0000);
            }
        });
    }
    // If the object is close, damage the player by reducing the score. Simultaneously checks if the score is == 0, it restarts the game
    if(object.position.z >= -150){
        scene.remove(object);
        objectList.pop();
        score -= 1;
        if(score <= 0){
            game_over();
            document.getElementById("score").textContent = "Score: 0";
        } else {
            $("#score").html("Score: " + (score -= 1));
        }
       
        if(objectList < number_enemies){
            spawn_enemy();
        }
    }
}

function spawn_enemy(){
    loadObj(objModelUrl, objectList)
}

// When the player has clicked on the object, it destroyes it, adds a point to the score and respawns an enemy
function kill_enemy(object) {
    objectList.pop();
    scene.remove(object);
    spawn_enemy();
    $("#score").html("Score: " + (score += 1));
}

// Reloads the whole page
function game_over(){
    document.getElementById("restart_btn").style.display="block";
    document.getElementById("result").textContent = "Loser";
    document.getElementById("result").style.display="block";
    window.cancelAnimationFrame(requestId);
    requestId = undefined;
}

function create_scene(canvas) {
    $("#score").html("Score: " + (score));
    document.getElementById("restart_btn").style.display="none";
    document.getElementById("result").style.display="none";  

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
        spawn_enemy();
    
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
    if ( intersects.length > 0 ) {
        CLICKED = intersects[ intersects.length - 1 ].object;
        CLICKED.material.emissive.setHex( 0xFF0000 );
        kill_enemy(CLICKED.parent);
    } 
    else {
        if ( CLICKED ) {
            CLICKED.material.emissive.setHex( CLICKED.currentHex );
        }
        CLICKED = null;
    }
}

function run() {
    requestId = requestAnimationFrame( run );
    render();
    animate();
}

function render(){
    renderer.render( scene, camera );
}
