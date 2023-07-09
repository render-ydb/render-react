import path from 'path';
import fs from 'fs';
import cjs from '@rollup/plugin-commonjs';
import ts from 'rollup-plugin-typescript2'
import replace from '@rollup/plugin-replace';

const pkgPath = path.resolve(process.cwd(), 'packages');
const distPath = path.resolve(process.cwd(), 'dist/node_modules');

export const resolvePkgPath = (pkgName, isDist) => {
    return isDist
        ? `${path.join(distPath, pkgName)}`
        : `${path.join(pkgPath, pkgName)}`
}

export const getPkgJson = pkgName => {
    const _path = path.join(resolvePkgPath(pkgName), 'package.json');
    return JSON.parse(fs.readFileSync(_path, { encoding: "utf-8" }))

}

export const getBaseRollupPlugins = (
    alias = {
        __DEV__: true
    },
    { typescript = {} } = {}
) => {
    return [replace(alias), cjs(), ts(typescript)]
}