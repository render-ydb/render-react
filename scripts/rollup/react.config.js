import path from 'path';
import { getPkgJson, resolvePkgPath, getBaseRollupPlugins } from "../utils";
import generatePackageJson from 'rollup-plugin-generate-package-json';


const { name, module } = getPkgJson("react");

// react包路径
const pkgPath = resolvePkgPath(name);
// react产物路径
const pkgDistPath = resolvePkgPath(name, true);

export default [
    {
        input: path.join(pkgPath, module),
        output: {
            file: path.join(pkgDistPath, 'index.js'),
            name: 'React',
            format: 'umd'
        },
        plugins:[
            ... getBaseRollupPlugins(),
            generatePackageJson({
                inputFolder:pkgPath,
                outputFolder:pkgDistPath,
                baseContents:({name,version,description})=>({
                    name,
                    description,
                    version,
                    main:'index.js'
                })
            })
        ]
    },
    {
        input: path.join(pkgPath, 'src/jsx.ts'),
        output: [
            {
                file: path.join(pkgDistPath, 'jsx-runtime.js'),
                name: 'jsx-runtime.js',
                format: 'umd'
            },
            {
                file: path.join(pkgDistPath, 'jsx-dev-runtime.js'),
                name: 'jsx-dev-runtime.js',
                format: 'umd'
            }
        ],
        plugins: getBaseRollupPlugins()
    }
]