import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { createHash } from 'crypto'

const execAsync = promisify(exec)

export async function POST(req: NextRequest) {
  try {
    // Verify webhook secret
    const signature = req.headers.get('x-hub-signature-256')
    const body = await req.text()
    const expectedSignature = 'sha256=' + createHash('sha256')
      .update(body, 'utf8')
      .update(process.env.DEPLOY_WEBHOOK_SECRET || 'default-secret')
      .digest('hex')
    
    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    const payload = JSON.parse(body)
    
    // Only deploy on push to main branch
    if (payload.ref !== 'refs/heads/main') {
      return NextResponse.json({ message: 'Not main branch, skipping deploy' })
    }

    console.log('Starting deployment...')
    
    // Pull latest changes
    await execAsync('cd /home/japriweb/pulsa-app && git pull origin main')
    
    // Install dependencies
    await execAsync('cd /home/japriweb/pulsa-app && npm install')
    
    // Generate Prisma client
    await execAsync('cd /home/japriweb/pulsa-app && npx prisma generate')

    // Ensure the admin credential configured in .env exists in the live database
    await execAsync('cd /home/japriweb/pulsa-app && npm run admin:ensure')
    
    // Build application
    await execAsync('cd /home/japriweb/pulsa-app && npm run build')
    
    // Restart PM2
    await execAsync('pm2 restart pulsa-app || pm2 start npm --name "pulsa-app" -- start')
    
    console.log('Deployment completed successfully')
    
    return NextResponse.json({ 
      message: 'Deployment successful',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Deployment error:', error)
    return NextResponse.json({ 
      error: 'Deployment failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
