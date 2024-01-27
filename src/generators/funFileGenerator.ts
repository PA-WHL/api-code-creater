import {ApiDocData, DataObject, GroupApiData, PathApiData} from "../parsers";
import {writeFileByTemplate} from "../util/util";
import {GeneratorConfig} from "../index";


export type FunFileData = {
    /**
     * 文件名
     */
    fileName: string,
    /**
     * 模板名（基于哪个模板生成该文件）
     */
    templateName: string,

    /**
     * 模板数据（为模板提供需要的数据）
     */
    templateData: {
        /**
         * 公共函数文件头
         */
        funFileHeads?: string[]
        /**
         * api函数数据列表
         */
        funDataList: FunData[],
        /**
         * 函数需要的所有导入类型
         */
        funImportTypeList?: string[],

        /**
         * 类型作用域
         *
         * <li>启用模块类型模式：{enableModule:true}
         * <li>启用命名空间类型模式：{enableNamespace:true}
         * <li>启用全局类型模式：{enableGlobal:true}
         */
        typeScope: {
            enableModule?: boolean,
            enableNamespace?: boolean,
            enableGlobal?: boolean
        },
        /**
         * 命名空间类型模式下，所有生成类型所在的命名空间名
         */
        namespaceId: string,

        /**
         * 函数是否处于简洁参数模式
         */
        isParamSimple?: boolean,
    },
}

export type FunData = {
    /**
     * api函数名
     */
    functionName: string,
    /**
     * api函数对应的功能描述（文档注释）
     */
    functionDescription?: string,
    /**
     * api函数的参数列表
     */
    functionParamList: FunParam[],
    /**
     * api函数的返回值类型（ts中对函数返回值的类型标识，如 param1:number）
     */
    functionReturnType?: string

    /**
     * 函数对应请求的url访问路径
     */
    url: string,
    /**
     * 函数对应请求的method
     */
    method: string,
    /**
     * 函数对应请求的url路径参数
     */
    pathVariables?: FunParam[],
    /**
     * 函数对应请求的查询参数
     */
    queryParams?: FunParam[],
    /**
     * 函数对应请求的body参数
     */
    bodyData?: FunParam[],
}

export type FunParam = {
    /**
     * 参数名
     */
    name?: string,
    /**
     * 参数类型（ts中对参数的类型标识，如 param1:number）
     */
    type?: string,
    /**
     * 参数是否必须
     */
    required?: boolean,
    /**
     * 参数的文档描述（参数注释）
     */
    description?: string,

    /**
     * 参数类型是否为引用类型
     */
    isRefType?: boolean
}

export class FunFileGenerator {
    private config: GeneratorConfig;
    private apiDocData: ApiDocData;
    private typeNameMap: Map<string, string>;

    constructor(config: GeneratorConfig, apiDocData: ApiDocData) {
        this.config = config;
        this.apiDocData = apiDocData;

        // 初始化加载生成 refName-typeName 映射关系表
        this.typeNameMap = new Map<string, string>();
        Object.keys(apiDocData.refRecords).forEach(refName => {
            let typeName = refName;
            if (this.config.funTypeMode === 'generics') {
                typeName = this.toGenericsByCommonReturnTypes(typeName);
            }
            typeName = this.fixTypeName(typeName);
            // this.typeNameMap.set(typeName, refName);
            this.typeNameMap.set(refName, typeName);
        })
    }

    private toGenericsByCommonReturnTypes(typeName: string) {
        // 基于通用类进行泛型处理
        // 每个前缀包含通用类型名的类型，直接设为: `通用类型<XXX>`
        const commonReturnTypes = this.config.commonReturnTypes;
        commonReturnTypes.forEach(commonType => {
            if (typeName.startsWith(commonType)) {
                typeName = typeName.replace(commonType, commonType + "<") + ">";
            }
        })
        if (commonReturnTypes.length > 1) {
            const target = commonReturnTypes.join('<');
            if (typeName.startsWith(target)) {
                typeName = typeName.replace(target, target + "<") + ">";
            }
        }
        return typeName;
    }

