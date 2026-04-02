/**
 * TokenService - NOT IMPLEMENTED
 * This is a stub service. Full implementation planned for future phase.
 */

export interface RedeemTokenResult {
  workerId: string
  orgId: string
  dashboardId: string
  workerName: string
}

export interface CreateTokenOptions {
  workerId: string
  orgId: string
  dashboardId: string
  expiresInHours: number
}

export class TokenService {
  async redeemToken(_token: string): Promise<RedeemTokenResult> {
    throw new Error('TokenService not implemented')
  }

  async createToken(_options: CreateTokenOptions): Promise<string> {
    throw new Error('TokenService not implemented')
  }
}
