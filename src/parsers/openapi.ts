import type {
    OpenAPIObject,
    OperationObject,
    ParameterObject,
    ReferenceObject,
    RequestBodyObject,
    SchemaObject
} from "openapi3-ts/oas30";
import {ApiDocData, DataObject, GroupApiData, PathApiData} from "./index";

export interface ApiOperationObject extends OperationObject {
    path: string;
    method: string;
}

export class OpenapiParser {
    private openAPIObject: OpenAPIObject;
    private apiDocData: ApiDocData;
    private apiOperationRecords: Record<string, ApiOperationObject[]>;
    private refRecords: Record<string, DataObject[]>;

    constructor(openAPIObject: OpenAPIObject) {
        this.openAPIObject = openAPIObject;

        // ======================== 进行解析 ========================
        // 解析获得 所有存在的 引用类型 - refRecords
        this.refRecords = {};
        const schemas = this.openAPIObject.components?.schemas;
        if (schemas) {
            const schemaKeys = Object.keys(schemas);
            schemaKeys.forEach(schemaKey => {
                const schema = schemas[schemaKey] as SchemaObject;

                const props = schema.properties;
                const requiredProps = schema.required;
                if (props) {
                    // if (!refDataObjectList[schemaKey]) {
                    //     refDataObjectList[schemaKey]= [];
                    // }

                    const propNames = Object.keys(props);
                    propNames.forEach(propName => {
                        let prop = props[propName];

                        const name = propName;
                        prop = prop as SchemaObject;
                        const type = this.getSchemaType(prop);
                        const required = requiredProps?.includes(propName);
                        const description = prop.description;

                        // @ts-ignore
                        const ref = prop.$ref?.split("/")[3];

                        if (!this.refRecords[schemaKey]) {
                            this.refRecords[schemaKey] = [];
                        }
                        this.refRecords[schemaKey].push({name, type, required, description, ref})
                    })
                }
            })
        }
        // 解析获得 groupApiDataList
        const pathKeys = Object.keys(openAPIObject.paths || {});
        this.apiOperationRecords = {};
        pathKeys.forEach(pathKey => {
            const pathItem = openAPIObject.paths[pathKey];
            ['get', 'put', 'post', 'delete', 'patch'].forEach(method => {
                // @ts-ignore
                const operationObject: OperationObject = pathItem[method];
                if (!operationObject) {
                    return;
                }
                let tags = operationObject.tags;
                if (tags) {
                    tags.forEach((tag) => {
                        if (!this.apiOperationRecords[tag]) {
                            this.apiOperationRecords[tag] = [];
                        }
                        // 按 tag 标记的 Controller，分类存放 相应的 api接口数据（path 、 method、 选项）
                        this.apiOperationRecords[tag].push(
                            Object.assign({path: `${pathKey}`, method}, operationObject)
                        );
                    });
                }
            })
        });
        const groupApiDataList = this.getGroupApiData();

        this.apiDocData = {refRecords: this.refRecords, groupApiDataList};
    }

    getApiDocData() {
        return this.apiDocData;
    }

    getGroupApiData() {
        const operationKeys = Object.keys(this.apiOperationRecords);
        let groupKeys: string[] = [];
        let groupApiDataList: GroupApiData[] = [];


        operationKeys.forEach(operationKey => {
            const groupName = this.apiOperationRecords[operationKey][0].path.split('/')[1].trim();
            // @ts-ignore
            const groupDescription = this.openAPIObject.tags?.find(tag => tag.name === operationKey).description;

            const pathApiDataList: PathApiData[] = [];
            this.apiOperationRecords[operationKey].forEach(api => {
                const path = api.path;
                const method = api.method;
                const requestData = this.getRequestData(api);
                const responseData = this.getResponseData(api);
                const description = api.summary;
                pathApiDataList.push({path, method, requestData, responseData, description});
            })
            groupApiDataList.push({groupName, groupDescription, pathApiDataList});
        })
        return groupApiDataList;
    }