    /**
     * 输出相关的api调用函数文件
     */
    out() {
        const outFileNames: string[] = [];
        this.apiDocData.groupApiDataList.forEach(groupApiData => {
            const funFileData: FunFileData = {
                fileName: "",
                templateName: "",
                templateData: {
                    funFileHeads: this.config.funFileHeads,
                    funDataList: [],
                    funImportTypeList: [],
                    typeScope: this.geTypeScope(),
                    namespaceId: this.config.namespaceId,
                    isParamSimple: this.config.funParamMode === 'simple'
                }
            };

            funFileData.fileName = `${groupApiData.groupName}.ts`;
            funFileData.templateName = "api-funs";
            groupApiData.pathApiDataList.forEach(pathApiData => {
                let functionName = this.getFunctionName(pathApiData);
                const functionDescription = pathApiData.description;
                let functionParamList = this.getFunctionParamList(pathApiData);
                let functionReturnType = this.getFunctionReturnType(pathApiData);

                const url = this.getUrl(pathApiData);
                const method = pathApiData.method;
                const pathVariables = this.getPathVariables(pathApiData);
                const queryParams = this.getQueryParams(pathApiData);
                const bodyData = this.getBodyData(pathApiData);

                // 按配置提供的修正规则，完成指定函数名的修正
                functionName = this.fixFunctionName(groupApiData, functionName);
                // 按配置提供的修正规则，完成指定函数类型的修正
                const fixFunctionType = this.fixFunctionType(functionParamList, functionReturnType);
                functionParamList = fixFunctionType.functionParamList;
                functionReturnType = fixFunctionType.functionReturnType;

                funFileData.templateData.funDataList.push({
                    functionName, functionDescription, functionParamList, functionReturnType,
                    url, method, pathVariables, queryParams, bodyData
                });
            })
            funFileData.templateData.funImportTypeList = this.getFunImportTypeList(funFileData);

            // 排序
            funFileData.templateData.funDataList = this.sort(funFileData.templateData.funDataList);

            writeFileByTemplate(
                "" + this.config.outputDirPath, funFileData.fileName,
                "" + this.config.templatesFolder, funFileData.templateName,
                funFileData.templateData
            );
            outFileNames.push(funFileData.fileName);
        })
        return outFileNames;
    }

    private geTypeScope() {
        const typeScope = this.config.typeScope;
        switch (typeScope) {
            case undefined :
                return {enableModule: true}
            case "module":
                return {enableModule: true}
            case "namespace":
                return {enableNamespace: true}
            case "global":
                return {enableGlobal: true}
        }
    }

    private getFunctionName(pathApiData: PathApiData) {
        return pathApiData.path.split('/')[2]
    }

    private getFunctionParamList(pathApiData: PathApiData) {
        let functionParamList: FunParam[] = [];

        const pathVariables = this.getPathVariables(pathApiData);
        if (pathVariables) {
            functionParamList = [...functionParamList, ...pathVariables]
        }
        const queryParams = this.getQueryParams(pathApiData);
        if (queryParams) {
            functionParamList = [...functionParamList, ...queryParams]
        }
        const bodyData = this.getBodyData(pathApiData);
        if (bodyData) {
            functionParamList = [...functionParamList, ...bodyData]
        }

        return functionParamList;
    }

    private getFunctionReturnType(pathApiData: PathApiData) {
        let type = pathApiData.responseData.ref;
        type = this.typeNameMap.get(type);
        return type;
    }

    private getUrl(pathApiData: PathApiData) {
        return pathApiData.path.replace('{', '${');
    }

    private getPathVariables(pathApiData: PathApiData) {
        let funParamList: FunParam[] = [];
        pathApiData.requestData.pathVariables?.forEach(dataObject => {
            funParamList.push(this.toFunParam(dataObject));
        })
        return funParamList.length > 0 ? funParamList : undefined;
    }

    private getQueryParams(pathApiData: PathApiData) {
        let funParamList: FunParam[] = [];


        if (pathApiData.method === 'get') {
            // 函数参数
            if (this.config.funParamMode !== 'simple') {
                // 默认参数模式下，查询参数直接作为函数参数
                pathApiData.requestData.queryParams?.forEach(dataObject => {
                    funParamList.push(this.toFunParam(dataObject));
                })

            } else {
                // 简洁参数模式下，查询参数组成一个函数参数
                const name = "params";
                // 不存在映射, 查询参数封装成一个映射类型
                const queryParams = pathApiData.requestData.queryParams;
                if (queryParams && queryParams.length > 0) {
                    const refName = this.toRefRecordByQueryParams(pathApiData)
                    funParamList.push({name, type: refName, required: true, isRefType: true});
                }
            }
        }

        return funParamList.length > 0 ? funParamList : undefined;
    }

