'use client'
import * as THREE from 'three';
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";

import CutPlaneControl from './CutPlaneControl';

class CutPlaneAction {
    constructor() {
        this._editor = null;
        this._geometry = null;
        this._mesh = null;

        this._planeControl = null;
    }

    get model() { return this._geometry }

    setEnvironment = (editor) => {
        this._editor = editor;
    }

    load = (path, callback) => {
        if (!this._editor) return;
        const loader = new STLLoader();
        loader.load(path, geometry => {

            this._geometry = geometry;
            this._addScene();

            const { camera, scene, container } = this._editor;
            if (camera && scene && container) {

                if(!this._planeControl)
                    this._planeControl = new CutPlaneControl(camera, scene, container);
                if (this._mesh) {
                    this._planeControl.setPlane( { geometry : geometry, matrix : this._mesh.matrix} , 0xFFA41E);
                    if (callback) callback(this._mesh);
                }
            }

        }, undefined, function (e) {
            console.error(e);
        });
    }

    _addScene = () => {
        if (!this._editor || !this._geometry) return;
        const { scene } = this._editor;
        const material = new THREE.MeshPhongMaterial({
            color: 0xc84c4c,
            specular: 0x9b5e55,
            side: THREE.DoubleSide,
            roughness: 0.2,
        });
        this._mesh = new THREE.Mesh(this._geometry, material);
        scene.add(this._mesh);

    }
}

export default CutPlaneAction;