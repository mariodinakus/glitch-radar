import {NextResponse} from 'next/server';
export function GET(){return NextResponse.json({ok:true,service:'GLITCH',at:new Date().toISOString(),telegramConfigured:Boolean(process.env.TELEGRAM_BOT_TOKEN&&process.env.TELEGRAM_CHAT_ID),deduplicationConfigured:Boolean(process.env.UPSTASH_REDIS_REST_URL&&process.env.UPSTASH_REDIS_REST_TOKEN)})}
