import path from 'path';
import { getPkgJson, resolvePkgPath, getBaseRollupPlugins } from "../utils";
import generatePackageJson from 'rollup-plugin-generate-package-json';
import alias from "@rollup/plugin-alias";


const { name, module,peerDependencies } = getPkgJson("react-dom");

// react-dom包路径
const pkgPath = resolvePkgPath(name);
// react-dom产物路径
const pkgDistPath = resolvePkgPath(name, true);

export default [
    {
        input: path.join(pkgPath, module),
        output: [
            {
                file: path.join(pkgDistPath, 'index.js'),
                name: 'ReactDom',
                format: 'umd'
            },
            {
                file: path.join(pkgDistPath, 'clinet.js'),
                name: 'clinet',
                format: 'umd'
            }
        ],
        external: [...Object.keys(peerDependencies),'react'],
        plugins: [
            ...getBaseRollupPlugins(),
            alias({
                entries: {
                    hostConfig: path.join(pkgPath,'src/hostConfig.ts')
                }
            }),
            generatePackageJson({
                inputFolder: pkgPath,
                outputFolder: pkgDistPath,
                baseContents: ({ name, version, description }) => ({
                    name,
                    description,
                    version,
                    main: 'index.js',
                    peerDependencies: {
                        react:version
                    },
                })
            })
        ]
    },
    {
        input: path.join(pkgPath, 'test-utils.ts'),
        output: [
            {
                file: path.join(pkgDistPath, 'test-utils.js'),
                name: 'test-utils',
                format: 'umd'
            },
        ],
        external: ['react-dom','react'],
        plugins: [
            ...getBaseRollupPlugins(),
        ]
    }
]