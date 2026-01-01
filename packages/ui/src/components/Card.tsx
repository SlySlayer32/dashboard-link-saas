import { cva } from 'class-variance-authority'
import React from 'react'

const cardVariants = cva(
  'rounded-lg border transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700',
        muted: 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700',
        elevated: 'bg-white border-gray-200 shadow-md dark:bg-gray-800 dark:border-gray-700',
        outline: 'bg-white border-2 border-gray-300 dark:bg-gray-800 dark:border-gray-600',
      },
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'muted' | 'elevated' | 'outline'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

/**
 * Card component - primary layout primitive for Zapier-style admin interface
 * Enhanced with dark mode support and additional variants
 * 
 * Usage:
 * <Card>Basic card content</Card>
 * <Card variant="elevated">Elevated card</Card>
 * <Card padding="sm">Compact card</Card>
 * <Card variant="outline">Outlined card</Card>
 */
export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      className={`${cardVariants({ variant, padding })} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * CardHeader for consistent card layouts
 */
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  action?: React.ReactNode
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  description,
  action,
  className = '',
  children,
  ...props
}) => {
  return (
    <div className={`flex flex-col space-y-1.5 pb-6 ${className}`} {...props}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          {title && (
            <h3 className="text-lg font-semibold leading-none tracking-tight text-gray-900 dark:text-gray-100">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
        {action && <div className="flex items-center">{action}</div>}
      </div>
      {children}
    </div>
  )
}

/**
 * CardTitle for consistent heading styles
 */
export type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement>

export const CardTitle: React.FC<CardTitleProps> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <h3
      className={`text-lg font-semibold leading-none tracking-tight text-gray-900 dark:text-gray-100 ${className}`}
      {...props}
    >
      {children}
    </h3>
  )
}

/**
 * CardDescription for consistent subtitle styles
 */
export type CardDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>

export const CardDescription: React.FC<CardDescriptionProps> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <p className={`text-sm text-gray-600 dark:text-gray-400 ${className}`} {...props}>
      {children}
    </p>
  )
}

/**
 * CardContent for main content area
 */
export type CardContentProps = React.HTMLAttributes<HTMLDivElement>

export const CardContent: React.FC<CardContentProps> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div className={`pt-0 ${className}`} {...props}>
      {children}
    </div>
  )
}

/**
 * CardFooter for action area
 */
export type CardFooterProps = React.HTMLAttributes<HTMLDivElement>

export const CardFooter: React.FC<CardFooterProps> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div className={`flex items-center pt-6 ${className}`} {...props}>
      {children}
    </div>
  )
}
