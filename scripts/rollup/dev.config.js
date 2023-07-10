import ReactDomConfig from "./react-dom.config";
import ReactConfig from './react.config';

export default ()=>{
    return [
        ...ReactDomConfig,
        ...ReactConfig
    ]
}