    private getBodyData(pathApiData: PathApiData) {
        let funParamList: FunParam[] = [];

        // 存在body数据, 整体body对象作为一个函数参数
        const contentData = pathApiData.requestData.bodyData.contentData;
        if (contentData) {
            const name = this.config.funParamMode !== 'simple' ? "obj" : "data";
            // 内容为一个映射类型对象
            const ref = contentData.ref;
            // console.log(pathApiData.path + " ref = " + ref)
            if (ref) {
                funParamList.push({name, type: ref, required: true, isRefType: true});
            }
            // 内容为一个指定类型对象
            else if (contentData.type) {
                funParamList.push({name, type: contentData.type, required: true});
            }
        }
        // 存在查询参数
        if (pathApiData.method !== 'get') {
            if (this.config.funParamMode !== 'simple') {
                // 默认参数模式下，查询参数直接作为函数参数
                pathApiData.requestData.queryParams?.forEach(dataObject => {
                    funParamList.push(this.toFunParam(dataObject));
                })
            } else {
                // 简洁参数模式下，查询参数组成一个函数参数
                const name = funParamList.find(fp =>fp.name==='data') ? "data2" : "data";
                // 不存在映射, 查询参数封装成一个映射类型
                const queryParams = pathApiData.requestData.queryParams;
                if (queryParams && queryParams.length > 0) {
                    const refName = this.toRefRecordByQueryParams(pathApiData);
                    funParamList.push({name, type: refName, required: true, isRefType: true});
                }
            }
        }

        // 若同时存在 body数据 与 查询参数
        if (funParamList.length > 1 && funParamList.find(fd=>fd.name==="obj"|| fd.name==="data")) {
            // 这里直接报错，建议重新规范接口参数
            throw new Error(pathApiData.path + "接口请求同时存在body数据 与 查询参数！建议联系后端修改！")
        }


        return funParamList.length > 0 ? funParamList : undefined;
    }

    private getFunImportTypeList(funFileData: FunFileData) {
        let importTypes: string[] = [];

        const typeNameArr: string[] = [];
        for (const value of this.typeNameMap.values()) {
            typeNameArr.push(value);
        }
        // 首先获得文件中所有函数的使用类型（参数类型 + 返回值类型）
        const allTypes: string[] = [];
        const funDataList = funFileData.templateData.funDataList;
        funDataList.forEach(funData => {
            // 参数类型
            funData.functionParamList.forEach(funParam => {
                allTypes.push(funParam.type);
            })
            // 返回值类型
            if (this.config.funTypeMode !== 'generics') {
                // 默认类型模式下，直接使用返回类型
                allTypes.push(funData.functionReturnType);
            } else {
                // 泛型类型模式下，需分解返回类型，得到使用的通用返回类型 + 泛型变量类型
                const functionReturnType = funData.functionReturnType;
                const commonReturnTypes = this.config.commonReturnTypes;
                let remainingPart = functionReturnType;
                commonReturnTypes.forEach(commonType => {
                    if (functionReturnType.includes(commonType)) {
                        allTypes.push(commonType);
                        if (remainingPart.includes(commonType + '<') && remainingPart.endsWith('>')) {
                            remainingPart = remainingPart.substring(0, remainingPart.length - 1).replace(commonType + "<", '');
                        }
                    }
                })
                // 剩余部分 存在 对应映射类型，则为 泛型变量类型，需添加
                if (typeNameArr.includes(remainingPart)) {
                    allTypes.push(remainingPart);
                }

            }
        })

        // 过滤掉常规类型 与 重复类型，仅保留单一存在的映射类型与泛型模式下使用的通用返回类
        allTypes.forEach(typeName => {
            // 记录中的映射类型
            if (typeNameArr.includes(typeName) && !importTypes.includes(typeName)) {
                importTypes.push(typeName);
            }
            // 泛型模式下的通用返回类型
            if (this.config.funTypeMode === 'generics') {
                if (this.config.commonReturnTypes.includes(typeName) && !importTypes.includes(typeName)) {
                    importTypes.push(typeName);
                }
            }

        })

        return importTypes;
    }

