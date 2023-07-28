import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';

export const drawTriangle = (pointa, pointb, pointc, color = 0xFFA41E) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute([
            pointa.x, pointa.y, pointa.z,
            pointb.x, pointb.y, pointb.z,
            pointc.x, pointc.y, pointc.z
        ], 3, false)
    );
    const material = new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
}

export const drawDoubleSideText = (group, text, color, size, offset, path, callback) => {
    const loader = new FontLoader();
    loader.load(path, (font) => {
        const geometry = new TextGeometry(text, {
            font: font,
            size: size,
            height: 0.005,
            curveSegments: 12,
        });
        geometry.computeBoundingBox();
        geometry.translate(-geometry.boundingBox.max.x * 0.5, offset, 0.001)
        const material = new THREE.MeshPhongMaterial({
            color: color,
            flatShading: true,
        });
        const mesh = new THREE.Mesh(geometry, material);

        let copyText = mesh.clone();
        copyText.rotation.y = Math.PI;

        group.add(copyText);
        group.add(mesh);

        if (callback) callback(group);
    });
}

export const drawTubeLine = (points, color, lineWidth = 0.08) => {
    const fittedCurve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(fittedCurve, 5, lineWidth, 8);
    const material = new THREE.MeshPhongMaterial({ color: color });
    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
}

export const drawRectriangle = (pointa, pointb, pointc, pointd, color = 0x000000, lineWidth = 0.08) => {
    const edgea = drawTubeLine([pointa, pointb], color, lineWidth);
    const edgeb = drawTubeLine([pointb, pointc], color, lineWidth);
    const edgec = drawTubeLine([pointc, pointd], color, lineWidth);
    const edged = drawTubeLine([pointd, pointa], color, lineWidth);
    const group = new THREE.Object3D();
    group.add(edgeb)
        .add(edgea)
        .add(edgec)
        .add(edged);
    return group;
}

export const drawDashLine = (points, color = 0x000000) => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineDashedMaterial({
        color: color,
        linewidth: 10,
        scale: 1,
        dashSize: 0.6,
        gapSize: 0.4,
        transparent: true,
        opacity: 0.9
    });
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    return line;
}

export const drawLine = (points, color = 0x000000) => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
        color: color,
        linewidth: 20,
    });
    const line = new THREE.Line(geometry, material);
    return line;
}


export const drawFatLine = (positions, color, resolution) => {
    const geometry = new LineGeometry();
    geometry.setPositions(positions);
    const matrial = new LineMaterial({
        color: color,
        resolution: resolution,
        dashed: false,
        linewidth: 1.8
    });
    const line = new Line2(geometry, matrial);
    line.computeLineDistances();
    return line;
}

export const drawFatDashLine = (positions, color, resolution) => {
    const geometry = new LineGeometry();
    geometry.setPositions(positions);
    const matrial = new LineMaterial({
        color: color,
        resolution: resolution,
        dashed: true,
        linewidth: 1.8,
        transparent: true,
        opacity: 0.95,
        dashSize: 0.7,
        gapSize: 0.6,
    });
    const line = new Line2(geometry, matrial);
    line.computeLineDistances();
    return line;
}

export const drawPoints = (points, color = 0x000000, radius = 0.1) => {
    const object = new THREE.Object3D();
    let i = 0;
    while (i < points.length) {
        let point = points[i];
        const geometry = new THREE.SphereGeometry(radius, 32, 16);
        const material = new THREE.MeshBasicMaterial({ color: color });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(point.x, point.y, point.z);
        object.add(sphere);
        ++i;
    }
    return object;
}


export const drawPoint = (point, color = 0x000000, radius = 0.1) => {
    const geometry = new THREE.SphereGeometry(radius, 32, 16);
    const material = new THREE.MeshBasicMaterial({ color: color });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(point.x, point.y, point.z);
    return sphere;
}

export const drawCone = (color) => {
    let geometry = new THREE.ConeGeometry(0.3, 0.7, 32, 10, false, 5, 7);
    const material = new THREE.MeshPhongMaterial({
        color: color,
        flatShading: true,
    });
    let matrix = new THREE.Matrix4().makeTranslation(0, -0.3,0);
    geometry.applyMatrix4(matrix);
    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
}


