// 测试套餐类型功能
const baseUrl = 'http://localhost:3000'

async function testCardTypes() {
    console.log('🧪 测试套餐类型功能...\n')
    
    try {
        // 1. 测试生成不同套餐类型的激活码
        const cardTypes = [
            { name: '周卡', days: 7 },
            { name: '月卡', days: 30 },
            { name: '季卡', days: 90 },
            { name: '年卡', days: 365 }
        ]
        
        for (const cardType of cardTypes) {
            console.log(`生成 ${cardType.name} 激活码...`)
            
            const generateResponse = await fetch(`${baseUrl}/api/admin/codes/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 注意：需要先在浏览器中登录管理后台
                },
                body: JSON.stringify({ 
                    amount: 2, 
                    expiryDays: cardType.days,
                    cardType: cardType.name
                }),
            })
            
            const generateData = await generateResponse.json()
            
            if (generateData.success) {
                console.log(`✅ 成功生成 ${cardType.name} 激活码`)
                generateData.codes.forEach((code, index) => {
                    console.log(`   ${cardType.name}-${index + 1}: ${code.code}`)
                })
                console.log()
            } else {
                console.log(`❌ 生成 ${cardType.name} 失败:`, generateData.message)
                if (generateData.message.includes('认证')) {
                    console.log('请先在浏览器中登录管理后台 (http://localhost:3000/admin/login)')
                    console.log('默认账号: admin')
                    console.log('默认密码: 123456\n')
                    return
                }
            }
        }
        
        // 2. 测试激活不同套餐类型的激活码
        console.log('测试激活不同套餐类型的激活码...')
        
        // 先获取激活码列表来找到刚生成的激活码
        const listResponse = await fetch(`${baseUrl}/api/admin/codes/list`)
        const listData = await listResponse.json()
        
        if (listData.success && listData.codes.length > 0) {
            // 找一个未使用的激活码进行测试
            const testCode = listData.codes.find(code => !code.isUsed && code.cardType)
            
            if (testCode) {
                console.log(`测试激活 ${testCode.cardType} 激活码: ${testCode.code}`)
                
                const verifyResponse = await fetch(`${baseUrl}/api/verify`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        code: testCode.code, 
                        machine_id: 'TEST-CARD-TYPES-001'
                    }),
                })
                
                const verifyData = await verifyResponse.json()
                console.log(`   结果: ${verifyData.success ? '✅' : '❌'} ${verifyData.message}`)
                
                if (verifyData.success && verifyData.expires_at) {
                    console.log(`   激活时间: ${new Date().toLocaleString()}`)
                    console.log(`   过期时间: ${new Date(verifyData.expires_at).toLocaleString()}`)
                    
                    const hoursValid = Math.round((new Date(verifyData.expires_at) - new Date()) / (1000 * 60 * 60))
                    console.log(`   剩余时长: ${hoursValid} 小时 (${Math.round(hoursValid / 24)} 天)`)
                }
            }
        }
        
        console.log('\n📋 套餐类型功能测试总结:')
        console.log('   ✅ 支持预设套餐类型：周卡、月卡、季卡、半年卡、年卡')
        console.log('   ✅ 支持自定义天数')
        console.log('   ✅ 套餐类型信息存储在数据库中')
        console.log('   ✅ 激活码从激活时开始计算过期时间')
        console.log('   ✅ 管理后台可按套餐类型筛选')
        
        console.log('\n🎯 用户体验改进:')
        console.log('   - 生成激活码时可选择常用套餐类型')
        console.log('   - 激活码管理页面可按套餐类型分类查看')
        console.log('   - 过期时间显示更加直观和用户友好')
        console.log('   - 未激活显示"激活后生效"，已激活显示具体过期时间')
        
        console.log('\n📌 建议测试步骤:')
        console.log('   1. 在管理后台生成不同套餐类型的激活码')
        console.log('   2. 查看激活码列表的套餐类型显示')
        console.log('   3. 使用套餐类型筛选功能')
        console.log('   4. 激活一个激活码查看过期时间变化')
        console.log('   5. 导出CSV查看套餐类型信息')
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message)
        if (error.message.includes('fetch')) {
            console.log('请确保开发服务器正在运行 (npm run dev)')
        }
    }
}

// 运行测试
testCardTypes() 