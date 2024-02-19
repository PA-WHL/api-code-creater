import type {
    CommonResult,
    Resource,
    RoleDeleteListParam,
    Role,
    RoleListParam,
    CommonPage,
    RoleAllocResourcesParam
} from './typings';
// @ts-ignore
import request from '@/utils/request';

/**
* 添加角色
* @param data Role
*/
export function addRole(data:Role):Promise<CommonResult> {
    return request({
        url: `/role/create`,
        method: 'post',
        data: data
    })
}

/**
* 获取角色相关资源
* @param roleId 角色id
*/
export function listResources(roleId:number):Promise<CommonResult<Resource[]>> {
    return request({
        url: `/role/listResources/${roleId}`,
        method: 'get'
    })
}

/**
* 根据角色名称分页获取角色列表
* @param params RoleListParam
*/
export function listRoles(params:RoleListParam):Promise<CommonResult<CommonPage<Role[]>>> {
    return request({
        url: `/role/list`,
        method: 'get',
        params: params
    })
}

/**
* 获取所有角色
*/
export function listAllRoles():Promise<CommonResult<Role[]>> {
    return request({
        url: `/role/listAll`,
        method: 'get'
    })
}

/**
* 修改角色
* @param id 角色id
* @param data Role
*/
export function updateRole(id:number,data:Role):Promise<CommonResult> {
    return request({
        url: `/role/update/${id}`,
        method: 'post',
        data: data
    })
}

/**
* 删除角色
* @param id 角色id
*/
export function deleteRole(id:number):Promise<CommonResult> {
    return request({
        url: `/role/delete/${id}`,
        method: 'post'
    })
}

/**
* 批量删除角色
* @param data RoleDeleteListParam
*/
export function deleteRoleList(data:RoleDeleteListParam):Promise<CommonResult> {
    return request({
        url: `/role/deleteList`,
        method: 'post',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        data: data
    })
}

/**
* 给角色分配资源
* @param data RoleAllocResourcesParam
*/
export function allocResources(data:RoleAllocResourcesParam):Promise<CommonResult> {
    return request({
        url: `/role/allocResources`,
        method: 'post',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        data: data
    })
}

