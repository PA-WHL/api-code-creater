// const {generateService, NameConversionTool} = require('api-code-gen');
const {generateService, NameConversionTool} = require('../dist');
const path = require("path");
const {toCapitalize} = NameConversionTool;

generateService({
    inputFilePath: path.join(__dirname, './openapi.json'),
    outputDirPath: path.join(__dirname, './src/api'),
    // templatesFolder: ".\\dist\\templates",

    // funFileHeads: ["import request from './utils/request';"],
    funParamMode: "simple",
    funTypeMode: "generics",
    commonReturnTypes: ['CommonResult', 'CommonPage'],
    typeScope: "module",
    // typeScope: "namespace",
    // namespaceId: "API",
    // typeScope: "global",

    funNameFixRules: [
        {target: "{id}", replaceValue: (groupName) => "get"+ toCapitalize(groupName)},
        {target: "info", replaceValue: () => "getUserInfo"},
        {target: "create", replaceValue: (groupName) => "add" + toCapitalize(groupName)},
        {target: "list", replaceValue: (groupName) => "list" + toCapitalize(groupName) + 's'},
        {target: "listAll", replaceValue: (groupName) => "listAll" + toCapitalize(groupName) + 's'},
        {target: "update", replaceValue: (groupName) => "update" + toCapitalize(groupName)},
        {target: "delete", replaceValue: (groupName) => "delete" + toCapitalize(groupName)},
        {target: "deleteList", replaceValue: (groupName) => "delete" + toCapitalize(groupName) + "List"},
    ],
    typeNameFixRules: [
        {target: /_request/, replaceValue: () =>  ''},
        {target: /_response/, replaceValue: () =>  ''},
        {target: /<>/, replaceValue: () =>  ''},
        {target: /<Type>/, replaceValue: () =>  '<Type={}>'},
        {target: /<List/, replaceValue: () =>  '<'},
    ],

    funSortRules: [/^add/, /^get(?!UserInfo)/, /^list/, /^listAll/, /^update/, /^delete/, /^delete[a-zA-Z]+List$/, /^alloc/],
    typeSortRules: [/^Common/, /Param$/, /Result$/],
})