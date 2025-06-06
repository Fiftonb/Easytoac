// 简化的一机器一码测试
const baseUrl = 'http://localhost:3000'

async function testOneCodePerMachine() {
    console.log('🧪 测试一机器一码逻辑...\n')
    
    // 使用你提到的那台机器ID
    const machineId = 'D991D335-D34C-58C0-BBED-63ACE175DFF3'
    
    // 测试该机器尝试使用一个新的激活码（应该被拒绝）
    console.log('1. 测试已激活机器尝试使用新激活码...')
    const testCode = 'TEST12345678' // 一个不存在的激活码，用来测试逻辑
    
    try {
        const response = await fetch(`${baseUrl}/api/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                code: testCode, 
                machine_id: machineId 
            }),
        })
        
        const data = await response.json()
        console.log(`结果: ${data.success ? '❌ 错误' : '✅ 正确'}`)
        console.log(`消息: ${data.message}`)
        
        if (!data.success && data.message.includes('该设备已激活过激活码')) {
            console.log('✅ 一机器一码逻辑工作正常！')
        }
        
    } catch (error) {
        console.error('❌ 测试失败:', error)
    }
    
    console.log('\n2. 测试该机器使用已激活的激活码（应该成功）...')
    
    // 使用该机器已激活的激活码
    const existingCode = '38E1E4B38C5E9969' // 该机器实际使用的激活码
    
    try {
        const response = await fetch(`${baseUrl}/api/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                code: existingCode, 
                machine_id: machineId 
            }),
        })
        
        const data = await response.json()
        console.log(`结果: ${data.success ? '✅ 正确' : '❌ 错误'}`)
        console.log(`消息: ${data.message}`)
        
    } catch (error) {
        console.error('❌ 测试失败:', error)
    }
}

// 检查服务器并开始测试
async function runTest() {
    try {
        const response = await fetch(`${baseUrl}/`)
        if (response.ok) {
            console.log('✅ 服务器正在运行\n')
            await testOneCodePerMachine()
        } else {
            console.log('❌ 服务器未响应')
        }
    } catch (error) {
        console.log('❌ 无法连接到服务器')
        console.log('   请确保服务器在运行: npm run dev')
    }
}

runTest() 