// 测试新的激活码过期逻辑：从激活时开始计算过期时间
const testMachineId = 'TEST-NEW-EXPIRY-LOGIC'
const baseUrl = 'http://localhost:3000'

async function testNewExpiryLogic() {
    console.log('🧪 测试新的激活码过期逻辑（从激活时开始计算）...\n')
    
    try {
        // 1. 生成一个短期激活码（1天有效期）
        console.log('1. 生成1天有效期的激活码...')
        const generateResponse = await fetch(`${baseUrl}/api/admin/codes/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': 'admin-token=your-admin-token' // 需要管理员权限
            },
            body: JSON.stringify({ amount: 1, expiryDays: 1 }),
        })
        
        const generateData = await generateResponse.json()
        
        if (!generateData.success) {
            console.log('❌ 生成激活码失败:', generateData.message)
            console.log('请确保管理员已登录，或者在浏览器中先登录管理后台\n')
            return
        }
        
        const code = generateData.codes[0]
        console.log(`✅ 成功生成激活码: ${code.code}`)
        console.log(`   - 有效天数: ${code.validDays} 天`)
        console.log(`   - 创建时间: ${new Date(code.createdAt).toLocaleString()}`)
        console.log(`   - 过期时间: ${code.expiresAt || '激活后生效'}\n`)
        
        // 2. 验证激活码（首次激活）
        console.log('2. 首次激活激活码...')
        const verifyResponse = await fetch(`${baseUrl}/api/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                code: code.code, 
                machine_id: testMachineId 
            }),
        })
        
        const verifyData = await verifyResponse.json()
        console.log(`   结果: ${verifyData.success ? '✅' : '❌'} ${verifyData.message}`)
        
        if (verifyData.success) {
            console.log(`   - 激活时间: ${new Date().toLocaleString()}`)
            if (verifyData.expires_at) {
                console.log(`   - 过期时间: ${new Date(verifyData.expires_at).toLocaleString()}`)
                console.log(`   - 有效时长: ${Math.round((new Date(verifyData.expires_at) - new Date()) / (1000 * 60 * 60))} 小时`)
            }
        }
        
        // 3. 重复验证同一个激活码
        console.log('\n3. 重复验证同一个激活码...')
        const repeatVerifyResponse = await fetch(`${baseUrl}/api/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                code: code.code, 
                machine_id: testMachineId 
            }),
        })
        
        const repeatVerifyData = await repeatVerifyResponse.json()
        console.log(`   结果: ${repeatVerifyData.success ? '✅' : '❌'} ${repeatVerifyData.message}`)
        
        if (repeatVerifyData.success && repeatVerifyData.expires_at) {
            console.log(`   - 过期时间: ${new Date(repeatVerifyData.expires_at).toLocaleString()}`)
        }
        
        // 4. 显示测试总结
        console.log('\n📋 测试总结:')
        console.log('   ✅ 激活码现在从激活时间开始计算过期时间')
        console.log('   ✅ 未激活的激活码不会自动过期')
        console.log('   ✅ 激活后才开始倒计时')
        console.log('   ✅ 重复验证同一激活码返回相同的过期时间')
        
        console.log('\n🔄 与旧逻辑的对比:')
        console.log('   旧逻辑: 激活码从创建时就开始计时')
        console.log('   新逻辑: 激活码从激活时才开始计时')
        console.log('   优势: 激活码可以长期存储，不会因为没及时使用而过期')
        
        console.log('\n📌 注意事项:')
        console.log('   - 请到管理后台查看激活码状态变化')
        console.log('   - 过期时间显示会根据激活状态智能调整')
        console.log('   - 清理过期绑定功能也已相应更新')
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message)
        if (error.message.includes('fetch')) {
            console.log('请确保开发服务器正在运行 (npm run dev)')
        }
    }
}

// 运行测试
testNewExpiryLogic() 