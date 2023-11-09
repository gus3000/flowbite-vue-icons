import Handlebars from "handlebars";
import {readFileSync, writeFileSync, mkdirSync, promises} from "fs";
import {join, dirname, basename, relative} from "path";
import _ from 'lodash';

const ICONS_SOURCE_DIR = "flowbite-icons/src/outline";
const VUE_COMPONENTS_OUTPUT_DIR = "src/components/icons";
const INDEX_TS_PATH = "src/index.ts";
const VUE_COMPONENTS_OUTPUT_DIR_RELATIVE_TO_INDEX = relative(dirname(INDEX_TS_PATH), VUE_COMPONENTS_OUTPUT_DIR);

Handlebars.registerHelper('iconName', function (aString) {
    return basename(aString, '.vue');
})

// console.log("relative components path :", VUE_COMPONENTS_OUTPUT_DIR_RELATIVE_TO_INDEX)
// process.exit();
async function* walk(dir) {
    for await (const d of await promises.opendir(dir)) {
        const entry = join(dir, d.name);
        if (d.isDirectory()) yield* walk(entry);
        else if (d.isFile()) yield entry;
    }
}

let vueTemplate = Handlebars.compile(
    readFileSync("src/SvgComponent.vue.handlebars", {encoding: 'utf8'})
);

console.log("generating icon components...");
let componentsRelativePaths: string[] = [];
for await(const path: string of walk(ICONS_SOURCE_DIR)) {
    if (!path.endsWith('.svg')) {
        console.log(path, 'not an svg file, skipping...');
        continue;
    }

    let svg = readFileSync(path, 'utf8');
    const vueFileContent = vueTemplate({
        svg: svg
    });

    const relativeIconPath = dirname(path).substring(ICONS_SOURCE_DIR.length);
    const iconName = _.startCase(_.camelCase(basename(path, '.svg'))).replace(/ /g, '') + 'Icon';
    const outputPath = `${VUE_COMPONENTS_OUTPUT_DIR}${relativeIconPath}/${iconName}.vue`;
    // console.log(outputPath);

    componentsRelativePaths.push(`${VUE_COMPONENTS_OUTPUT_DIR_RELATIVE_TO_INDEX}${relativeIconPath}/${iconName}.vue`);
    mkdirSync(dirname(outputPath), {recursive: true});
    writeFileSync(outputPath, vueFileContent);
}

let indexTemplate = Handlebars.compile(
    readFileSync("src/index.ts.handlebars", {encoding: 'utf8'})
);

writeFileSync(
    INDEX_TS_PATH,
    indexTemplate({
        'componentsRelativePaths': componentsRelativePaths
    })
);
