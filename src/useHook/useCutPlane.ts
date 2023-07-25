import { Object3D } from 'three';
import { useEffect, useMemo, useState } from 'react';
import { Editor3D } from '@type/index';

import CutPlaneAction from '@utility/cutplane/CutPlaneAction';

const useCutPlane = (editor: Editor3D, path: string) => {
    const [cutModel, setcutModel] = useState<Object3D | null>(null);
    const cutplane: CutPlaneAction = useMemo(() => {
        return new CutPlaneAction();
    }, []);

    useEffect(() => {
        if (cutplane) {
            cutplane.setEnvironment(editor);
            cutplane.load(path, setcutModel);
        }
    }, [editor])

    return cutModel ? true : false;
}

export default useCutPlane;