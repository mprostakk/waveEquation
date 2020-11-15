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
                        this.u[i][j] = 0.5 * (this.rx * (this.u_1[i-1][j] + this.u_1[i+1][j])) +
                            0.5*(this.ry*(this.u_1[i][j-1] + this.u_1[i][j+1])) +
                            this.rxy1 * this.u[i][j] + this.dt * this.ut[i][j];
                    }
                }
            } else {
                for(let j = 1; j < this.My; j++) {
                    for(let i = 1; i < this.Mx; i++) {
                        this.u[i][j] = this.rx * (this.u_1[i-1][j] + this.u_1[i+1][j]) +
                            this.ry*(this.u_1[i][j-1] + this.u_1[i][j+1]) +
                            this.rxy2 * this.u[i][j] - this.u_2[i][j];
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
camera.position.set(100, 100, 100);
scene.add(camera);

const controls = new OrbitControls(camera, renderer.domElement);

// scene.add( new THREE.AmbientLight(0x222222));
const light = new THREE.PointLight(0xffffff);
camera.add(light);

// scene.add(new THREE.AxesHelper(20));

const getVertices = () => {
    let vertices = [];
    for (let i = 0; i < waveEquation.u.length; i++) {
        for (let j = 0; j < waveEquation.u[i].length; j++) {
            vertices.push(
                new THREE.Vector3(i, waveEquation.u[i][j], j)
            )
        }
    }
    return vertices;
}

scene.add(new THREE.GridHelper(100, 100));

const meshMaterial = new THREE.MeshStandardMaterial( {
    color: 0xffaa00,
});

// const meshMaterial = new THREE.MeshBasicMaterial({color: 0xffaa00, wireframe: true});

let vertices = getVertices();

let meshGeometry = new ConvexBufferGeometry(vertices);

const mesh1 = new THREE.Mesh(meshGeometry, meshMaterial);
mesh1.renderOrder = 0;
scene.add(mesh1);

mesh1.position.x = -25;
mesh1.position.z = -25;

renderer.setAnimationLoop(() => {
	renderer.render(scene, camera);
})

setInterval(() => {
    waveEquation.solveAndAnimate();
    mesh1.geometry = new ConvexBufferGeometry(getVertices());
}, 10);
