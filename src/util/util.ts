import * as fs from 'fs';
import * as path from 'path';
import * as mustache from "mustache";


export const writeFile = (folderPath: string, fileName: string, content: string | NodeJS.ArrayBufferView) => {
    // 若路径对应目录不存在，递归创建路径中需要的目录
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true })
    }
    const filePath = path.join(folderPath, fileName)
    // console.log(filePath)
    fs.writeFileSync(filePath, content, {encoding: 'utf8'})
}

export const readFile = (folderPath: string, fileName: string) => {
    const filePath = path.join(folderPath, fileName)
    // console.log(filePath)
    return fs.readFileSync(filePath, {encoding: 'utf8'})
}


/**
 * 根据模板 生成 文件
 * @param outputFilesFolder 文件生成目录
 * @param outputFileName 最终生成的文件名
 * @param templatesFolder 模板查找目录
 * @param templateName 模板文件名
 * @param data 要传入模板的数据
 */
export function writeFileByTemplate(
    outputFilesFolder: string, outputFileName: string,
    templatesFolder: string, templateName: string,
    data: {}
) {
    let template = readFile(templatesFolder, `${templateName}.mustache`)
    let outputContent = mustache.render(template, data);

    // 去除多余逗号
    const regExp = /(?<=\(), *|, *(?=\))|,(?=([\r\n])*\s*})/gi
    outputContent = outputContent.replace(regExp, '')

    writeFile(outputFilesFolder, outputFileName, outputContent)
}