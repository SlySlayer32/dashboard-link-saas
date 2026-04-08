import { SMSProvider } from '@dashboard-link/shared'
import { SMSManagerImpl, smsManager } from '../manager/SMSManager.js'
import { AWSSNSProvider } from '../providers/AWSSNSProvider.js'
import { MessageBirdProvider } from '../providers/MessageBirdProvider.js'
import { MobileMessageProvider } from '../providers/MobileMessageProvider.js'
import { TwilioProvider } from '../providers/TwilioProvider.js'

type SMSProviderFactory = () => SMSProvider

const smsProviderFactories: Record<string, SMSProviderFactory> = {
  'mobile-message': () =>
    new MobileMessageProvider({
      username: process.env.MOBILE_MESSAGE_USERNAME || '',
      password: process.env.MOBILE_MESSAGE_PASSWORD || '',
      defaultSenderId: process.env.MOBILE_MESSAGE_SENDER_ID,
    }),
  twilio: () =>
    new TwilioProvider({
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      defaultFrom: process.env.TWILIO_DEFAULT_FROM || 'DashLink',
    }),
  'aws-sns': () =>
    new AWSSNSProvider({
      accessKeyId: process.env.AWS_SNS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SNS_SECRET_ACCESS_KEY || '',
      region: process.env.AWS_SNS_REGION || 'us-east-1',
      defaultSenderId: process.env.AWS_SNS_SENDER_ID || 'DashLink',
    }),
  'message-bird': () =>
    new MessageBirdProvider({
      accessKey: process.env.MESSAGE_BIRD_API_KEY || '',
      defaultOriginator: process.env.MESSAGE_BIRD_ORIGINATOR || 'DashLink',
    }),
}

export function createSMSProvider(providerKey: string): SMSProvider {
  const factory = smsProviderFactories[providerKey]
  if (!factory) {
    throw new Error(`SMS provider factory not found for key '${providerKey}'`)
  }

  return factory()
}

export function registerDefaultSMSProviders(manager: SMSManagerImpl = smsManager): void {
  Object.entries(smsProviderFactories).forEach(([key, factory]) => {
    try {
      if (!manager.getProvider(key)) {
        manager.registerProvider(factory())
      }
    } catch (error) {
      console.warn(
        `Failed to register SMS provider '${key}': ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  })
}
