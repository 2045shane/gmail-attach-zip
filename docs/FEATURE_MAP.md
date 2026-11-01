# Gmail 附件打包功能地图

| 入口 / 模块 | 职责 | 验证 |
| --- | --- | --- |
| manifest.json | MV3、storage/activeTab、仅两个附件域名、classic scripts 顺序 | manifest 测试 |
| src/lib/attachments.js | href/download_url 纯解析，HTTPS 域名白名单 | 附件解析测试 |
| src/content/extractors.js | 遍历当前已加载可见下载元素，提取邮件元数据、URL 去重 | 手动 Gmail 验收 |
| src/content/content.js | Shadow DOM 浮动面板、清单勾选、确认、串行 fetch、ZIP 下载及后备链接 | 手动浏览器验收 |
| src/lib/zip.js | CRC32、STORE local header/central directory/EOCD、UTF-8 标志 0x0800 | 结构、内容、CRC 和目录偏移测试 |
| src/lib/naming.js | 日期/发件人前缀、非法字符、长度、扩展名、重名、文件夹 | 命名测试 |
| src/lib/quota.js | 本机日期每日 3 次、可注入时钟和 storage、串行消费 | 并发/跨天/解锁测试 |
| src/lib/license.js | GAZ1 + SHA-256 固定独立 payload 的本地校验 | 有效/无效/前缀测试 |
| src/background/service-worker.js | 唯一计次写入方、消息发送者检查、设置入口 | VM 后台消息集成测试 |
| src/popup/ | 当前页是否 Gmail、额度、解锁状态、设置入口 | 手动验收 |
| src/options/ | 校验后保存/清除 license、保存命名规则 | 手动验收 |
| src/ui/ | 米色/朱红配色、状态刷新、中文 CTA | 手动验收 |
| scripts/gen-license.mjs | 生成本地测试 key，不含秘密 | 与 license 共用算法 |

## 数据流

manifest 按序加载双导出库 → extractors → content。所有库合并到隔离世界 `globalThis.GmailZip`，通过 CommonJS 供 node:test 使用，无需构建。

用户点击「打包附件」→ 只读可见 DOM → 解析附件 URL 和文件名 → 关联最近邮件容器的发件人/日期 → URL 去重 → 清单勾选。此过程不计次、不发起附件请求。

用户确认非空清单 → 读取命名设置 → 发 `quota-consume` → 后台验证扩展发送者 ID 与 Gmail 来源 → 队列串行校验 license/额度并写入 → content 逐个 `fetch(credentials:'include')`，单项 60 秒超时 → 成功文件加入 ZIP，失败记录加入 `_失败清单.txt` → Blob URL 下载 → 60 秒后回收。全失败也提供失败清单 ZIP；失败项后备 `<a download>` 链接不再次扣次数。未选择附件不计次。导出已开始但失败仍计次。

popup/options 通过 `quota-status` 读取状态；storage.onChanged 刷新显示。只有 background 调用 quota.consume；options 仅写 license/命名 key。后台消费队列错误后仍能继续接收请求。

## 存储 key

| key | 值 | 写入方 |
| --- | --- | --- |
| gazQuota | `{date: 'YYYY-MM-DD', count: integer}` | background |
| gazLicense | 去除首尾空格的 `GAZ1.` + 64 位小写十六进制 SHA-256 | options |
| gazNaming | `flat` / `sender` / `date` | options |

每日额度按本机时区计算，跨天读状态逻辑重置，下一次导出落盘。解锁导出不增加免费计数，清除 license 恢复同日累计次数。license payload 为 `gmail-attach-zip:local-export:unlock:v1`，与参考项目分离；无服务端防篡改。邮件内容、附件清单、附件 URL 与二进制不持久化。

## 已知限制

- Gmail DOM 选择器易变；不同语言、布局、邮件展开状态影响提取。日期无法识别时标注未知，不冒用当天日期。日期字段可能受本机解析规则影响，应人工核对。
- 列表页只取得已加载、可见且带下载链接的附件 chip。仅名称 chip、折叠邮件、未加载结果、其他分页不在范围内。可见指 DOM 渲染且未隐藏，包含已加载的滚动区域内容。
- 支持 href 含 `view=att` / `disp=safe` / `attid=`，以及 `download_url="mime:filename:url"`。不读取 Gmail 私有接口，不自动点击以获得 URL。相同 URL 去重，可能将同链接多处展示合并。
- 附件 URL 可能过期、跳转登录页、重定向到白名单以外主机，或因 CORS 被阻止。content fetch 不会因为 MV3 host_permissions 自动绕过 CORS；本 MVP 按要求保留 content 读取模式，不做后台代理。
- HTML 响应按失败处理，可能拒绝真实 HTML 附件；不能保证成功状态码返回的一定是正确文件。逐个下载受浏览器策略影响，跨域 `<a download>` 可能变成打开链接，文件名可能由服务器决定。
- 大文件全内存占用较高，未实现流式 ZIP、压缩与 ZIP64；条目数超过 65535 或 ZIP 总大小接近 4 GiB 会拒绝。建议小批量导出，不保证内存不足时可恢复。
- Shadow DOM 提供样式隔离，不是安全边界。离线额度和公开 license 都可被本地修改，不作为商业级防破解机制。
- node:test 不包含真实登录 Gmail 浏览器自动化，实际下载、DOM 元数据和跨域情况需人工验收。

## 手动验收

1. Chrome 加载目录、刷新 Gmail；popup 显示 Gmail/今日 3 次，其他站点显示不支持。
2. 搜索结果页列清单，确认没有 URL 的 chip 不被误认为完整结果；打开会话、展开邮件后重新扫描，对照文件名/发件人/日期。
3. 勾选多个文件，导出后用系统 ZIP 解压，检查中文文件名、内容、重名和两种分文件夹规则。
4. 换标签页累计导出 3 次，第 4 次被拒绝并显示「有问题请联系我」和小红书私信账号。扫描、取消勾选、空清单均不扣次数。
5. 使用失效链接/断网模拟失败；确认 ZIP 中有 `_失败清单.txt`，后备按钮只下载失败项且不再次计次。
6. 设置保存脚本输出的 key 后无限次且不增加免费计数；无效码拒绝；清除后恢复当天额度。改本机日期后确认额度重置。
7. 检查折叠/展开浮动面板、Gmail SPA 切换后重新扫描、导出中不可重复点击、存储失败和下载被拦截的提示。

## 下一步

增加真实 Gmail DOM 固件与浏览器集成测试；改进多语言日期提取和附件 chip 定位；评估大文件流式 ZIP 与明确的内存上限；基于实际 CORS 失败证据再考虑后台下载代理及权限调整。继续保持无 OAuth、无 Gmail API、无外部上传。
