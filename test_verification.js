// 测试一机器一码的验证逻辑
const testMachineId = 'TEST-MACHINE-123'
const baseUrl = 'http://localhost:3000'

async function testVerification() {
    console.log('🧪 开始测试一机器一码逻辑...\n')
    
    // 首先生成两个测试激活码
    console.log('1. 生成测试激活码...')
    try {
        const generateResponse = await fetch(`${baseUrl}/api/admin/codes/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ amount: 2, expiryDays: 30 }),
        })
        
        const generateData = await generateResponse.json()
        
        if (!generateData.success) {
            console.log('❌ 生成激活码失败:', generateData.message)
            return
        }
        
        const codes = generateData.codes
        console.log(`✅ 成功生成 ${codes.length} 个激活码:`)
        codes.forEach((code, index) => {
            console.log(`   激活码${index + 1}: ${code.code}`)
        })
        
        // 测试第一个激活码
        console.log('\n2. 测试第一个激活码验证...')
        const firstVerifyResponse = await fetch(`${baseUrl}/api/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                code: codes[0].code, 
                machine_id: testMachineId 
            }),
        })
        
        const firstVerifyData = await firstVerifyResponse.json()
        console.log(`   结果: ${firstVerifyData.success ? '✅' : '❌'} ${firstVerifyData.message}`)
        
        // 测试重复验证同一个激活码
        console.log('\n3. 测试重复验证同一个激活码...')
        const repeatVerifyResponse = await fetch(`${baseUrl}/api/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                code: codes[0].code, 
                machine_id: testMachineId 
            }),
        })
        
        const repeatVerifyData = await repeatVerifyResponse.json()
        console.log(`   结果: ${repeatVerifyData.success ? '✅' : '❌'} ${repeatVerifyData.message}`)
        
        // 测试用同一台机器验证第二个激活码（应该失败）
        console.log('\n4. 测试同一台机器验证第二个激活码（应该被拒绝）...')
        const secondVerifyResponse = await fetch(`${baseUrl}/api/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                code: codes[1].code, 
                machine_id: testMachineId 
            }),
        })
        
        const secondVerifyData = await secondVerifyResponse.json()
        console.log(`   结果: ${secondVerifyData.success ? '❌ 错误：应该被拒绝' : '✅ 正确：被拒绝'} ${secondVerifyData.message}`)
        
        // 测试用不同机器验证第二个激活码（应该成功）
        console.log('\n5. 测试不同机器验证第二个激活码（应该成功）...')
        const differentMachineResponse = await fetch(`${baseUrl}/api/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                code: codes[1].code, 
                machine_id: 'DIFFERENT-MACHINE-456' 
            }),
        })
        
        const differentMachineData = await differentMachineResponse.json()
        console.log(`   结果: ${differentMachineData.success ? '✅' : '❌'} ${differentMachineData.message}`)
        
        console.log('\n🎯 测试完成！')
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error)
    }
}

// 检查服务器是否在运行
async function checkServer() {
    try {
        const response = await fetch(`${baseUrl}/`)
        if (response.ok) {
            console.log('✅ 服务器正在运行\n')
            await testVerification()
        } else {
            console.log('❌ 服务器未响应')
        }
    } catch (error) {
        console.log('❌ 无法连接到服务器，请确保服务器在运行: npm run dev')
        console.log('   错误:', error.message)
    }
}

checkServer() 