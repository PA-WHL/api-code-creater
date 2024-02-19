// const {generateService, NameConversionTool} = require('api-code-creater');
const {generateService, NameConversionTool} = require('../dist');
const path = require("path");
const {toCapitalize} = NameConversionTool;

generateService({
    inputFilePath: path.join(__dirname, './openapi.json'),
    outputDirPath: path.join(__dirname, './src/api'),
    // templatesFolder: ".\\dist\\templates",

    // genMode: 'ts',
    // funFileHeads: ["import request from './utils/request';"],
    funParamMode: "simple",
    funTypeMode: "generics",
    commonReturnTypes: ['CommonResult', 'CommonPage'],
    typeScope: "module",
    // typeScope: "namespace",
    // namespaceId: "API",
    // typeScope: "global",
    // showContentTypes: ['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data'],

    funNameFixRules: [
        {target: "{id}", replaceValue: (groupName) => "get" + toCapitalize(groupName)},                     // {id} => getXxx
        {target: "info", replaceValue: () => "getUserInfo"},                                                // info => getUserInfo
        {target: "create", replaceValue: (groupName) => "add" + toCapitalize(groupName)},                   // create => addXxx
        {target: "list", replaceValue: (groupName) => "list" + toCapitalize(groupName) + 's'},              // list => listXxxs
        {target: "listAll", replaceValue: (groupName) => "listAll" + toCapitalize(groupName) + 's'},        // listAll => listAllXxxs
        {target: "update", replaceValue: (groupName) => "update" + toCapitalize(groupName)},                // update => updateXxx
        {target: "delete", replaceValue: (groupName) => "delete" + toCapitalize(groupName)},                // delete => deleteXxx
        {target: "deleteList", replaceValue: (groupName) => "delete" + toCapitalize(groupName) + "List"},   // deleteList => deleteXxxList
    ],
    typeNameFixRules: [
        {target: /_request/, replaceValue: () => ''},                       // Xxx_request => Xxx
        {target: /_response/, replaceValue: () => ''},                      // Xxx_response => Xxx
        {target: /<>/, replaceValue: () => ''},                             // Xxx<> => Xxx
        {target: /<Type>/, replaceValue: () => '<Type={}>'},                // Xxx<Type> => Xxx<Type={}> ， 也即让 CommonResult 能直接使用不带泛型变量
        {target: /(?<=List[a-zA-Z]+)>/, replaceValue: () => '[]>'},         // Xxx<ListYyy> => Xxx<ListYyy[]> ， 为达到 Xxx<ListYyy> => Xxx<Yyy[]> 的必要步骤1
        {target: /<List/, replaceValue: () => '<'},                         // Xxx<ListYyy[]> => Xxx<Yyy[]> ， 为达到 Xxx<ListYyy> => Xxx<Yyy[]> 的必要步骤2
        {target: /(?<=CommonPage<[a-zA-Z]+)>/, replaceValue: () => '[]>'},  // CommonPage<Yyy> => CommonPage<Yyy[]>
    ],

    funSortRules: [/^add/, /^get(?!UserInfo)/, /^list/, /^listAll/, /^update/, /^delete/, /^delete[a-zA-Z]+List$/, /^alloc/],
    typeSortRules: [/^Common/, /Param$/, /Result$/],
})