import * as THREE from 'three';
import { ArcballControls } from 'three/examples/jsm/controls/ArcballControls';

export interface Editor3D {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera | null;
    control: ArcballControls | null;
    renderer: THREE.WebGLRenderer | null;
    container: HTMLElement | null;
    cameraDistance: number,
    initialize: (ref: HTMLElement | null) => void;
    remove: () => void;
    light: { scene: THREE.Object3D | null, camera: THREE.Object3D | null }
}