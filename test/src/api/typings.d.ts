export type CommonResult<Type={}> = {
    /** 状态码 */
    code?: number;
    /** 提示信息 */
    message?: string;
    /** 数据封装(object) */
    data?: Type;
}

export type CommonPage<Type={}> = {
    /** 当前页码 */
    pageNum?: number;
    /** 每页数量 */
    pageSize?: number;
    /** 总页数 */
    totalPage?: number;
    /** 总条数 */
    total?: number;
    /** 分页数据 */
    list?: Type;
}

export type UserLoginParam = {
    /** 用户名 */
    username: string;
    /** 密码 */
    password: string;
}

export type UserRegisterParam = {
    /** 用户名 */
    username: string;
    /** 密码 */
    password: string;
    /** 用户图标 */
    icon?: string;
    /** 邮箱 */
    email?: string;
    /** 用户昵称
Validate[max: 10; ] */
    nickname?: string;
    /** 备注
Validate[max: 100; ] */
    notes?: string;
}

export type UserUpdatePasswordParam = {
    /** 用户名 */
    username: string;
    /** 旧密码 */
    oldPassword: string;
    /** 新密码 */
    newPassword: string;
}

export type UserListParam = {
    /** 查询关键词 */
    keyword?: string;
    /** 分页显示的总页数，缺省默认5 */
    pageSize?: number;
    /** 分页显示的每页条目数，缺省默认1 */
    pageNum?: number;
}

export type UserAllocRolesParam = {
    /** 给该用户分配的所有角色id,[array of int64] */
    roleIds: object;
}

export type RoleDeleteListParam = {
    /** 角色id的列表,[array of int64] */
    ids: object;
}

export type RoleListParam = {
    /** 查询关键词 */
    keyword?: string;
    /** 分页显示的总页数，缺省默认5 */
    pageSize?: number;
    /** 分页显示的每页条目数，缺省默认1 */
    pageNum?: number;
}

export type RoleAllocResourcesParam = {
    /** 角色id */
    roleId: number;
    /** 资源id的列表,[array of int64] */
    resourceIds: object;
}

export type ResourceListParam = {
    /** 查询categoryId字段的关键词 */
    categoryId?: string;
    /** 查询name字段的关键词 */
    nameKeyword?: string;
    /** 查询url字段的关键词 */
    urlKeyword?: string;
    /** 分页显示的总页数，缺省默认5 */
    pageSize?: number;
    /** 分页显示的每页条目数，缺省默认1 */
    pageNum?: number;
}

export type UserLoginResult = {
    /** 后续访问时，需携带作为登录凭据的Token */
    token?: string;
    /** 后续访问时，需存在Authorization请求头且存放着tokenHead + token数据 */
    tokenHead?: string;
}

export type UserInfoResult = {
    /** 用户名 */
    username?: string;
    /** 用户图标 */
    icon?: string;
    /** 用户登录后可显示的菜单列表 */
    menus?: string;
    /** 用户担任的所有角色名 */
    roles?: string[];
}

export type Resource = {
    /** No comments found. */
    id?: number;
    /** 资源名 */
    name?: string;
    /** 资源URL */
    url?: string;
}

export type Role = {
    /** No comments found. */
    id?: number;
    /** 角色名 */
    name?: string;
    /** 描述 */
    description?: string;
}

export type User = {
    /** No comments found. */
    id?: number;
    /** 用户名 */
    username?: string;
    /** 密码（加密后的密文） */
    password?: string;
}

