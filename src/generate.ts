import Handlebars from "handlebars";
// const template = import('Template.precompiled.js');
import {readFileSync, writeFileSync, mkdirSync, promises} from "fs";
import {join, dirname, basename} from "path";
import _ from 'lodash';

const ICONS_SOURCE_DIR = "flowbite-icons/src";
const VUE_COMPONENTS_OUTPUT_DIR = "src/components/icons";

async function* walk(dir) {
    for await (const d of await promises.opendir(dir)) {
        const entry = join(dir, d.name);
        if (d.isDirectory()) yield* walk(entry);
        else if (d.isFile()) yield entry;
    }
}

const buf = readFileSync("src/Template.handlebars", {encoding: 'utf8'});
let template = Handlebars.compile(buf);

console.log("generating icon components...");
for await(const path: string of walk(ICONS_SOURCE_DIR)) {
    if (!path.endsWith('.svg')) {
        console.log(path, 'not an svg file, skipping...');
        continue;
    }

    let svg = readFileSync(path, 'utf8');
    const vueFileContent = template({
        svg: svg
    });

    const relativeIconPath = dirname(path).substring(ICONS_SOURCE_DIR.length);
    const iconName = _.startCase(_.camelCase(basename(path, '.svg'))).replace(/ /g, '');
    const outputPath = `${VUE_COMPONENTS_OUTPUT_DIR}${relativeIconPath}/${iconName}.vue`;
    mkdirSync(dirname(outputPath), {recursive:true});
    writeFileSync(outputPath, vueFileContent);
}