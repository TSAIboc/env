import './index.scss'
import Canvas from './Canvas';

import useEditor from '@useHook/useEditor';
import useCutPlane from '@useHook/useCutPlane';;

const CanvasDraw: React.FC = () => {
    const editor = useEditor('window1');
    let isLoaded = useCutPlane(editor, `/assets/scanmaxilla.stl`);

    return (
        <>
            {isLoaded ? <></> : <div className='loading' />}
            <Canvas
                id={'window1'}
                editor={editor}
            />
        </>
    )

}

export default CanvasDraw;