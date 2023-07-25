import * as THREE from 'three';
import { getBoundarybox, geometryCenter } from '../tool/getBoundary';
import { computeProjectPointOnPlane } from '../tool/getPlaneProjection';

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

        this.selectionLine = new THREE.Line();

        this.planeSize = 100;
        this.meshCenter = null;
        this.planeName = 'sectionPlane';
        this.planeNormal = null;
        this.planePoint = null;

        this.addSelectionLine();
        this.addEvents();
    }

    setPlaneSize = (geometry, matrix) => {
        let box = getBoundarybox(geometry, matrix);
        let center = geometryCenter(geometry, matrix);
        if (box) {
            this.planeSize = box.max.distanceTo(box.min) + 0.5;
            this.meshCenter = center.clone();
        }
    }

    addEvents = () => {
        if (!this._domElement) return;
        this._domElement.addEventListener('pointerdown', this.pointerdown);
        this._domElement.addEventListener('pointerup', this.pointerup);
        this._domElement.addEventListener('pointermove', this.pointermove);
    }

    removeEvents = () => {
        if (!this._domElement) return;
        this._domElement.removeEventListener('pointerdown', this.pointerdown);
        this._domElement.removeEventListener('pointerup', this.pointerup);
        this._domElement.removeEventListener('pointermove', this.pointermove);
    }

    destroy = () => {
        this.removeEvents();
        this.removePlane();
        this.selectionLine = undefined;
    }

    addSelectionLine = () => {
        if (!this._camera) return;
        this.selectionLine.material.color.set(0x000000).convertSRGBToLinear();
        this.selectionLine.renderOrder = 1;
        this.selectionLine.position.z = - 0.2;
        this.selectionLine.depthTest = false;
        this.selectionLine.scale.setScalar(1);
        this._camera.add(this.selectionLine);
    }

    pointerdown = (e) => {
        this.startX = (e.clientX / this._domElement.clientWidth) * 2 - 1;
        this.startY = - ((e.clientY / this._domElement.clientHeight) * 2 - 1);
        this.dragging = true;
    }

    pointerup = (e) => {
        this.selectionLine.visible = false;
        this.dragging = false;
        this.removePlane();
        this.createPlane();
        console.log('normal', this.planeNormal);
        console.log('point', this.planePoint);
    }

    pointermove = (e) => {
        if (!this.dragging) return;
        if ((1 & e.buttons) === 0) return;

        let camera = this._camera;
        camera.updateProjectionMatrix();

        this.endX = (e.clientX / this._domElement.clientWidth) * 2 - 1;
        this.endY = - ((e.clientY / this._domElement.clientHeight) * 2 - 1);

        let worldStart = new THREE.Vector3(this.startX, this.startY, 0);
        let worldEnd = new THREE.Vector3(this.endX, this.endY, 0);

        worldStart.applyMatrix4(camera.projectionMatrixInverse);
        worldEnd.applyMatrix4(camera.projectionMatrixInverse);

        this.selectionLine.geometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute([worldStart.x, worldStart.y, worldStart.z, worldEnd.x, worldEnd.y, worldEnd.z], 3, false)
        );
        this.selectionLine.visible = true;

        this.computePlaneParameter(worldStart, worldEnd);
    }


    computePlaneParameter = (startPoint, endPoint) => {
        let camera = this._camera;
        camera.updateProjectionMatrix();

        let rotationMatrix = new THREE.Matrix4().extractRotation(camera.matrixWorld);

        let worldStartPoint = startPoint.applyMatrix4(rotationMatrix);
        let worldEndPoint = endPoint.applyMatrix4(rotationMatrix);

        let tangent = worldStartPoint.clone().sub(worldEndPoint);
        tangent.normalize();
        let eyeVector = new THREE.Vector3(camera.matrixWorld.elements[8], camera.matrixWorld.elements[9], camera.matrixWorld.elements[10]);
        eyeVector.normalize();

        this.planeNormal = tangent.clone().cross(eyeVector).normalize();
        this.planePoint = worldStartPoint.clone();
    }

    createPlane = () => {
        if (!this.planeNormal) return;
        if (!this.planePoint) return;
        const originPlaneNormal = new THREE.Vector3(0, 0, 1);

        let quaternion = new THREE.Quaternion().setFromUnitVectors(originPlaneNormal, this.planeNormal);
        let matrix = new THREE.Matrix4().makeRotationFromQuaternion(quaternion);

        let point = computeProjectPointOnPlane(this.planeNormal, this.planePoint, this.meshCenter);

        matrix.setPosition(point);

        const geometry = new THREE.BoxGeometry(this.planeSize, this.planeSize, 0.05);
        const material = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2 });
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