# Dokploy 部署指南

本指南将帮您使用 Dokploy 部署 I'm Not a Robot 游戏项目。

## 🚀 快速开始

### 前置要求

- Dokploy 服务器已安装并运行
- Git 仓库访问权限
- 域名（可选）

### 1. 准备部署文件

项目已包含以下 Dokploy 部署文件：

- `Dockerfile` - 多阶段构建配置
- `docker-compose.yml` - 本地开发和部署配置
- `.dockerignore` - Docker 构建忽略文件
- `next.config.mjs` - 已配置 standalone 输出

### 2. 在 Dokploy 中创建应用

1. **登录 Dokploy 控制台**
2. **创建新应用**：
   - 选择 "Nixpacks" 部署类型（推荐，自动检测配置）
   - 或选择 "Docker" 部署类型使用自定义 Dockerfile
   - 连接您的 Git 仓库：`https://github.com/trevorwang12/iamnotarobot.git`
   - 设置构建和部署配置

### 3. 配置环境变量

在 Dokploy 环境变量设置中添加：

#### 必需变量
```bash
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://your-domain.com
ENABLE_ADMIN=false
```

#### 可选变量
```bash
# 站点品牌
NEXT_PUBLIC_SITE_NAME=I'm Not a Robot
NEXT_PUBLIC_DEFAULT_TITLE=Free Play I'm Not a Robot Game
NEXT_PUBLIC_DEFAULT_DESCRIPTION=Play the I'm Not a Robot game for free

# 分析工具
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX

# 调试模式
NEXT_PUBLIC_DEBUG_MODE=false
```

### 4. 构建和部署设置

#### 构建配置
- **构建命令**: 自动使用 Dockerfile
- **端口**: 3000
- **健康检查**: `GET /` (返回 200)

#### 部署配置
- **重启策略**: `unless-stopped`
- **内存限制**: 推荐 512MB 最低
- **CPU 限制**: 推荐 0.5 cores 最低

## 📋 部署步骤详解

### 方法 1: 使用 Nixpacks（推荐）

1. **在 Dokploy 中选择 Nixpacks 部署**
2. **Git 仓库**: `https://github.com/trevorwang12/iamnotarobot.git`
3. **分支**: `main`
4. **端口**: `3000`
5. **设置环境变量**
6. **点击部署**

**优势**:
- 自动检测 Node.js 项目
- 使用项目中的 `.nixpacks.toml` 配置
- 更快的构建速度
- 自动优化

### 方法 2: 使用 Docker Compose

1. **在 Dokploy 中选择 Docker Compose 部署**
2. **指向项目根目录的 docker-compose.yml**
3. **设置环境变量**
4. **点击部署**

### 方法 3: 使用 Dockerfile

1. **在 Dokploy 中选择 Docker 部署**
2. **构建上下文**: 项目根目录
3. **Dockerfile 路径**: `./Dockerfile`
4. **端口映射**: `3000:3000`
5. **设置环境变量**
6. **点击部署**

## 🔧 本地测试

在部署前，建议先在本地测试 Docker 构建：

```bash
# 构建镜像
docker build -t iamnotarobot .

# 使用 docker-compose 运行
docker-compose up -d

# 检查应用状态
curl http://localhost:3000

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 🌐 域名和 SSL 配置

### 配置域名

1. **在 Dokploy 中设置域名**：
   - 进入应用设置
   - 添加自定义域名
   - 配置 DNS 记录指向 Dokploy 服务器

2. **更新环境变量**：
   ```bash
   NEXT_PUBLIC_SITE_URL=https://yourdomain.com
   ```

### SSL 证书

Dokploy 通常自动处理 SSL 证书（Let's Encrypt）：
- 确保域名 DNS 正确指向服务器
- Dokploy 会自动申请和续期证书
- 强制 HTTPS 重定向会自动启用

## 📊 监控和日志

### 健康检查

应用包含内置健康检查：
- **端点**: `GET /`
- **预期响应**: HTTP 200
- **检查间隔**: 30秒
- **超时**: 10秒
- **重试次数**: 3次

### 日志查看

在 Dokploy 控制台中：
1. 进入应用详情页
2. 查看 "日志" 标签页
3. 实时监控应用运行状态

### 性能监控

建议配置：
- CPU 使用率监控
- 内存使用率监控
- 磁盘空间监控
- 网络流量监控

## 🔧 故障排除

### 常见问题

**构建失败**：
```bash
# 检查 Node.js 版本（需要 18+）
# 检查依赖安装
# 查看构建日志
```

**启动失败**：
```bash
# 检查端口 3000 是否可用
# 验证环境变量设置
# 查看容器日志
```

**访问不了**：
```bash
# 检查域名 DNS 配置
# 验证防火墙设置
# 确认健康检查通过
```

### 调试命令

```bash
# 进入容器
docker exec -it <container_name> sh

# 查看构建日志
docker logs <container_name>

# 检查网络连接
docker network ls
docker network inspect <network_name>
```

## 🔒 安全最佳实践

### 生产环境设置

```bash
# 禁用管理员面板
ENABLE_ADMIN=false

# 禁用调试模式
NEXT_PUBLIC_DEBUG_MODE=false

# 设置安全的管理员密钥（如果启用管理面板）
ADMIN_KEY=your-very-secure-random-key
```

### 容器安全

- 使用非 root 用户运行（已配置）
- 最小化镜像大小（使用 Alpine）
- 定期更新依赖包
- 监控安全漏洞

## 📈 性能优化

### 资源配置

```yaml
# 推荐的资源配置
resources:
  limits:
    memory: 1Gi
    cpu: 1000m
  requests:
    memory: 512Mi
    cpu: 500m
```

### 缓存优化

- 启用 Dokploy 内置缓存
- 配置 CDN（如 CloudFlare）
- 优化图片格式（已配置 WebP）

## 🆘 获取帮助

如果遇到问题：

1. 检查 Dokploy 日志
2. 验证环境变量配置
3. 测试本地 Docker 构建
4. 查看健康检查状态
5. 参考主项目 README.md

---

部署成功后，您的应用将在配置的域名上运行！🎉