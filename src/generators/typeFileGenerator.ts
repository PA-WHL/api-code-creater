import type {GeneratorConfig} from "../index";
import {ApiDocData, DataObject} from "../parsers";
import {writeFileByTemplate} from "../util/util";

export type TypeFileData = {
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
         * api类型数据列表
         */
        typeDataList: TypeData[],


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
        namespaceId: string
    },
}

export type TypeData = {
    /**
     * api类型名
     */
    typeName: string,
    /**
     * api类型的应用位置（ request | response ）
     */
    in: string,
    /**
     * api类型中存在的所有属性
     */
    props: TypeProp[]
}

export type TypeProp = {
    /**
     * 属性名
     */
    name: string,
    /**
     * 属性类型（ts中对参数的类型标识，如 param1:number）
     */
    type: string,
    /**
     * 属性是否必须
     */
    required: boolean,
    /**
     * 属性的文档描述（属性注释）
     */
    description?: string,
}

export class TypeFileGenerator {
    private config: GeneratorConfig;
    private apiDocData: ApiDocData;

    constructor(config: GeneratorConfig, apiDocData: ApiDocData) {
        this.config = config;
        this.apiDocData = apiDocData;
    }

    out() {
        const outFileNames: string[] = [];
        const typeFileData: TypeFileData = {
            fileName: "",
            templateName: "",
            templateData: {
                typeDataList: [],
                typeScope: this.geTypeScope(),
                namespaceId: this.config.namespaceId
            }
        };
        // console.log("typeScope = " + JSON.stringify(this.geTypeScope()))
        typeFileData.fileName = `typings.d.ts`;
        typeFileData.templateName = "api-types";
        const refNames = Object.keys(this.apiDocData.refRecords);
        // console.log(refNames)
        refNames.forEach(refName => {
            let typeName = refName;
            const inLocation = refName.split("_")[1];
            const props: TypeProp[] = [];
            this.apiDocData.refRecords[refName].forEach(dataObject => {
                const name = "" + dataObject.name;
                const type = this.getPropType(typeName, dataObject);
                const required = !!dataObject.required;
                const description = dataObject.description;

                props.push({name, type, required, description})
            })

            // 按配置提供的修正规则，完成指定类名的修正
            // typeName = this.fixTypeName(typeName);

            typeFileData.templateData.typeDataList.push({
                typeName, in: inLocation, props
            });
        })

        // 按配置提供的修正规则，完成模板类型数据的修正
        typeFileData.templateData.typeDataList = this.fixTypeDataList(typeFileData.templateData.typeDataList);

        // 排序
        typeFileData.templateData.typeDataList = this.sort(typeFileData.templateData.typeDataList );

        // console.log(typeFileData.templateData.typeDataList)
        writeFileByTemplate(
            "" + this.config.outputDirPath, typeFileData.fileName,
            "" + this.config.templatesFolder, typeFileData.templateName,
            typeFileData.templateData
        )
        outFileNames.push(typeFileData.fileName);
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

    private getPropType(typeName: string, dataObject: DataObject) {
        const ref = dataObject.ref;
        let propType = 'undefined';
        if (ref) {
            propType = ref;
        } else if (dataObject.type) {
            propType = dataObject.type;
        }
        // 泛型模式下，若类名包含通用返回类，则将统一用'Type'表示其下属性的引用类型
        if (this.config.funTypeMode === 'generics' && this.config.commonReturnTypes.find(crt => typeName.includes(crt))) {
            if (!propType.endsWith('[]')) {
                if (!['number', 'string', 'boolean'].includes(propType)) {
                    propType = 'Type';
                }
            } else {
                if (!['number[]', 'string[]', 'boolean[]'].includes(propType)) {
                    propType = 'Type';
                }
            }
        }
        return propType;
    }


    /**
     * 排序
     * @param typeDataList
     */
    private sort(typeDataList: TypeData[]) {
        const temp: Set<TypeData> = new Set([]);
        // 按已有的排序规则 前置 列表中对应元素
        this.config.typeSortRules.forEach(rule => {
            // console.log(rule)
            if (typeof rule === 'string') {
                // 完全匹配
                typeDataList.forEach(typeData => {
                    if (typeData.typeName === rule && !temp.has(typeData)) {
                        temp.add(typeData);
                    }
                })
            } else {
                // 正则匹配
                typeDataList.forEach(typeData => {
                    // 若存在相同匹配对象，以前置规则为准
                    // if (typeData.typeName.search(rule) !== -1 && !temp.has(typeData)) {
                    //    temp.add(typeData);
                    //}
                    // 若存在相同匹配对象，以后置规则为准
                    if (typeData.typeName.search(rule) !== -1) {
                        // console.log(typeData.typeName)
                        if (temp.has(typeData)) {
                            temp.delete(typeData);
                        }
                        temp.add(typeData);
                    }

                })
            }
        })
        // 剩下元素 按原来顺序排序
        typeDataList.forEach(funData => {
            if (!temp.has(funData)) {
                temp.add(funData);
            }
        })
        typeDataList = [...temp];
        return typeDataList;
    }

    /**
     * 修正类型数据列表
     * @param typeDataList
     */
    private fixTypeDataList(typeDataList: TypeData[]) {
        // 泛型模式
        if (this.config.funTypeMode === 'generics') {
            // 基于通用类进行泛型处理
            const commonReturnTypes = this.config.commonReturnTypes;
            if (commonReturnTypes && commonReturnTypes.length > 0) {
                // 每个前缀包含通用类型名的类型，直接设为: `通用类型<Type>`
                typeDataList.forEach(typeData => {
                    commonReturnTypes.forEach(commonType => {
                        let typeName = typeData.typeName;
                        commonReturnTypes.forEach(commonType => {
                            if (typeName.startsWith(commonType)) {
                                typeData.typeName = commonType + "<Type>";
                            }
                        })
                    })
                })
            }

            // 修正类型名
            typeDataList.forEach(typeData => {
                typeData.typeName = this.fixTypeName(typeData.typeName);
            })

            // 去重
            let temp: TypeData[] = [];
            typeDataList.forEach(typeData => {
                if (!temp.find(td => td.typeName === typeData.typeName)) {
                    temp.push(typeData);
                }
            })
            typeDataList = temp;
        }

        return typeDataList;
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
}