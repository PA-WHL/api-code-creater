export type ApiDocData = {
    /**
     * 所有存在的 引用类型
     */
    refRecords: Record<string, DataObject[]>,
    /**
     * 所有按组划分存在的 api数据
     */
    groupApiDataList: GroupApiData[]
}

export type GroupApiData = {
    /**
     * 组名（对应后端的Controller）
     */
    groupName: string,
    /**
     * 组描述（对应后端Controller的文档描述）
     */
    groupDescription?: string,
    /**
     * 组中存在的所有url路径数据
     */
    pathApiDataList: PathApiData[]
}

export type PathApiData = {
    /**
     * url路径名（支持路径变量的URL映射路径）
     */
    path: string,
    /**
     * url路径的请求方法（即 get、post...）
     */
    method: string,
    requestData: {
        pathVariables?: DataObject[],
        queryParams?: DataObject[],
        bodyData?: {
            contentType?: string,
            contentData?: DataObject
        }
    },
    responseData: DataObject,
    /**
     * url路径的描述
     */
    description?: string,
}

export type DataObject = {
    /**
     * 数据键名
     */
    name?: string,
    /**
     * 数据类型（ts中对参数对象的类型标识，如 param1:number）
     */
    type?: string,
    /**
     * 数据是否必须
     */
    required?: boolean,
    /**
     * 数据的文档描述（属性注释）
     */
    description?: string,


    /**
     * 若该对象实际为引用对象，此为对应存在的映射类型名
     */
    ref?: string,

}