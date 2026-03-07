import crypto, { createHash } from 'crypto'

export interface DashboardTokenPayload {
  jti: string // JWT ID for revocation
  orgId: string
  workerId: string
  expiresAt: Date
  singleUse: boolean
}

export interface TokenValidationResult {
  valid: boolean
  payload?: DashboardTokenPayload
  error?: string
}

export class DashboardTokenService {
  private readonly tokenLength = 32
  private readonly hashAlgorithm = 'sha256'

  /**
   * Generate a new dashboard token
   */
  generateToken(_payload: Omit<DashboardTokenPayload, 'jti'>): {
    token: string
    hash: string
    jti: string
  } {
    const jti = crypto.randomUUID()
    const token = this.generateRandomToken()
    const hash = this.hashToken(token)

    return {
      token,
      hash,
      jti,
    }
  }

  /**
   * Hash a token for storage
   */
  hashToken(token: string): string {
    return createHash(this.hashAlgorithm).update(token).digest('hex')
  }

  /**
   * Verify a token against its hash
   */
  verifyToken(token: string, storedHash: string): boolean {
    const tokenHash = this.hashToken(token)
    return crypto.timingSafeEqual(Buffer.from(tokenHash, 'hex'), Buffer.from(storedHash, 'hex'))
  }

  /**
   * Generate a cryptographically secure random token
   */
  private generateRandomToken(): string {
    return crypto.randomBytes(this.tokenLength).toString('base64url')
  }

  /**
   * Create a dashboard URL
   */
  createDashboardUrl(token: string, baseUrl: string = 'https://worker.yourapp.com'): string {
    return `${baseUrl}/d/${token}`
  }

  /**
   * Check if a token has expired
   */
  isTokenExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt
  }

  /**
   * Generate SMS message with dashboard link
   */
  generateSmsMessage(token: string, workerName?: string, customMessage?: string): string {
    const url = this.createDashboardUrl(token)

    if (customMessage) {
      return `${customMessage}\n\n${url}`
    }

    const greeting = workerName ? `Hi ${workerName},` : 'Hello,'
    return `${greeting} here's your dashboard for today:\n\n${url}\n\nThis link will expire in 24 hours.`
  }

  /**
   * Validate token payload
   */
  validatePayload(payload: any): payload is DashboardTokenPayload {
    return (
      typeof payload === 'object' &&
      payload !== null &&
      typeof payload.jti === 'string' &&
      typeof payload.orgId === 'string' &&
      typeof payload.workerId === 'string' &&
      payload.expiresAt instanceof Date &&
      typeof payload.singleUse === 'boolean'
    )
  }

  /**
   * Create token with default expiry
   */
  createDefaultToken(
    orgId: string,
    workerId: string,
    hoursToExpiry: number = 24
  ): {
    token: string
    hash: string
    jti: string
    payload: DashboardTokenPayload
  } {
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + hoursToExpiry)

    const payload = {
      jti: '',
      orgId,
      workerId,
      expiresAt,
      singleUse: true,
    }

    const { token, hash, jti } = this.generateToken(payload)
    payload.jti = jti

    return {
      token,
      hash,
      jti,
      payload,
    }
  }
}
