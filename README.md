# Model Context Protocol Server For Cyber Security

## 项目简介

这是一个专注于网络安全领域的 Model Context Protocol Server (MCPs) 集合项目，包含两个主要目标：

1. 收集和整理现有的网络安全相关 MCP 服务器实现
2. 开发新的 MCP Server 实现

每个 MCP Server 都独立封装在各自的目录中，便于管理和使用。

## 实现列表

### 1. sqlmap-mcp

SQL注入测试工具的MCP服务器实现。基于TypeScript开发，提供了以下功能：

- 支持对目标URL进行SQL注入扫描
- 提供创建和管理测试笔记的功能
- 集成了调试工具支持

### 2. quake-server

基于360 Quake的网络空间搜索引擎MCP服务器实现。主要特点：

- 提供网络空间资产搜索能力
- 支持资源管理和笔记功能
- 基于TypeScript开发的现代化架构

### 3. doc-processor

Markdown到Word文档的转换工具MCP服务器实现。主要特点：

- 支持将Markdown格式内容转换为Word文档
- 支持嵌套列表、表格、代码块等Markdown元素
- 提供自定义样式和格式控制
- 能够处理中文文档和特殊格式要求

### 4. threat-intel-mcp

威胁情报集成MCP服务器实现。整合多个安全情报平台：

- **VirusTotal**: URL、IP、Domain、文件Hash检测
- **AbuseIPDB**: IP地址声誉检查和滥用报告
- **Shodan**: 互联网设备和服务搜索
- 提供8个专业工具，覆盖完整威胁情报工作流

### 5. hash-analyzer-mcp

Hash分析和加密工具MCP服务器实现。提供全面的Hash处理能力：

- 自动识别Hash类型（MD5、SHA系列、bcrypt等）
- 生成多种加密算法的Hash值
- HMAC生成和验证
- Hash对比和验证功能
- Hash熵分析和可疑模式检测

### 6. ssl-analyzer-mcp

SSL/TLS证书分析MCP服务器实现。专业的SSL/TLS安全检测：

- SSL/TLS证书详细信息获取
- TLS版本支持测试（检测过时协议）
- 加密套件和协议配置检查
- HTTP安全头检测和评分
- 证书链验证

### 7. cve-lookup-mcp

CVE漏洞查询MCP服务器实现。集成NVD国家漏洞数据库：

- CVE漏洞搜索和过滤（关键词、严重程度、时间范围）
- 详细CVE信息查询（CVSS评分、影响范围）
- 产品漏洞查询（按厂商和产品）
- 漏洞统计分析和趋势
- 已知漏洞利用检测（Exploit-DB、Metasploit）

### 8. encryption-mcp

全面的加密解密MCP服务器实现。支持17种加密和编码方式：

- **现代加密**: AES-256, RSA (1024-4096位), ChaCha20
- **经典密码**: Caesar, ROT13, Vigenere, Atbash, XOR
- **编码方式**: Base64, Hexadecimal编码/解码
- RSA密钥对生成（支持多种密钥长度）
- 支持多种AES模式（CBC, GCM, CTR）

### 9. cipher-identifier-mcp

智能密码识别和自动解密MCP服务器实现。AI驱动的密码分析工具：

- **智能识别**: 自动检测Base64、Hex、Binary、Caesar、ROT13、Morse等
- **自动解密**: 一键自动尝试解密并返回最可能的结果
- **暴力破解**: Caesar密码全部25种可能自动测试
- **频率分析**: 字母频率统计，识别替换密码
- **置信度评分**: 为每个可能的解密结果提供可信度分数
- **多层检测**: 支持检测多层嵌套加密

## 项目结构

