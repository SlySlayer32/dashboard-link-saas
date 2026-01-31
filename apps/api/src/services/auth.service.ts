import { createClient } from '@supabase/supabase-js';
import { sign } from 'hono/jwt';
import { logger } from '../lib/logger';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

interface RegisterParams {
    email: string;
    password: string;
    organizationName: string;
    fullName?: string;
}

interface LoginParams {
    email: string;
    password: string;
}

/**
 * Auth Service - Handles user authentication and registration
 * Implements T040 requirements: register, login, getCurrentUser
 */
export class AuthService {
    /**
     * Register a new admin user and create their organization
     */
    async register(params: RegisterParams) {
        const { email, password, organizationName, fullName } = params;

        try {
            // 1. Create Supabase Auth user
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
            });

            if (authError || !authData.user) {
                logger.error('Failed to create auth user', { error: authError });
                throw new Error(authError?.message || 'Failed to create user');
            }

            // 2. Create organization
            const slug = organizationName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');

            const { data: org, error: orgError } = await supabase
                .from('organizations')
                .insert({
                    name: organizationName,
                    slug,
                })
                .select()
                .single();

            if (orgError || !org) {
                logger.error('Failed to create organization', { error: orgError });
                // Cleanup: delete auth user
                await supabase.auth.admin.deleteUser(authData.user.id);
                throw new Error(orgError?.message || 'Failed to create organization');
            }

            // 3. Create user record
            const { data: user, error: userError } = await supabase
                .from('users')
                .insert({
                    id: authData.user.id,
                    organization_id: org.id,
                    email,
                    full_name: fullName,
                    role: 'owner',
                })
                .select()
                .single();

            if (userError || !user) {
                logger.error('Failed to create user record', { error: userError });
                // Cleanup: delete organization and auth user
                await supabase.from('organizations').delete().eq('id', org.id);
                await supabase.auth.admin.deleteUser(authData.user.id);
                throw new Error(userError?.message || 'Failed to create user record');
            }

            // 4. Generate JWT
            const token = await sign(
                {
                    userId: user.id,
                    orgId: org.id,
                    email: user.email,
                    role: user.role,
                    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
                },
                jwtSecret
            );

            logger.info('User registered successfully', {
                userId: user.id,
                organizationId: org.id,
            });

            return {
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    role: user.role,
                    organizationId: org.id,
                },
                organization: {
                    id: org.id,
                    name: org.name,
                    slug: org.slug,
                },
                accessToken: token,
            };
        } catch (error) {
            logger.error('Registration failed', { error });
            throw error;
        }
    }

    /**
     * Login existing user
     */
    async login(params: LoginParams) {
        const { email, password } = params;

        try {
            // 1. Authenticate with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError || !authData.user) {
                logger.warn('Login failed', { email, error: authError?.message });
                throw new Error('Invalid credentials');
            }

            // 2. Get user record with organization
            const { data: user, error: userError } = await supabase
                .from('users')
                .select(
                    `
                    id,
                    email,
                    full_name,
                    role,
                    organization_id,
                    organizations (
                        id,
                        name,
                        slug
                    )
                `
                )
                .eq('id', authData.user.id)
                .single();

            if (userError || !user) {
                logger.error('Failed to get user record', { error: userError });
                throw new Error('User not found');
            }

            // 3. Generate JWT
            const token = await sign(
                {
                    userId: user.id,
                    orgId: user.organization_id,
                    email: user.email,
                    role: user.role,
                    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
                },
                jwtSecret
            );

            logger.info('User logged in', {
                userId: user.id,
                organizationId: user.organization_id,
            });

            return {
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    role: user.role,
                    organizationId: user.organization_id,
                },
                organization: user.organizations,
                accessToken: token,
            };
        } catch (error) {
            logger.error('Login failed', { error });
            throw error;
        }
    }

    /**
     * Get current user by ID
     */
    async getCurrentUser(userId: string) {
        try {
            const { data: user, error } = await supabase
                .from('users')
                .select(
                    `
                    id,
                    email,
                    full_name,
                    role,
                    organization_id,
                    organizations (
                        id,
                        name,
                        slug,
                        plan
                    )
                `
                )
                .eq('id', userId)
                .single();

            if (error || !user) {
                logger.error('Failed to get current user', { error, userId });
                throw new Error('User not found');
            }

            return {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
                organizationId: user.organization_id,
                organization: user.organizations,
            };
        } catch (error) {
            logger.error('Get current user failed', { error, userId });
            throw error;
        }
    }
}

// Export singleton instance
export const authService = new AuthService();
