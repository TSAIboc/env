import * as THREE from 'three';
import { getBoundarybox, getGeometryCenter } from '../tool/getBoundary';
import { computeProjectPointOnPlane } from '../tool/getPlaneProjection';
import { isNumber } from 'mathjs';

/**
 * Using mouse left button to draw a line on screen and crate a section plane on scene
 * plane parameter : a point on plane and plane normal vector 
 */
class CutPlaneControl {
    constructor(camera, scene, domElement) {
        this._camera = camera;
        this._scene = scene;
        this._domElement = domElement;

        this.startX = -Infinity;
        this.startY = -Infinity;

        this.endX = -Infinity;
        this.endY = -Infinity;

        this.dragging = false;

        this.sectionLine = new THREE.Line();

        this.planeSize = 100;
        this.meshCenter = null;
        this.planeName = 'sectionPlane';
        this.planeNormal = null;
        this.planePoint = null;

        this.sectionPlaneColor = 0x000000;

        this.addSectionLine();
        this.addEvents();
    }

    //limit plane size by mesh boundarybox size
    setPlaneSize = (geometry, matrix) => {
        let box = getBoundarybox(geometry, matrix);
        let center = getGeometryCenter(geometry, matrix);
        if (box) {
            this.planeSize = box.max.distanceTo(box.min) + 0.5; //error value
            this.meshCenter = center.clone();
        }
    }

    setPlaneColor = (color) => {
        const re = /^[a-fA-F0-9]+$/;
        if (re.test(color) && isNumber(color))
            this.sectionPlaneColor = color;
    }

    setLineColor = (color) => {
        const re = /^[a-fA-F0-9]+$/;
        if (re.test(color) && isNumber(color)) {
            this.sectionLine.material.color.set(color).convertSRGBToLinear();
        }
    }

    getPlaneParameter = () => {
        if (!this.planeNormal) return null;
        return {
            'normal': this.planeNormal,
            'point': this.planePoint
        }
    }

    addEvents = () => {
        if (!this._domElement) return;
        this._domElement.addEventListener('pointerdown', this.onPointerdown);
        this._domElement.addEventListener('pointerup', this.onPointerup);
        this._domElement.addEventListener('pointermove', this.onPointermove);
    }

    removeEvents = () => {
        if (!this._domElement) return;
        this._domElement.removeEventListener('pointerdown', this.onPointerdown);
        this._domElement.removeEventListener('pointerup', this.onPointerup);
        this._domElement.removeEventListener('pointermove', this.onPointermove);
    }

    destroy = () => {
        this.removeEvents();
        this.removePlane();
        this.sectionLine = undefined;
    }

    //draw line on camera
    addSectionLine = () => {
        if (!this._camera) return;
        if (!this.sectionLine) return;
        this.sectionLine.material.color.set(0x000000).convertSRGBToLinear();
        this.sectionLine.renderOrder = 1;
        this.sectionLine.position.z = - 0.2;
        this.sectionLine.depthTest = false;
        this.sectionLine.scale.setScalar(1);
        this._camera.add(this.sectionLine);
    }

    onPointerdown = (e) => {
        if (e.button != 0) return;
        this.startX = (e.clientX / this._domElement.clientWidth) * 2 - 1;
        this.startY = - ((e.clientY / this._domElement.clientHeight) * 2 - 1);
        this.dragging = true;
    }

    onPointerup = (e) => {
        this.dragging = false;
        if (e.button != 0) return;
        if (!this.sectionLine) return;
        this.sectionLine.visible = false;
        this.removePlane();
        this.createPlane();
    }

    onPointermove = (e) => {
        if ((1 & e.buttons) === 0) return;
        if (!this.dragging) return;
        if (!this.sectionLine) return;

        let camera = this._camera;
        camera.updateProjectionMatrix();

        this.endX = (e.clientX / this._domElement.clientWidth) * 2 - 1;
        this.endY = - ((e.clientY / this._domElement.clientHeight) * 2 - 1);

        let worldStart = new THREE.Vector3(this.startX, this.startY, 0);
        let worldEnd = new THREE.Vector3(this.endX, this.endY, 0);

        //screen to world matrix
        worldStart.applyMatrix4(camera.projectionMatrixInverse);
        worldEnd.applyMatrix4(camera.projectionMatrixInverse);

        //update sectionLine
        this.sectionLine.geometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute([worldStart.x, worldStart.y, worldStart.z, worldEnd.x, worldEnd.y, worldEnd.z], 3, false)
        );
        this.sectionLine.visible = true;

        this.computePlaneParameter(worldStart, worldEnd);
    }


    computePlaneParameter = (startPoint, endPoint) => {
        let camera = this._camera;
        camera.updateProjectionMatrix();

        //points rotated by camera world matrix (mouse control to change view angle)
        let rotationMatrix = new THREE.Matrix4().extractRotation(camera.matrixWorld);

        let worldStartPoint = startPoint.applyMatrix4(rotationMatrix);
        let worldEndPoint = endPoint.applyMatrix4(rotationMatrix);

        //tangent cross eyeVector to get plane normal
        let tangent = worldStartPoint.clone().sub(worldEndPoint);
        tangent.normalize();
        let eyeVector = new THREE.Vector3(camera.matrixWorld.elements[8], camera.matrixWorld.elements[9], camera.matrixWorld.elements[10]);
        eyeVector.normalize();

        this.planeNormal = tangent.clone().cross(eyeVector).normalize();
        this.planePoint = worldStartPoint.clone(); //point on plane
    }

    createPlane = () => {
        if (!this.planeNormal) return;
        if (!this.planePoint) return;
        const originPlaneNormal = new THREE.Vector3(0, 0, 1);

        //rotate plane from origin to sectionLine normal vector
        let quaternion = new THREE.Quaternion().setFromUnitVectors(originPlaneNormal, this.planeNormal);
        let matrix = new THREE.Matrix4().makeRotationFromQuaternion(quaternion);

        //move plane position to mesh center projected point on plane
        let point = computeProjectPointOnPlane(this.planeNormal, this.planePoint, this.meshCenter);
        matrix.setPosition(point);

        const geometry = new THREE.BoxGeometry(this.planeSize, this.planeSize, 0.05); //create a thinness plane
        const material = new THREE.MeshBasicMaterial({ color: this.sectionPlaneColor, transparent: true, opacity: 0.2 });
        const plane = new THREE.Mesh(geometry, material);

        plane.matrix = matrix;
        plane.matrixAutoUpdate = false;
        plane.matrixWorldNeedsUpdate = true;
        plane.name = this.planeName;

        this._scene.add(plane);
    }

    removePlane = () => {
        let scene = this._scene;
        let object = scene.getObjectByName(this.planeName);
        if (object) {
            object.geometry.dispose();
            scene.remove(object);
        }
    }
}

export default CutPlaneControl;