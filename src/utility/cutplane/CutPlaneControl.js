import { Vector3, Matrix4, Quaternion, Mesh } from 'three';
import { getBoundarybox, getGeometryCenter } from '../tool/getBoundary';
import { computeProjectPointOnPlane } from '../tool/getPlaneProjection';
import { drawDoubleSideText, drawTriangle, drawRectriangle, drawCone, drawPoint, drawFatDashLine, drawFatLine } from '../draw/draw'
import * as THREE from 'three'
import { cursor } from './cursor-base64';

/**
 * create plane mesh : plane、draw line、plane direction hint and initial style
 */
class createPlaneMesh {
    constructor(domElement , scene){
        this._scene = scene;
        this._domElement = domElement;

        this.initPointMesh = null;
        this.initLineMesh = null;
        this.initPlaneMesh = null;

        this.planeName = '';
        this.planeColor = 0xFFA41E;
        this.planeSize = 100;
    }

    setPlaneProperty = ( planeName , planeColor , planeSize = 100 )=>{
        this.planeName = planeName;
        this.planeColor = planeColor;
        this.planeSize = planeSize;
    }
    
    initLine = ()=>{
        const defaultPositions = [0, 0, 0, 0, 0, 1];
        const resolution = new THREE.Vector2(this._domElement.clientWidth, this._domElement.clientHeight);

        let line = drawFatLine(defaultPositions, this.planeColor, resolution);
        line.name = 'line';

        let dashLine = drawFatDashLine(defaultPositions, 0x000000, resolution);
        dashLine.name = 'dashline';

        let initPoints = drawPoint(new THREE.Vector3(), this.planeColor, 0.4);
        initPoints.visible = false;

        let initArrow = drawCone(0x000000);
        initArrow.name = 'arrow';
        initArrow.matrixAutoUpdate = false;
        initArrow.matrixWorldNeedsUpdate = true;

        let group = new THREE.Object3D();
        group.add(line).add(dashLine).add(initArrow);
        group.renderOrder = 1;
        group.position.z = - 0.2;
        group.depthTest = false;
        group.scale.setScalar(1);
        group.visible = false;

        this.initPointMesh = initPoints;
        this.initLineMesh = group;
    }

    initPlane = ()=>{
        let size = this.planeSize * 0.2 - 0.4;
        const pointa = new Vector3(-size * 0.5, 0,);
        const pointb = new Vector3(size * 0.5, 0, 0);
        const pointc = new Vector3(0, size * 0.3, 0);
        let mesh = drawTriangle(pointa, pointb, pointc , this.planeColor);
        let group = new THREE.Object3D();
        group.add(mesh);
        drawDoubleSideText(group, 'Part1', 0xffffff, size / 7, 0.2 / 76 * this.planeSize, '/assets/helvetiker_regular.typeface.json', this.initTriangleHintToPlane);
    }

