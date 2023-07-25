import { Vector3, Matrix4 } from 'three';
export const getBoundarybox = (geometry, matrix = new Matrix4()) => {
    let max_x = -1000;
    let max_y = -1000;
    let max_z = -1000;
    let min_x = 1000;
    let min_y = 1000;
    let min_z = 1000;
    let position = geometry.getAttribute('position');
    if (!position) {
        return null;
    }
    for (let i = 0; i < position.count; i++) {
        let vertex = { x: position.getX(i), y: position.getY(i), z: position.getZ(i) };
        let vector3 = new Vector3(vertex.x, vertex.y, vertex.z);
        vector3.applyMatrix4(matrix);
        if (vector3.x > max_x) { max_x = vector3.x; }
        if (vector3.y > max_y) { max_y = vector3.y; }
        if (vector3.z > max_z) { max_z = vector3.z; }
        if (vector3.x < min_x) { min_x = vector3.x; }
        if (vector3.y < min_y) { min_y = vector3.y; }
        if (vector3.z < min_z) { min_z = vector3.z; }
    }
    let box = {
        'max': new Vector3(max_x, max_y, max_z),
        'min': new Vector3(min_x, min_y, min_z),
        'center': new Vector3((min_x + max_x) * 0.5, (min_y + max_y) * 0.5, (min_z + max_z) * 0.5),
    }
    return box;
}

export const getGeometryCenter = (geometry, matrix = new Matrix4()) => {
    let position = geometry.getAttribute('position');
    if (!position) {
        return null;
    }
    let x = 0, y = 0, z = 0;
    for (let i = 0; i < position.count; i++) {
        let vertex = { x: position.getX(i), y: position.getY(i), z: position.getZ(i) };
        let vector3 = new Vector3(vertex.x, vertex.y, vertex.z);
        vector3.applyMatrix4(matrix);
        x += vector3.x;
        y += vector3.y;
        z += vector3.z;
    }
    return new Vector3(x / position.count, y / position.count, z / position.count);
}