    /**
     * 排序
     * @param funDataList
     */
    private sort(funDataList: FunData[]) {
        const temp: Set<FunData> = new Set([]);
        // 按已有的排序规则 置顶 列表中对应元素
        this.config.funSortRules.forEach(rule => {
            // console.log(rule)
            if (typeof rule === 'string') {
                // 完全匹配
                funDataList.forEach(funData => {
                    if (funData.functionName === rule && !temp.has(funData)) {
                        temp.add(funData);
                    }
                })
            } else {
                // 正则匹配
                funDataList.forEach(funData => {
                    // 若存在相同匹配对象，以前置规则为准
                    // if (funData.functionName.search(rule) !== -1 && !temp.has(funData)) {
                    //    temp.add(funData);
                    //}
                    // 若存在相同匹配对象，以后置规则为准
                    if (funData.functionName.search(rule) !== -1) {
                        // console.log(funData.functionName)
                        if (temp.has(funData)) {
                            temp.delete(funData);
                        }
                        temp.add(funData);
                    }

                })
            }
        })
        // 剩下元素 按原来顺序排序
        funDataList.forEach(funData => {
            if (!temp.has(funData)) {
                temp.add(funData);
            }
        })
        funDataList = [...temp];
        return funDataList;
    }

    /**
     * 修正函数类型（参数映射类型 + 返回值类型）
     * @param functionParamList
     * @param functionReturnType
     */
    private fixFunctionType(functionParamList: FunParam[], functionReturnType: string) {
        functionParamList.forEach(funParam => {
            if (funParam.isRefType) {
                funParam.type = this.fixTypeName(funParam.type);
            }
        })
        functionReturnType = this.fixTypeName(functionReturnType);

        return {functionParamList, functionReturnType};
    }


    /**
     * 修正类型名
     * @param typeName
     */
    private fixTypeName(typeName: string) {
        const typeNameFixRules = this.config.typeNameFixRules;
        if (typeNameFixRules && typeNameFixRules.length > 0) {
            typeNameFixRules.forEach(rule => {
                if (typeof rule.target === 'string') {
                    // 完全匹配
                    // console.log(typeof rule.target, typeName, rule.replaceValue(typeName))
                    if (typeName === rule.target) {
                        typeName = rule.replaceValue(typeName)
                    }

                } else {
                    // 正则匹配
                    typeName = typeName.replace(rule.target, rule.replaceValue(typeName))
                }

            })
        }
        return typeName;
    }


    /**
     * 修正函数名
     * @param groupApiData
     * @param functionName
     */
    private fixFunctionName(groupApiData: GroupApiData, functionName: string) {
        const funNameFixRules = this.config.funNameFixRules;
        if (funNameFixRules && funNameFixRules.length > 0) {
            funNameFixRules.forEach(rule => {
                const groupName = groupApiData.groupName;
                // 完全匹配
                if (typeof rule.target === 'string') {
                    // console.log(typeof rule.target, functionName, rule.replaceValue(groupName))
                    if (functionName === rule.target) {
                        functionName = rule.replaceValue(groupName)
                    }

                } else {
                    functionName = functionName.replace(rule.target, rule.replaceValue(groupName))
                }

            })
        }
        return functionName;
    }

    /**
     * 将查询参数转成一个新的映射类型记录
     * @param pathApiData
     */
    private toRefRecordByQueryParams(pathApiData: PathApiData) {
        const refName = pathApiData.path.replace("#/", '').split('/')
            .filter(item => !(item.includes('{') || item.includes('}')))
            .map(item => item.substring(0, 1).toUpperCase() + item.substring(1, item.length))
            .join('') + 'Param';

        if (!this.apiDocData.refRecords[refName]) {
            this.apiDocData.refRecords[refName] = [];
            pathApiData.requestData.queryParams?.forEach(dataObject => {
                this.apiDocData.refRecords[refName].push(dataObject);
                this.typeNameMap.set(refName, refName);
            })
        }

        return refName;
    }

    /**
     * 转成FunParam类型
     *
     * @param dataObject 解析api文档获得的数据对象类型
     */
    private toFunParam(dataObject: DataObject): FunParam {
        const name = dataObject.name;
        const type = dataObject.type;
        const required = dataObject.required;
        const description = dataObject.description;
        return {name, type, required, description}
    }


}