```plaintext
.
├── implementations/              # 自主开发的 MCP Server 实现
│   ├── sqlmap-mcp/              # SQL注入测试工具MCP实现
│   │   ├── src/                 # 源代码目录
│   │   ├── build/               # 编译输出目录
│   │   └── README.md            # 实现文档
│   ├── quake-server/            # Quake搜索引擎MCP实现
│   │   ├── src/                 # 源代码目录
│   │   ├── build/               # 编译输出目录
│   │   └── README.md            # 实现文档
│   ├── doc-processor/           # 文档处理工具MCP实现
│   │   ├── src/                 # 源代码目录
│   │   ├── build/               # 编译输出目录
│   │   └── README.md            # 实现文档
│   ├── threat-intel-mcp/        # 威胁情报集成MCP实现
│   │   ├── src/                 # 源代码目录
│   │   ├── build/               # 编译输出目录
│   │   └── README.md            # 实现文档
│   ├── hash-analyzer-mcp/       # Hash分析工具MCP实现
│   │   ├── src/                 # 源代码目录
│   │   ├── build/               # 编译输出目录
│   │   └── README.md            # 实现文档
│   ├── ssl-analyzer-mcp/        # SSL/TLS分析MCP实现
│   │   ├── src/                 # 源代码目录
│   │   ├── build/               # 编译输出目录
│   │   └── README.md            # 实现文档
│   ├── cve-lookup-mcp/          # CVE漏洞查询MCP实现
│   │   ├── src/                 # 源代码目录
│   │   ├── build/               # 编译输出目录
│   │   └── README.md            # 实现文档
│   ├── encryption-mcp/          # 加密解密工具MCP实现
│   │   ├── src/                 # 源代码目录
│   │   ├── build/               # 编译输出目录
│   │   └── README.md            # 实现文档
│   └── cipher-identifier-mcp/   # 智能密码识别MCP实现
│       ├── src/                 # 源代码目录
│       ├── build/               # 编译输出目录
│       └── README.md            # 实现文档
└── README.md                    # 项目主文档
```

## 开发

每个实现都遵循类似的开发流程：

1. 安装依赖：
```bash
npm install
```

2. 构建服务器：
```bash
npm run build
```

3. 开发模式（自动重新构建）：
```bash
npm run watch
```

## 安装使用

要在Claude Desktop中使用这些MCP服务器，需要在配置文件中添加相应的服务器配置：

MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
Windows: `%APPDATA%/Claude/claude_desktop_config.json`

示例配置：
```json
{
  "mcpServers": {
    "sqlmap-server": {
      "command": "/path/to/sqlmap-mcp/build/index.js"
    },
    "quake-server": {
      "command": "node",
      "args": ["/path/to/quake-server/build/index.js"],
      "env": {
        "QUAKE_API_KEY": "xxxxxx-xxxx-xxxx-xxxx-xxxxxxx"
      }
    },
    "doc-processor": {
      "command": "node",
      "args": ["/path/to/doc-processor/build/index.js"]
    },
    "threat-intel": {
      "command": "node",
      "args": ["/path/to/threat-intel-mcp/build/index.js"],
      "env": {
        "VIRUSTOTAL_API_KEY": "your-virustotal-api-key",
        "ABUSEIPDB_API_KEY": "your-abuseipdb-api-key",
        "SHODAN_API_KEY": "your-shodan-api-key"
      }
    },
    "hash-analyzer": {
      "command": "node",
      "args": ["/path/to/hash-analyzer-mcp/build/index.js"]
    },
    "ssl-analyzer": {
      "command": "node",
      "args": ["/path/to/ssl-analyzer-mcp/build/index.js"]
    },
    "cve-lookup": {
      "command": "node",
      "args": ["/path/to/cve-lookup-mcp/build/index.js"],
      "env": {
        "NVD_API_KEY": "your-nvd-api-key"
      }
    },
    "encryption": {
      "command": "node",
      "args": ["/path/to/encryption-mcp/build/index.js"]
    },
    "cipher-identifier": {
      "command": "node",
      "args": ["/path/to/cipher-identifier-mcp/build/index.js"]
    }
  }
}
```

### API密钥获取

- **VirusTotal**: https://www.virustotal.com/gui/join-us
- **AbuseIPDB**: https://www.abuseipdb.com/register
- **Shodan**: https://account.shodan.io/register
- **NVD (可选)**: https://nvd.nist.gov/developers/request-an-api-key

## 主要特色

### 🔥 智能工具
- **cipher-identifier-mcp**: AI驱动的自动密码识别和解密
- **threat-intel-mcp**: 整合3大威胁情报平台（VirusTotal、AbuseIPDB、Shodan）
- **hash-analyzer-mcp**: 智能Hash类型识别和分析

### 🛡️ 安全测试
- **sqlmap-mcp**: SQL注入自动化测试
- **ssl-analyzer-mcp**: SSL/TLS配置和证书分析
- **cve-lookup-mcp**: 漏洞数据库查询和分析

### 🔐 密码学工具
- **encryption-mcp**: 17种加密算法（AES、RSA、ChaCha20等）
- **hash-analyzer-mcp**: 多种Hash算法支持
- **cipher-identifier-mcp**: 智能密码破解

### 🌐 网络侦察
- **quake-server**: 网络空间搜索引擎
- **threat-intel-mcp**: IP/Domain/URL信誉检查

## 调试

所有MCP服务器都支持使用[MCP Inspector](https://github.com/modelcontextprotocol/inspector)进行调试：

```bash
npm run inspector
```

Inspector将提供一个Web界面用于服务器调试。