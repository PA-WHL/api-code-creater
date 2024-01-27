import type {
    Resource,
    CommonResult,
    ResourceListParam,
    CommonPage
} from './typings';
import request from '@/utils/request';

/**
* 添加后台资源
* @param data Resource
*/
export function addResource(data:Resource):Promise<CommonResult> {
    return request({
        url: `/resource/create`,
        method: 'post',
        data: data
    })
}

/**
* 根据ID获取资源详情
* @param id 资源id
*/
export function getResource(id:number):Promise<CommonResult<Resource>> {
    return request({
        url: `/resource/${id}`,
        method: 'get'
    })
}

/**
* 分页模糊查询后台资源
* @param params ResourceListParam
*/
export function listResources(params:ResourceListParam):Promise<CommonResult<CommonPage<Resource>>> {
    return request({
        url: `/resource/list`,
        method: 'get',
        params: params
    })
}

/**
* 查询所有后台资源
*/
export function listAllResources():Promise<CommonResult<Resource>> {
    return request({
        url: `/resource/listAll`,
        method: 'get'
    })
}

/**
* 修改后台资源
* @param id       资源id
* @param data Resource
*/
export function updateResource(id:number,data:Resource):Promise<CommonResult> {
    return request({
        url: `/resource/update/${id}`,
        method: 'post',
        data: data
    })
}

/**
* 根据ID删除后台资源
* @param id 资源id
*/
export function deleteResource(id:number):Promise<CommonResult> {
    return request({
        url: `/resource/delete/${id}`,
        method: 'post'
    })
}

