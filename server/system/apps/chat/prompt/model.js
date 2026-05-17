// 模型段:让助理知道自己是哪个模型、接口在哪。
export const model = ({ apiUrl, name }) => `

## 当前模型
- 模型:${name || '-'}
- 接口:${apiUrl || '-'}`
