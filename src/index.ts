import {FunFileGenerator} from "./generators/funFileGenerator";
import {OpenapiParser} from "./parsers/openapi";
import {TypeFileGenerator} from "./generators/typeFileGenerator";
import * as path from 'path';
import {ApiDocData} from "./parsers";


export type GeneratorConfig = {
    //======================== 基础必须 ========================

    /**
     * 输入文件路径（后端Api文件的json文件的路径）
     */
    inputFilePath: string,
    /**
     * 输出目录路径（生成Api代码的存放目录）
     */
    outputDirPath: string,

    //======================== 自定义模板 ========================

    /**
     * 模板文件的查找目录路径
     */
    templatesFolder?: string,

    //======================== 代码生成样式 ========================

    /**
     * 生成模式
     *
     * <ul>
     * <li>'ts': 缺省默认的ts模式，会生成ts格式的 函数声明文件 与 类型声明文件
     * <li>'js': js模式，仅生成js格式的函数声明文件，此模式下后续一些关于类型的配置项会失效！
     * </ul>
     */
    genMode?: 'ts' | 'js',

    /**
     * 公共函数文件头
     * <li>缺省默认所有函数声明文件的头部存在语句`import request from '@/utils/request';`
     * <li>可自定义一条或多条语句替换默认语句
     * <li>设置多条语句时，按填写顺序在函数声明文件头部进行排序
     */
    funFileHeads?: string[],
    /**
     * 函数参数模式
     * <li>undefined | 'default': 默认模式，函数的参数会呈现所有
     * <li>'simple': 简洁模式，函数的参数会聚合为 路径参数、查询参数、body参数
     */
    funParamMode?: (undefined | 'default') | 'simple',
    /**
     * 函数类型模式
     * <li>undefined | 'default': 默认模式，函数的类型按文档中原类型进行显示
     * <li>'generics': 泛型模式，函数的类型会基于通用返回类型呈现泛型，需同步配置commonReturnTypes
     */
    funTypeMode?: (undefined | 'default') | 'generics',

    /**
     * 通用返回类型（用于 泛型模式 下，划分类型名）
     */
    commonReturnTypes?: string[],

    /**
     * 类型作用域（影响如何导入声明类型并使用的方式）
     * <ul>
     * <li>undefined | 'module': 缺省默认的模块类型模式，类型仅限导入其所在声明文件的模块使用
     * <li>'namespace': 命名空间类型模式，类型可全局通过指定命令空间调用（默认命名空间名为API，若需改动需自定义namespaceId值）
     * <li>'global': 全局类型模式，类型可全局调用，但需注意类型名全局唯一可能发生命名冲突（通常不建议使用！！！）
     * </ul>
     * 注：若为 namespace 或 global，其最终生成的类型声明文件需加入TypeScript编译，其他ts文件才能正常解析该文件中声明的全局类型
     */
    typeScope?: (undefined | 'module') | 'namespace' | 'global',
    /**
     * 全局唯一命名空间的标识名
     * <li>仅当typeScope=“namespace”时有效，代表 最终生成的类型 所在的命名空间
     * <li>缺省默认命名空间名为 ‘API’
     */
    namespaceId?: string,

    /**
     * 函数中被 允许显示（生成）的 Content-Type 请求头代码
     * <br><br>
     * 其存在如下一些可填值：
     * <ul>
     * <li>'application/json'
     * <li>'application/x-www-form-urlencoded'
     * <li>'multipart/form-data'
     * </ul>
     *
     * 注：缺省未明确设置的情况下，默认仅不允许显示 'application/json'，其他Content-Type都允许显示，即等同于 ['application/x-www-form-urlencoded', 'multipart/form-data']
     *
     * 注：函数中实际是否显示Content-Type 请求头代码，还要看是否请求携带body数据，无则不管怎样都不显示
     */
    showContentTypes?: ('application/json' |'application/x-www-form-urlencoded' | 'multipart/form-data')[]

    //======================== 名称修正处理 ========================

    /**
     * 针对函数名的一些修正规则
     * （注：模板加载前修正，即模板填充值为对应修正结果）
     */
    funNameFixRules?: {
        /**
         * 针对函数名的匹配目标字符串
         * <li>若为字符串时，执行完全匹配，指目标函数名所在的字符串对象
         * <li>若为RegExp对象时，执行正则匹配，仅指目标函数名中的匹配部分
         */
        target: string | RegExp,
        /**
         * 针对匹配目标字符串的替换值
         * <li>提供默认groupName参数代表目标函数所在的组名（注：同一url首路径划分为一组）
         */
        replaceValue: (groupName?: string) => string
    }[],
    /**
     * 针对类型名的一些修正规则
     * （注：模板加载前修正，即模板填充值为对应修正结果）
     */
    typeNameFixRules?: {
        /**
         * 针对类型名的配匹目标字符串
         * <li>若为string字符串时，执行完全匹配，指目标类型名所在的字符串对象
         * <li>若为RegExp对象时，执行正则匹配，仅指目标类型名中的匹配部分
         */
        target: string | RegExp,
        /**
         * 针对匹配目标字符串的替换值
         * <li>提供默认typeName参数代表目标类型所在的字符串名
         */
        replaceValue: (typeName?: string) => string
    }[]


    //======================== 数据排序处理 ========================

    /**
     * 针对函数名的一些函数数据排序规则
     * <li>排序数组的元素，可为具体函数名 字符串，也可为符合指定一定规则的函数名正则表达式
     * <li>排序数组的元素所代表的函数名，其数组序号越小 对应 生成的函数越靠前，也即前置排序
     * <li>排序数组的元素规则，若出现重复匹配，则以后置规则为准，即同名函数数据仅按最后一个规则进行排序
     */
    funSortRules?: (string | RegExp)[],
    /**
     * 针对类型名的一些类型数据排序规则
     * <li>排序数组的元素，可为具体类型名 字符串，也可为符合指定一定规则的类型名正则表达式
     * <li>排序数组的元素所代表的类型名，其数组序号越小 对应 生成的类型越靠前，也即前置排序
     * <li>排序数组的元素规则，若出现重复匹配，则以后置规则为准，即同名类型数据仅按最后一个规则进行排序
     */
    typeSortRules?: (string | RegExp)[],
}