    initTriangleHintToPlane = (triangle_with_text_group) => {
        let halfEdge = this.planeSize * 0.5;
        //+y
        let ytriangle = triangle_with_text_group.clone();
        let xmatrix = new Matrix4().makeRotationX(Math.PI / 2);
        let yTranslation = new THREE.Matrix4().makeTranslation(0, halfEdge, 0);
        ytriangle.matrix = yTranslation.multiply(xmatrix);
        ytriangle.matrixAutoUpdate = false;
        ytriangle.matrixWorldNeedsUpdate = true;

        //-y
        let ytriangle_n = ytriangle.clone()
        ytriangle_n.matrix = ytriangle.matrix.clone();
        ytriangle_n.matrix.setPosition(0, -halfEdge, 0);
        ytriangle_n.matrixAutoUpdate = false;
        ytriangle_n.matrixWorldNeedsUpdate = true;

        //+x
        let xtriangle = triangle_with_text_group.clone();
        let zmatrix = new Matrix4().makeRotationY(Math.PI / 2);
        let xTranslation = new THREE.Matrix4().makeTranslation(halfEdge, 0, 0);
        let matrix = xTranslation.clone().multiply(xmatrix).multiply(zmatrix);
        xtriangle.matrix = matrix;
        xtriangle.matrixAutoUpdate = false;
        xtriangle.matrixWorldNeedsUpdate = true;

        //-x
        let xtriangle_n = xtriangle.clone()
        xtriangle_n.matrix = xtriangle.matrix.clone();
        xtriangle_n.matrix.setPosition(-halfEdge, 0, 0);
        xtriangle_n.matrixAutoUpdate = false;
        xtriangle_n.matrixWorldNeedsUpdate = true;

        const triangleTextGroup = new THREE.Object3D();
        triangleTextGroup.add(ytriangle).add(ytriangle_n).add(xtriangle).add(xtriangle_n);

        //add plane
        const geometry = new THREE.PlaneGeometry(this.planeSize, this.planeSize);
        const material = new THREE.MeshBasicMaterial({ color: this.planeColor, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
        const plane = new Mesh(geometry, material);

        //add plane outline
        let outline = drawRectriangle(
            new THREE.Vector3(halfEdge, halfEdge, 0),
            new THREE.Vector3(-halfEdge, halfEdge, 0),
            new THREE.Vector3(-halfEdge, -halfEdge, 0),
            new THREE.Vector3(halfEdge, -halfEdge, 0),
            this.planeColor,
            0.08 / 76 * this.planeSize
        );

        let clipPlane = new THREE.Object3D();
        clipPlane.add(plane)
            .add(triangleTextGroup)
            .add(outline);

        clipPlane.matrixAutoUpdate = false;
        clipPlane.matrixWorldNeedsUpdate = true;
        clipPlane.name = this.planeName;
        clipPlane.visible = false;

        this.initPlaneMesh = clipPlane;
        if(this._scene) this._scene.add(this.initPlaneMesh);
    }

    updateInitLine = (worldStart, worldEnd)=>{
        if(!this.initLineMesh) return;
        //update initLine
        this.initLineMesh.children.forEach((el) => {
            if (el.name == 'line' || el.name == 'dashline' ) {
                el.geometry.setPositions([worldStart.x, worldStart.y, worldStart.z, worldEnd.x, worldEnd.y, worldEnd.z]);
                el.computeLineDistances();
            }
            else {
                const initVector = new THREE.Vector3(0, 1, 0);
                const tangent = worldEnd.clone().sub(worldStart);
                tangent.normalize();
                let quaternion = new Quaternion().setFromUnitVectors(initVector, tangent);
                let matrix = new Matrix4().makeRotationFromQuaternion(quaternion);
                matrix.setPosition(worldEnd.x, worldEnd.y, worldEnd.z);
                el.matrix = matrix;
            }
        })
        this.initLineMesh.visible = true;
    }

    updateInitPoint = ( _startX, _startY , _camera )=>{
        if(!this.initPointMesh) return;
        let worldStart = new THREE.Vector3(_startX, _startY, 0);
        worldStart.applyMatrix4(_camera.projectionMatrixInverse);
        this.initPointMesh.position.set(worldStart.x, worldStart.y, worldStart.z);
        this.initPointMesh.visible = true;
    }

    updateInitPlane = ( normal , planePassPoint , offsetCenter  )=>{
        if (!planePassPoint.a) return;
        const originPlaneNormal = new Vector3(0, 0, 1);

        //rotate plane from origin to sectionLine normal vector
        let quaternion = new Quaternion().setFromUnitVectors(originPlaneNormal, normal);
        let matrix = new Matrix4().makeRotationFromQuaternion(quaternion);

        //move plane position to mesh center projected point on plane
        let point = computeProjectPointOnPlane(normal, planePassPoint.a, offsetCenter);
        matrix.setPosition(point);

        planePassPoint.c = point.clone();
        this.initPlaneMesh.visible = true;
        if (this.initPlaneMesh) this.initPlaneMesh.matrix = matrix;
    }
}

/**
 * Using mouse left button to draw a line on screen and crate a section plane on scene
 * plane parameter : a point on plane and plane normal vector 
 */
class CutPlaneControl {
    constructor(camera, scene, domElement) {
        this._camera = camera;
        this._scene = scene;
        this._domElement = domElement;

        if (domElement === undefined) {
            console.warn('CutPlaneControl: The third parameter "domElement" is now mandatory.');
            this._domElement = document;
        }

        this.startX = -Infinity;
        this.startY = -Infinity;

        this.endX = -Infinity;
        this.endY = -Infinity;

        this.dragging = false;

        this.meshCenter = new Vector3();
        this.planeName = 'sectionPlane';
        this.planeNormal = null;
        this.planePassPoint = {//a plane passing through 3 points
            a: null,
            b: null,
            c: null
        }

        this._planeMesh = null;
        this.initSectionLine();
        this.initCursor();
        this.addEvents();
    }

    //limit plane size by mesh boundarybox size
    setPlane = ( meshProperty , color = 0x000000) => {
        const { geometry , matrix } = meshProperty;
        if(!geometry) return;
        let box = getBoundarybox(geometry, matrix);
        let center = getGeometryCenter(geometry, matrix);

        let size = 100;
        if (box) {
            size = box.max.distanceTo(box.min) + 0.5; //error value
            this.meshCenter = center.clone();
        }
        if(this._planeMesh){
            this._planeMesh.setPlaneProperty(this.planeName, color ,size );
            this._planeMesh.initPlane();
        }
    }

    setLineColor = (color , dashColor) => {
        const re = /^[a-fA-F0-9]+$/;
        if (re.test(color) && (color === +color)){
            if(!this._planeMesh) return;
            const { initLineMesh , initPointMesh } = this._planeMesh;
            initLineMesh.children.forEach((el)=>{
                const _color = el.name == 'line' ? color : dashColor;
                el.material.color.set(_color).convertSRGBToLinear();
            })
            initPointMesh.material.color.set(color).convertSRGBToLinear();
        }
    }

    getPlaneParameter = () => {
        return {
            'normal': this.planeNormal,
            'planePassPoint': this.planePassPoint
        }
    }

    addEvents = () => {
        this._domElement.addEventListener('pointerdown', this.onPointerdown);
        this._domElement.addEventListener('pointerup', this.onPointerup);
        this._domElement.addEventListener('pointermove', this.onPointermove);
    }

    removeEvents = () => {
        this._domElement.removeEventListener('pointerdown', this.onPointerdown);
        this._domElement.removeEventListener('pointerup', this.onPointerup);
        this._domElement.removeEventListener('pointermove', this.onPointermove);
    }

    destoryPlane = () => {
        this.removePlane();
        this.planeNormal = null;
        this.planePassPoint = {
            a: null,
            b: null,
            c: null
        }
    }

    dispose = () => {
        this.removeEvents();
        this.destoryPlane();
        if (!this._planeMesh) return;
        const { initLine } = this._planeMesh;
        if (!initLine) return;
        if (initLine.geometry) initLine.geometry.dispose();
        if (initLine.material) initLine.material.dispose();
        this._camera.remove(initLine);
        
    }

    onPointerdown = (e) => {
        if (e.button != 0) return;
        this.startX = (e.clientX / this._domElement.clientWidth) * 2 - 1;
        this.startY = - ((e.clientY / this._domElement.clientHeight) * 2 - 1);
        this.dragging = true;
        if(this._planeMesh) this._planeMesh.updateInitPoint(  this.startX  ,   this.startY , this._camera );
    }

    onPointerup = (e) => {
        this.dragging = false;
        if (e.button != 0) return;
        if(!this._planeMesh) return;

        const { initLineMesh , initPointMesh , initPlaneMesh } = this._planeMesh;

        if(initLineMesh) initLineMesh.visible = false;
        if(initPointMesh) initPointMesh.visible = false;
        if(initPlaneMesh) {
            this._planeMesh.updateInitPlane( this.planeNormal , this.planePassPoint , this.meshCenter);
        }   
    }

    onPointermove = (e) => {
        if ((1 & e.buttons) === 0) return;
        if (!this.dragging) return;
        if (!this._planeMesh) return;

        let camera = this._camera;
        camera.updateProjectionMatrix();

        this.endX = (e.clientX / this._domElement.clientWidth) * 2 - 1;
        this.endY = - ((e.clientY / this._domElement.clientHeight) * 2 - 1);

        let worldStart = new Vector3(this.startX, this.startY, 0);
        let worldEnd = new Vector3(this.endX, this.endY, 0);

        //screen to world matrix
        worldStart.applyMatrix4(camera.projectionMatrixInverse);
        worldEnd.applyMatrix4(camera.projectionMatrixInverse);

        this._planeMesh.updateInitLine(worldStart, worldEnd)
        this.updatePlaneParameter(worldStart, worldEnd);
    }

    updatePlaneParameter = (startPoint, endPoint) => {
        let camera = this._camera;
        camera.updateProjectionMatrix();

        //points rotated by camera world matrix (mouse control to change view angle)
        let rotationMatrix = camera.matrixWorld;

        let worldStartPoint = startPoint.applyMatrix4(rotationMatrix);
        let worldEndPoint = endPoint.applyMatrix4(rotationMatrix);

        //tangent cross eyeVector to get plane normal
        let tangent = worldStartPoint.clone().sub(worldEndPoint);
        tangent.normalize();
        let eyeVector = new Vector3(camera.matrixWorld.elements[8], camera.matrixWorld.elements[9], camera.matrixWorld.elements[10]);
        eyeVector.normalize();

        this.planeNormal = tangent.clone().cross(eyeVector).normalize();
        this.planePassPoint.a = worldStartPoint.clone(); //point on plane
        this.planePassPoint.b = worldEndPoint.clone();
    }

    //draw line on camera
    initSectionLine = () => {
        if (!this._camera) return;
        if(!this._planeMesh){
            const _plane = new createPlaneMesh( this._domElement , this._scene );
            _plane.initLine();
            this._planeMesh = _plane;
            const { initPointMesh , initLineMesh} = this._planeMesh;
            this._camera.add(initPointMesh);
            this._camera.add(initLineMesh);
        }
    }

    initCursor = ()=>{
        let a = document.getElementsByTagName("canvas")[0];
        a.style.cursor = cursor;
    }

    removePlane = () => {
        let scene = this._scene;
        let object = scene.getObjectByName(this.planeName);
        if (object) {
            if (object.geometry) object.geometry.dispose();
            if (object.material) object.material.dispose();
            scene.remove(object);
        }
    }
}
export default CutPlaneControl;