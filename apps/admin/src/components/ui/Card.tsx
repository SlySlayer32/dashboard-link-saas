import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <div
      className={`bg-white overflow-hidden shadow rounded-lg ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <div
      className={`px-4 py-5 sm:px-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardTitle: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <h3
      className={`text-lg leading-6 font-medium text-gray-900 ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <p
      className={`mt-1 text-sm text-gray-500 ${className}`}
      {...props}
    >
      {children}
    </p>
  );
};

export const CardContent: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <div
      className={`px-4 py-5 sm:p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardFooter: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <div
      className={`px-4 py-4 sm:px-6 bg-gray-50 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