/**
 * api代码生成器的启动服务
 * @param config
 */
export function generateService(config: GeneratorConfig) {
    const openAPIData = require(config.inputFilePath);
    // 一些配置项的缺省默认值
    if (!config.templatesFolder) {
        config.templatesFolder = path.join(__dirname, '../templates');
    }
    if (!config.genMode) {
        config.genMode = 'ts';
    }
    if (!config.funFileHeads) {
        config.funFileHeads = ["import request from '@/utils/request';"];
    }
    if (!config.namespaceId) {
        config.namespaceId = "API";
    }
    if (!config.showContentTypes) {
        config.showContentTypes = ['application/x-www-form-urlencoded', 'multipart/form-data']
    }
    // 解析后端提供的api文档
    let apiDocData: ApiDocData;
    try {
        apiDocData = new OpenapiParser(openAPIData).getApiDocData();
    } catch (e) {
        console.log("❌ 针对位于%s的api文档，解析失败！", config.inputFilePath);
        console.log(e);
    }
    if (apiDocData && apiDocData.groupApiDataList && apiDocData.groupApiDataList.length > 0) {
        console.log("✅ 针对位于%s的api文档，解析成功！", config.inputFilePath);
    }
    // 生成函数声明文件
    let outFunFileNames: string[];
    try {
        outFunFileNames = new FunFileGenerator(config, apiDocData).out();
    } catch (e) {
        console.log("❌ 生成函数声明文件失败！");
        console.log(e);
    }
    if (outFunFileNames && outFunFileNames.length > 0) {
        console.log("✅ 在%s目录下，成功生成函数声明文件：%s", config.outputDirPath, outFunFileNames);
    }
    // 生成类型声明文件
    if (config.genMode === 'ts') {
        let outTypeFileNames: string[];
        try {
            outTypeFileNames = new TypeFileGenerator(config, apiDocData).out();
        } catch (e) {
            console.log("❌ 生成类型声明文件失败！");
            console.log(e);
        }
        if (outTypeFileNames && outTypeFileNames.length > 0) {
            console.log("✅ 在%s目录下，成功生成类型声明文件：%s", config.outputDirPath, outTypeFileNames);
        }
    }


}


/**
 * 名称转换工具类
 */
export class NameConversionTool {

    /**
     * 转换字符串string首字母为大写，剩下为小写。
     * @param targetString 转换的目标字符串
     */
    static toCapitalize(targetString: string) {
        return targetString.substring(0, 1).toUpperCase() + targetString.substring(1, targetString.length);
    }

    /**
     * 转换字符串string的指定开头为泛型基础名，剩下为泛型变量名
     * @param targetString 转换的目标字符串
     * @param prefix 转为泛型基础名的前缀开头
     */
    static toGenerics(targetString: string, prefix: string) {
        if (targetString.startsWith(prefix)) {
            // return prefix +"<" + targetString.substring(prefix.length, targetString.length) + ">";
            return prefix.replace(prefix, prefix + "<") + ">";
        }

        return targetString
    }
}