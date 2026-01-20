import { AuthConfig, IScheduleProvider, ScheduleItem, ScheduleRequest } from '../types'

export class GoogleCalendarAdapter implements IScheduleProvider {
  readonly id = 'google-calendar'
  readonly name = 'Google Calendar'
  readonly version = '1.0.0'
  readonly capabilities = ['schedule', 'oauth']

  private config: AuthConfig | null = null
  private baseUrl = 'https://www.googleapis.com/calendar/v3'

  async initialize(config: AuthConfig): Promise<void> {
    if (!this.validateConfig(config)) {
      throw new Error('Invalid Google Calendar config')
    }
    this.config = config
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; message?: string }> {
    try {
      if (!this.config?.accessToken) {
        return { status: 'unhealthy', message: 'No access token' }
      }

      const response = await fetch(`${this.baseUrl}/users/me/calendarList`, {
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
        },
      })

      if (!response.ok) {
        return { status: 'unhealthy', message: 'API request failed' }
      }

      return { status: 'healthy' }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async shutdown(): Promise<void> {
    this.config = null
  }

  validateConfig(config: unknown): config is AuthConfig {
    const c = config as Record<string, unknown>
    return (
      typeof c === 'object' &&
      c !== null &&
      typeof c.clientId === 'string' &&
      typeof c.clientSecret === 'string' &&
      typeof c.redirectUri === 'string'
    )
  }

  getConfigSchema(): JSONSchema {
    return {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'Google OAuth client ID' },
        clientSecret: { type: 'string', description: 'Google OAuth client secret' },
        redirectUri: { type: 'string', description: 'OAuth redirect URI' },
        accessToken: { type: 'string', description: 'OAuth access token' },
        refreshToken: { type: 'string', description: 'OAuth refresh token' },
      } as Record<string, unknown>,
      required: ['clientId', 'clientSecret', 'redirectUri'],
    }
  }

  getAuthUrl(scopes: string[]): string {
    if (!this.config) {
      throw new Error('Adapter not initialized')
    }

    const params = new URLSearchParams({
      client_id: this.config.clientId as string,
      redirect_uri: this.config.redirectUri as string,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
    })

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }

  async exchangeToken(code: string): Promise<{ accessToken: string; refreshToken: string }> {
    if (!this.config) {
      throw new Error('Adapter not initialized')
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId as string,
        client_secret: this.config.clientSecret as string,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri as string,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to exchange token')
    }

    const data = await response.json()
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    }
  }

  async refreshToken(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken?: string }> {
    if (!this.config) {
      throw new Error('Adapter not initialized')
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId as string,
        client_secret: this.config.clientSecret as string,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to refresh token')
    }

    const data = await response.json()
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    }
  }

  async getSchedule(request: ScheduleRequest): Promise<ScheduleItem[]> {
    if (!this.config?.accessToken) {
      throw new Error('Adapter not authenticated')
    }

    const params = new URLSearchParams({
      timeMin: request.startDate.toISOString(),
      timeMax: request.endDate.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
    })

    if (request.calendarId) {
      params.set('calendarId', request.calendarId)
    }

    const response = await fetch(`${this.baseUrl}/calendars/primary/events?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch calendar events')
    }

    const data = await response.json()

    return data.items.map((item: Record<string, unknown>) => ({
      id: item.id as string,
      title: (item.summary as string) || 'No title',
      startTime: new Date(
        ((item.start as Record<string, unknown>).dateTime as string) ||
          ((item.start as Record<string, unknown>).date as string)
      ),
      endTime: new Date(
        ((item.end as Record<string, unknown>).dateTime as string) ||
          ((item.end as Record<string, unknown>).date as string)
      ),
      location: item.location as string,
      description: item.description as string,
      status: item.status === 'cancelled' ? 'cancelled' : 'confirmed',
      metadata: {
        source: 'google-calendar',
        calendarId: request.calendarId || 'primary',
        htmlLink: item.htmlLink as string,
      },
    }))
  }
}

interface JSONSchema {
  type: string
  properties: Record<string, unknown>
  required?: string[]
}
