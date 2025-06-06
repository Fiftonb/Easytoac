### API对接指南

#### 1. 激活码验证接口

**接口地址：** `POST /api/verify`

**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| code | string | 是 | 激活码 |
| machine_id | string | 是 | 机器唯一标识 |

**请求示例：**
```bash
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d '{
    "code": "A1B2C3D4E5F6G7H8",
    "machine_id": "mac-abc123def456"
  }'
```

**成功响应（200）：**
```json
{
  "success": true,
  "message": "激活码验证成功",
  "expires_at": "2024-03-31T00:00:00.000Z"
}
```

**失败响应示例：**
```json
// 激活码不存在 (404)
{
  "success": false,
  "message": "激活码不存在"
}

// 激活码已过期 (400)
{
  "success": false,
  "message": "激活码已过期"
}

// 已被其他设备使用 (400)
{
  "success": false,
  "message": "激活码已被其他设备使用"
}

// 设备已绑定其他激活码 (400)
{
  "success": false,
  "message": "该设备已激活过激活码: XXXXXXXX，一台设备只能使用一个激活码"
}

// 参数错误 (400)
{
  "success": false,
  "message": "激活码和机器ID不能为空"
}
```

#### 2. 机器唯一标识获取方法

**macOS系统：**
```bash
# 硬件UUID（推荐）
system_profiler SPHardwareDataType | grep "Hardware UUID" | awk '{print $3}'

# MAC地址方式
ifconfig en0 | grep ether | awk '{print $2}'
```

**Windows系统：**
```cmd
# 系统UUID
wmic csproduct get uuid

# 主板序列号
wmic baseboard get serialnumber
```

**Linux系统：**
```bash
# 机器ID
cat /etc/machine-id

# 系统UUID
sudo dmidecode -s system-uuid
```

**编程实现示例（Python）：**
```python
import uuid
import hashlib
import platform

def get_machine_id():
    # 获取MAC地址
    mac = ':'.join(['{:02x}'.format((uuid.getnode() >> i) & 0xff) 
                   for i in range(0,8*6,8)][::-1])
    
    # 结合系统信息生成唯一ID
    system_info = platform.node() + platform.system()
    unique_id = hashlib.md5((mac + system_info).encode()).hexdigest()
    
    return f"app-{unique_id[:16]}"

machine_id = get_machine_id()
print(f"机器ID: {machine_id}")
```

**编程实现示例（Node.js）：**
```javascript
const os = require('os');
const crypto = require('crypto');

function getMachineId() {
    const interfaces = os.networkInterfaces();
    let mac = '';
    
    // 获取第一个非内部网络接口的MAC地址
    for (let name of Object.keys(interfaces)) {
        for (let iface of interfaces[name]) {
            if (!iface.internal && iface.mac !== '00:00:00:00:00:00') {
                mac = iface.mac;
                break;
            }
        }
        if (mac) break;
    }
    
    // 结合主机名生成唯一ID
    const machineInfo = mac + os.hostname();
    const hash = crypto.createHash('md5').update(machineInfo).digest('hex');
    
    return `app-${hash.substring(0, 16)}`;
}

const machineId = getMachineId();
console.log(`机器ID: ${machineId}`);
```

#### 3. 集成示例

**Python集成示例：**
```python
import requests
import json

class ActivationClient:
    def __init__(self, api_base_url):
        self.api_base_url = api_base_url
        
    def verify_activation_code(self, code, machine_id):
        """验证激活码"""
        url = f"{self.api_base_url}/api/verify"
        payload = {
            "code": code,
            "machine_id": machine_id
        }
        
        try:
            response = requests.post(
                url, 
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            result = response.json()
            
            if response.status_code == 200 and result.get('success'):
                return {
                    'success': True,
                    'message': result.get('message'),
                    'expires_at': result.get('expires_at')
                }
            else:
                return {
                    'success': False,
                    'message': result.get('message', '验证失败')
                }
                
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'message': f'网络请求失败: {str(e)}'
            }

# 使用示例
if __name__ == "__main__":
    client = ActivationClient("http://localhost:3000")
    machine_id = get_machine_id()  # 使用上面的函数获取
    
    # 验证激活码
    result = client.verify_activation_code("A1B2C3D4E5F6G7H8", machine_id)
    
    if result['success']:
        print(f"激活成功！到期时间: {result['expires_at']}")
    else:
        print(f"激活失败: {result['message']}")
```

