import type {
    UserListParam,
    CommonResult,
    CommonPage,
    User,
    UserInfoResult,
    UserRegisterParam,
    UserUpdatePasswordParam,
    UserLoginParam,
    UserLoginResult,
    Role,
    UserAllocRolesParam
} from './typings';
import request from '@/utils/request';

/**
* 获取指定用户信息
* @param id 用户id
*/
export function getUser(id:number):Promise<CommonResult<User>> {
    return request({
        url: `/user/${id}`,
        method: 'get'
    })
}

/**
* 根据用户名或姓名分页获取用户列表
* @param params UserListParam
*/
export function listUsers(params:UserListParam):Promise<CommonResult<CommonPage<User>>> {
    return request({
        url: `/user/list`,
        method: 'get',
        params: params
    })
}

/**
* 获取指定用户的角色
* @param userId 用户id
*/
export function listRoles(userId:number):Promise<CommonResult<Role>> {
    return request({
        url: `/user/listRoles/${userId}`,
        method: 'get'
    })
}

/**
* 修改指定用户密码
* @param data UserUpdatePasswordParam
*/
export function updatePassword(data:UserUpdatePasswordParam):Promise<CommonResult> {
    return request({
        url: `/user/updatePassword`,
        method: 'post',
        data: data
    })
}

/**
* 修改指定用户信息
* @param id   用户id
* @param data User
*/
export function updateUser(id:number,data:User):Promise<CommonResult> {
    return request({
        url: `/user/update/${id}`,
        method: 'post',
        data: data
    })
}

/**
* 删除指定用户信息
* @param id 用户id
*/
export function deleteUser(id:number):Promise<CommonResult> {
    return request({
        url: `/user/delete/${id}`,
        method: 'post'
    })
}

/**
* 给用户分配角色
* @param userId  用户id
* @param data UserAllocRolesParam
*/
export function allocRoles(userId:number,data:UserAllocRolesParam):Promise<CommonResult> {
    return request({
        url: `/user/allocRoles/${userId}`,
        method: 'post',
        data: data
    })
}

/**
* 获取当前登录用户信息
*/
export function getUserInfo():Promise<CommonResult<UserInfoResult>> {
    return request({
        url: `/user/info`,
        method: 'get'
    })
}

/**
* 注册一个用户账号
* @param data UserRegisterParam
*/
export function register(data:UserRegisterParam):Promise<CommonResult<User>> {
    return request({
        url: `/user/register`,
        method: 'post',
        data: data
    })
}

/**
* 登录后返回Token
* @param data UserLoginParam
*/
export function login(data:UserLoginParam):Promise<CommonResult<UserLoginResult>> {
    return request({
        url: `/user/login`,
        method: 'post',
        data: data
    })
}

/**
* 刷新token
*/
export function refreshToken():Promise<CommonResult<UserLoginResult>> {
    return request({
        url: `/user/refreshToken`,
        method: 'post'
    })
}

/**
* 登出功能
*/
export function logout():Promise<CommonResult> {
    return request({
        url: `/user/logout`,
        method: 'post'
    })
}

