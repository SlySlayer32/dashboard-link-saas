import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth'
import dashboards from './dashboards'

const admin = new Hono()

// Apply auth middleware to all admin routes
admin.use('*', authMiddleware)

// Mount admin routes
admin.route('/dashboards', dashboards)

export default admin