**JavaScript/Node.js集成示例：**
```javascript
const axios = require('axios');

class ActivationClient {
    constructor(apiBaseUrl) {
        this.apiBaseUrl = apiBaseUrl;
    }
    
    async verifyActivationCode(code, machineId) {
        try {
            const response = await axios.post(`${this.apiBaseUrl}/api/verify`, {
                code: code,
                machine_id: machineId
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            
            const result = response.data;
            
            if (result.success) {
                return {
                    success: true,
                    message: result.message,
                    expiresAt: result.expires_at
                };
            } else {
                return {
                    success: false,
                    message: result.message
                };
            }
            
        } catch (error) {
            if (error.response) {
                return {
                    success: false,
                    message: error.response.data.message || '验证失败'
                };
            } else {
                return {
                    success: false,
                    message: `网络请求失败: ${error.message}`
                };
            }
        }
    }
}

// 使用示例
async function main() {
    const client = new ActivationClient('http://localhost:3000');
    const machineId = getMachineId(); // 使用上面的函数获取
    
    try {
        const result = await client.verifyActivationCode('A1B2C3D4E5F6G7H8', machineId);
        
        if (result.success) {
            console.log(`激活成功！到期时间: ${result.expiresAt}`);
        } else {
            console.log(`激活失败: ${result.message}`);
        }
    } catch (error) {
        console.error('验证过程出错:', error);
    }
}

main();
```

#### 7. 过期激活码处理场景示例

**场景：机器绑定的激活码过期后如何处理**

```bash
# 步骤1：机器首次验证激活码（成功）
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d '{"code":"ABC123456789","machine_id":"machine-001"}'

# 响应：成功绑定
{
  "success": true,
  "message": "激活码验证成功",
  "expires_at": "2024-01-31T23:59:59.000Z"
}

# 步骤2：时间过去，激活码过期后，机器再次验证原激活码（失败）
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d '{"code":"ABC123456789","machine_id":"machine-001"}'

# 响应：激活码已过期
{
  "success": false,
  "message": "激活码已过期"
}

# 步骤3：机器尝试验证新的激活码（成功，因为原激活码已过期）
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d '{"code":"NEW987654321","machine_id":"machine-001"}'

# 响应：成功绑定新激活码
{
  "success": true,
  "message": "激活码验证成功",
  "expires_at": "2024-12-31T23:59:59.000Z"
}

# 可选步骤：管理员清理过期激活码的绑定关系
curl -X POST http://localhost:3000/api/admin/codes/cleanup \
  -H "Content-Type: application/json"

# 响应：清理结果
{
  "success": true,
  "message": "成功清理了 5 个过期激活码的绑定关系",
  "cleaned": 5
}
```

#### 4. 过期激活码处理接口

**接口地址：** `POST /api/admin/codes/cleanup`

**功能说明：** 清理过期激活码的绑定关系，允许之前绑定过期激活码的机器使用新激活码

**请求示例：**
```bash
curl -X POST http://localhost:3000/api/admin/codes/cleanup \
  -H "Content-Type: application/json"
```

**成功响应：**
```json
{
  "success": true,
  "message": "成功清理了 3 个过期激活码的绑定关系",
  "cleaned": 3,
  "expiredCodes": [
    {
      "code": "A1B2C3D4E5F6G7H8",
      "usedBy": "machine-123",
      "expiresAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**查看过期激活码：** `GET /api/admin/codes/cleanup`
```json
{
  "success": true,
  "count": 2,
  "expiredCodes": [
    {
      "id": 1,
      "code": "A1B2C3D4E5F6G7H8",
      "usedBy": "machine-123",
      "usedAt": "2024-01-01T12:00:00.000Z",
      "expiresAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### 5. 验证逻辑详解

**一机器一码 + 过期处理逻辑：**

1. **机器首次验证激活码**
   - 检查激活码是否存在和有效
   - 绑定机器ID到激活码
   - 返回验证成功

2. **机器重复验证已绑定的激活码**
   - 如果激活码未过期 → 返回验证成功
   - 如果激活码已过期 → 返回"激活码已过期"

3. **机器尝试验证新的激活码**
   - 如果机器之前绑定的激活码仍有效 → 拒绝，返回"设备已激活过激活码XXX"
   - 如果机器之前绑定的激活码已过期 → 允许绑定新激活码

4. **管理员清理过期绑定**
   - 重置所有过期激活码的绑定状态
   - 允许这些机器重新使用新激活码

#### 6. 重要说明

1. **一码一机**：每个激活码只能绑定一台机器，每台机器只能绑定一个有效激活码
2. **智能过期处理**：过期激活码会自动解除机器绑定限制，允许使用新激活码
3. **过期时间计算**：激活码的过期时间从激活时开始计算，而不是从创建时计算
4. **过期检查**：系统会自动检查激活码是否过期
5. **错误处理**：请妥善处理各种错误响应，提供友好的用户提示
6. **网络超时**：建议设置合理的请求超时时间（10秒）
7. **机器ID唯一性**：确保机器ID在不同设备上是唯一的
8. **安全建议**：生产环境请使用HTTPS协议
9. **过期管理**：建议定期使用清理接口处理过期激活码的绑定关系