/**
 * SMSService - NOT IMPLEMENTED
 * This is a stub service. Full implementation planned for future phase.
 */

export interface EnqueueSMSOptions {
  to: string
  message: string
  orgId: string
  type: string
}

export class SMSService {
  async enqueueSMS(_options: EnqueueSMSOptions): Promise<{ id: string }> {
    throw new Error('SMSService not implemented')
  }
}
