import * as THREE from "https://threejs.org/build/three.module.js";
import { OrbitControls } from "https://threejs.org/examples/jsm/controls/OrbitControls.js";
import { ConvexBufferGeometry } from "https://threejs.org/examples/jsm/geometries/ConvexGeometry.js";

class WaveEquation {
    constructor() {
        this.N = 2000
        this.D = 0.25
        this.Mx = 50
        this.My = 50

        this.tend = 6
        this.xmin = 0
        this.xmax = 2
        this.ymin = 0
        this.ymax = 2

        this.initialization()
        this.eqnApprox()

        this.u_2 = this.fill();
        this.k = 0
        this.nSteps = this.N * 10
    }

    initialization() {
        this.dx = (this.xmax - this.xmin)/this.Mx;
        this.dy = (this.ymax - this.ymin)/this.My;

        this.x = [];
        for (let i = this.xmin; i < this.xmax + this.dx; i += this.dx) {
            this.x.push(i);
        }

        this.y = [];
        for (let i = this.ymin; i < this.ymax + this.dy; i += this.dy) {
            this.y.push(i);
        }

        console.log(`x: ${this.x}`);
        console.log(`y: ${this.y}`);

        this.dt = this.tend / this.N;

        this.t = [];
        for (let i = 0; i < this.tend + this.dt/2; i += this.dt) {
            this.t.push(i);
        }
    }

    initU0(r, s) {
        return 0.1 * Math.sin(Math.PI*r) * Math.sin(Math.PI*s/2)
    }

    initV0(a, b) {
        return 0;
    }

    initBXYT(left, right, time) {
        return 0;
    }

    eqnApprox() {
        this.rx = this.D * Math.pow(this.dt, 2)/Math.pow(this.dx, 2);
        this.ry = this.D * Math.pow(this.dt, 2)/Math.pow(this.dy, 2);
        this.rxy1 = 1 - this.rx - this.ry;
        this.rxy2 = this.rxy1 * 2;

        this.u = this.fill();
        this.ut = this.fill();
        this.u_1 = this.fill();

        for (let j = 1; j < this.Mx; j++) {
            for (let i = 1; i < this.My; i++) {
                this.u[i][j] = this.initU0(this.x[i], this.y[j]);
                this.ut[i][j] = this.initV0(this.x[i], this.y[j]);
            }
        }
    }

    fill() {
        let u = [];
        for(let i = 0; i < this.Mx + 1; i++) {
            let tmp = [];
            for (let j = 0; j < this.My + 1; j++) {
                tmp.push(0);
            }
            u.push(tmp);
        }
        return u;
    }

    solveAndAnimate() {
        if(this.k < this.nSteps) {
            this.t = this.k * this.dt;

            for(let i = 0; i < this.My + 1; i++) {
                this.u[i][0] = this.initBXYT(this.x[0], this.y[i], this.t);
                this.u[i][this.Mx] = this.initBXYT(this.x[this.Mx], this.y[i], this.t);
            }

            for(let j = 0; j < this.Mx + 1; j++) {
                this.u[0][j] = this.initBXYT(this.x[j], this.y[0], this.t);
                this.u[this.My][j] = this.initBXYT(this.x[j], this.y[this.My], this.t);
            }

            if(this.k === 0) {
                for(let j = 1; j < this.My; j++) {
                    for(let i = 1; i < this.Mx; i++) {

                        // this.u[i][j] = 0.5 * (this.rx * (this.u_1[i-1][j] + this.u_1[i+1][j])) +
                        //     0.5*(this.ry*(this.u_1[i][j-1] + this.u_1[i][j+1])) +
                        //     this.rxy1 * this.u[i][j] + this.dt * this.ut[i][j];

                        this.u[i][j] = 0.5 * this.rx * (this.u_1[i-1][j] + this.u_1[i+1][j]) + (1 - this.rx - this.ry) * this.u[i][j] +
                            0.5 * this.ry * (this.u_1[i][j-1] + this.u_1[i][j+1]) + this.dt * this.ut[i][j];
                    }
                }
            } else {
                for(let j = 1; j < this.My; j++) {
                    for(let i = 1; i < this.Mx; i++) {

                        // this.u[i][j] = this.rx * (this.u_1[i-1][j] + this.u_1[i+1][j]) +
                        //     this.ry*(this.u_1[i][j-1] + this.u_1[i][j+1]) +
                        //     this.rxy2 * this.u[i][j] - this.u_2[i][j];

                        this.u[i][j] = this.rx * (this.u_1[i-1][j] + this.u_1[i+1][j]) +
                            2 * (1 - this.rx - this.ry) * this.u_1[i][j] + 
                            this.ry*(this.u_1[i][j-1] + this.u_1[i][j+1]) - this.u_2[i][j];
                            
                    }
                }
            }

            this.u_2 = _.cloneDeep(this.u_1);
            this.u_1 = _.cloneDeep(this.u);

            this.k += 0.5;

        }
    }
}

let waveEquation = new WaveEquation();

let camera, scene, renderer;

scene = new THREE.Scene();
renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(100/2, 100/2, 100/2);
scene.add(camera);

const loader = new THREE.TextureLoader();
loader.load('./bg.jpg' , function(texture) {
    scene.background = texture; 
});

const controls = new OrbitControls(camera, renderer.domElement);

// scene.add( new THREE.AmbientLight(0x222222));
// const light = new THREE.PointLight(0xffffff);
// camera.add(light);
// scene.add(new THREE.AxesHelper(20));

const getVertices = () => {
    let vertices = [];
    
    for (let i = 0; i < waveEquation.u.length; i++) {
        for (let j = 0; j < waveEquation.u[0].length; j++) {
            vertices.push(
                new THREE.Vector3(i, waveEquation.u[i][j], j)
            )
        }
    }
    return vertices;
}

const getColors = () => {
    let colors = [];
    
    for (let i = 0; i < waveEquation.u.length; i++) {
        for (let j = 0; j < waveEquation.u[0].length; j++) {
            let colorValue = Math.abs(waveEquation.u[i][j]) / 20;
            colors.push(
                new THREE.Color(colorValue, (1 - colorValue)/2 , 0)
            )
        }
    }
    return colors;
}

// [-20; 20]
// scene.add(new THREE.GridHelper(100, 100));

let vertices = getVertices();
let colors = getColors();

var dotGeometry = new THREE.Geometry();
dotGeometry.vertices = vertices;
dotGeometry.colors = colors;
var dotMaterial = new THREE.PointsMaterial( { size: 5, vertexColors: THREE.VertexColors } );
var dot = new THREE.Points( dotGeometry, dotMaterial );
scene.add( dot );

console.log(dot)

dot.position.x = -25;
dot.position.z = -25;

renderer.setAnimationLoop(() => {
	renderer.render(scene, camera);
})

setInterval(() => {
    waveEquation.solveAndAnimate();

    dot.geometry = new THREE.Geometry();
    dot.geometry.vertices = getVertices();   
    dot.geometry.colors = getColors();
 
}, 10);