    getRequestData(api: ApiOperationObject): {
        pathVariables?: DataObject[],
        queryParams?: DataObject[],
        bodyData?: {
            contentType?: string,
            contentData?: DataObject
        }
    } {
        const paramRecords = this.getParamRecords(api.parameters);

        // const queryParams = paramRecords['query'];
        // const pathParams = paramRecords['path'];
        // const headerParams = paramRecords['header'];
        // const cookieParams = paramRecords['cookie'];

        // 路径变量
        const pathVariables = paramRecords['path'];
        // 查询参数
        const queryParams = paramRecords['query'];
        // body数据
        // @ts-ignore
        const contentType = this.getContentType(api);
        // @ts-ignore
        const contentData = this.getContentData(api, contentType, queryParams);

        return {pathVariables, queryParams, bodyData: {contentType, contentData}}
    }

    getContentType(api: ApiOperationObject) {
        // @ts-ignore
        const content = api.requestBody?.content;
        if (content) {
            return Object.keys(content)[0];
        }
        return undefined;
    }

    getContentData(api: ApiOperationObject, contentType: string, queryParams: DataObject[]): DataObject | undefined {
        // @ts-ignore
        const content = api.requestBody?.content;
        if (content && contentType) {
            const ref = content[contentType]?.schema?.$ref;
            if (ref) {
                // 内容为一个映射类型对象
                const refName = ref.split("/")[3];
                if (refName) {
                    // 存在映射
                    const isRefRecord = this.refRecords[refName] ? refName.endsWith('request') : false;
                    if (isRefRecord) {
                        return {name: "refName", type: "object", required: true, ref: refName};
                    }
                }
            } else {
                // 内容为一个指定类型对象
                let type = content[contentType]?.schema?.type;
                if (type) {
                    const schema = content[contentType]?.schema as SchemaObject;
                    const type = schema.type;
                    if (type) {
                        const schemaType = this.getSchemaType(schema);

                        return {name: "objName", type: schemaType, required: true};
                    }
                }
            }
        }
        return undefined;
    }

    getResponseData(api: ApiOperationObject): DataObject {
        const ref = api.responses["200"].content["*/*"].schema.$ref.split("/")[3]

        return {name: ref, type: "object", required: true, ref};
    }

    getParamRecords(parameters?: (ParameterObject | ReferenceObject)[]) {
        let paramRecords: Record<string, DataObject[]> = {};
        parameters?.forEach(op => {
            op = op as ParameterObject;
            const name = op.name;
            // @ts-ignore
            const type = this.getParameterObjectType(op);
            const required = op.required;
            const description = op.description;
            // "query" | "header" | "path" | "cookie";
            if (!paramRecords[op.in]) {
                paramRecords[op.in] = [];
            }
            paramRecords[op.in].push({name, type, required, description})
        })
        return paramRecords;
    }

    getParameterObjectType(op: ParameterObject) {
        // @ts-ignore
        let type = '' + op.schema.type;
        if (type === 'integer') {
            type = 'number';
        }
        // if(type === 'array'){
        //     // @ts-ignore
        //     const itemType = op.schema?.items?.type;
        //     if(itemType){
        //         type = itemType + '[]'
        //     }
        //     type = 'object[]'
        // }
        return type;
    }

    getSchemaType(schema: SchemaObject) {
        let type = '' + schema.type;
        if (type === 'integer') {
            type = 'number';
        }
        if (type === 'array') {
            if (schema.items) {
                // @ts-ignore
                const itemType = schema.items.type;
                if (itemType) {
                    type = itemType + '[]'
                }
                // @ts-ignore
                const ref = schema.items.$ref;
                if (ref) {
                    const refType = ref.split('/')[3];
                    if (refType) {
                        type = refType + '[]'
                    }
                }
            }
        }
        return type;
    }
}