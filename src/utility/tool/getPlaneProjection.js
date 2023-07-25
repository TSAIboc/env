import { Vector3 } from 'three';
export const computeProjectPointOnPlane = (normal, planePoint, spacePoint) => {
    let m = normal.x;
    let n = normal.y;
    let s = normal.z;

    let a = planePoint.x;
    let b = planePoint.y;
    let c = planePoint.z;

    let x0 = spacePoint.x;
    let y0 = spacePoint.y;
    let z0 = spacePoint.z;

    let t = -1 * ((m * (x0 - a) + n * (y0 - b) + s * (z0 - c)) / (m * m + n * n + s * s));
    let x = m * t + x0;
    let y = n * t + y0;
    let z = s * t + z0;
    return new Vector3(x, y, z);
}