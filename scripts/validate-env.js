#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * This script validates all required environment variables for the application
 */

const crypto = require('crypto');
const { URL } = require('url');

// Color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Required environment variables with their validation rules
const requiredVars = {
  // Database
  DATABASE_URL: {
    required: true,
    type: 'url',
    description: 'PostgreSQL database connection string'
  },
  
  // NextAuth
  NEXTAUTH_SECRET: {
    required: true,
    type: 'string',
    minLength: 32,
    description: 'NextAuth.js encryption secret (minimum 32 characters)'
  },
  NEXTAUTH_URL: {
    required: true,
    type: 'url',
    description: 'Application URL for NextAuth.js'
  },
  
  // External APIs
  WECHAT_APP_ID: {
    required: true,
    type: 'string',
    pattern: /^wx[a-zA-Z0-9]+$/,
    description: 'WeChat Mini Program App ID (starts with wx)'
  },
  WECHAT_APP_SECRET: {
    required: true,
    type: 'string',
    minLength: 16,
    description: 'WeChat Mini Program App Secret'
  },
  DOUYIN_APP_ID: {
    required: true,
    type: 'string',
    pattern: /^tt[a-zA-Z0-9]+$/,
    description: 'Douyin Mini Program App ID (starts with tt)'
  },
  DOUYIN_APP_SECRET: {
    required: true,
    type: 'string',
    minLength: 16,
    description: 'Douyin Mini Program App Secret'
  },
  
  // Redis
  REDIS_URL: {
    required: true,
    type: 'url',
    description: 'Redis connection string'
  },
  
  // Security
  ENCRYPTION_KEY: {
    required: true,
    type: 'string',
    exactLength: 32,
    description: 'Data encryption key (exactly 32 characters)'
  },
  INTERNAL_API_KEY: {
    required: true,
    type: 'string',
    minLength: 16,
    description: 'Internal API authentication key'
  },
  GAME_CLIENT_API_KEY: {
    required: true,
    type: 'string',
    minLength: 16,
    description: 'Game client API authentication key'
  },
  
  // Environment
  NODE_ENV: {
    required: true,
    type: 'enum',
    values: ['development', 'production', 'test'],
    description: 'Node.js environment'
  }
};

// Optional environment variables with defaults
const optionalVars = {
  PORT: {
    type: 'number',
    default: 3000,
    description: 'Application port'
  },
  DB_MAX_CONNECTIONS: {
    type: 'number',
    default: 10,
    description: 'Maximum database connections'
  },
  DB_CONNECTION_TIMEOUT: {
    type: 'number',
    default: 5000,
    description: 'Database connection timeout (ms)'
  },
  RATE_LIMIT_WINDOW_MS: {
    type: 'number',
    default: 900000,
    description: 'Rate limit window (ms)'
  },
  RATE_LIMIT_MAX_REQUESTS: {
    type: 'number',
    default: 100,
    description: 'Rate limit max requests'
  },
  LOG_LEVEL: {
    type: 'enum',
    values: ['error', 'warn', 'info', 'debug'],
    default: 'info',
    description: 'Logging level'
  },
  FORCE_HTTPS: {
    type: 'boolean',
    default: false,
    description: 'Force HTTPS redirects'
  }
};

/**
 * Validation functions
 */
const validators = {
  string: (value, rules) => {
    if (typeof value !== 'string') return false;
    if (rules.minLength && value.length < rules.minLength) return false;
    if (rules.maxLength && value.length > rules.maxLength) return false;
    if (rules.exactLength && value.length !== rules.exactLength) return false;
    if (rules.pattern && !rules.pattern.test(value)) return false;
    return true;
  },
  
  number: (value) => {
    const num = parseInt(value, 10);
    return !isNaN(num) && isFinite(num);
  },
  
  boolean: (value) => {
    return ['true', 'false', '1', '0'].includes(value.toLowerCase());
  },
  
  url: (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  
  enum: (value, rules) => {
    return rules.values.includes(value);
  }
};

/**
 * Log functions
 */
function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

function logHeader(message) {
  console.log(`\n${colors.bold}${colors.blue}${message}${colors.reset}`);
}

/**
 * Validate a single environment variable
 */
function validateVar(name, value, rules) {
  const errors = [];
  
  // Check if required variable is missing
  if (rules.required && (!value || value.trim() === '')) {
    errors.push(`${name} is required but not set`);
    return { valid: false, errors };
  }
  
  // Skip validation if optional variable is not set
  if (!rules.required && (!value || value.trim() === '')) {
    return { valid: true, errors: [], skipped: true };
  }
  
  // Validate type
  if (rules.type && !validators[rules.type](value, rules)) {
    if (rules.type === 'string' && rules.minLength) {
      errors.push(`${name} must be at least ${rules.minLength} characters long`);
    } else if (rules.type === 'string' && rules.exactLength) {
      errors.push(`${name} must be exactly ${rules.exactLength} characters long`);
    } else if (rules.type === 'string' && rules.pattern) {
      errors.push(`${name} format is invalid`);
    } else if (rules.type === 'enum') {
      errors.push(`${name} must be one of: ${rules.values.join(', ')}`);
    } else if (rules.type === 'url') {
      errors.push(`${name} must be a valid URL`);
    } else {
      errors.push(`${name} has invalid ${rules.type} format`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Generate secure random values for missing variables
 */
function generateSecureValue(rules) {
  if (rules.type === 'string') {
    if (rules.exactLength === 32) {
      return crypto.randomBytes(16).toString('hex');
    } else if (rules.minLength) {
      const length = Math.max(rules.minLength, 32);
      return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').substring(0, length);
    }
  }
  return null;
}

/**
 * Main validation function
 */
function validateEnvironment() {
  logHeader('🔍 Environment Variables Validation');
  
  let hasErrors = false;
  let hasWarnings = false;
  const suggestions = [];
  
  // Validate required variables
  logHeader('Required Variables:');
  for (const [name, rules] of Object.entries(requiredVars)) {
    const value = process.env[name];
    const result = validateVar(name, value, rules);
    
    if (result.valid) {
      logSuccess(`${name}: OK`);
    } else {
      hasErrors = true;
      result.errors.forEach(error => logError(error));
      
      // Generate suggestion for missing secure values
      const suggestion = generateSecureValue(rules);
      if (suggestion) {
        suggestions.push(`export ${name}="${suggestion}"`);
      }
    }
  }
  
  // Validate optional variables
  logHeader('Optional Variables:');
  for (const [name, rules] of Object.entries(optionalVars)) {
    const value = process.env[name];
    const result = validateVar(name, value, rules);
    
    if (result.skipped) {
      logWarning(`${name}: Not set (will use default: ${rules.default})`);
      hasWarnings = true;
    } else if (result.valid) {
      logSuccess(`${name}: ${value}`);
    } else {
      hasErrors = true;
      result.errors.forEach(error => logError(error));
    }
  }
  
  // Check for security issues
  logHeader('Security Checks:');
  
  // Check for weak secrets
  const secret = process.env.NEXTAUTH_SECRET;
  if (secret && (secret.includes('secret') || secret.includes('password') || secret.length < 32)) {
    logWarning('NEXTAUTH_SECRET appears to be weak. Use a strong random value.');
    hasWarnings = true;
  } else if (secret) {
    logSuccess('NEXTAUTH_SECRET: Strong');
  }
  
  // Check for development values in production
  if (process.env.NODE_ENV === 'production') {
    const devPatterns = ['localhost', 'dev', 'test', 'example'];
    for (const [name, value] of Object.entries(process.env)) {
      if (requiredVars[name] && value) {
        for (const pattern of devPatterns) {
          if (value.toLowerCase().includes(pattern)) {
            logWarning(`${name} contains '${pattern}' - ensure this is correct for production`);
            hasWarnings = true;
          }
        }
      }
    }
  }
  
  // Summary
  logHeader('Validation Summary:');
  
  if (hasErrors) {
    logError('Validation failed! Please fix the errors above.');
    
    if (suggestions.length > 0) {
      logInfo('Suggested secure values for missing variables:');
      suggestions.forEach(suggestion => {
        console.log(`  ${colors.yellow}${suggestion}${colors.reset}`);
      });
    }
    
    process.exit(1);
  } else if (hasWarnings) {
    logWarning('Validation passed with warnings. Review the warnings above.');
    logSuccess('Environment is ready for use.');
  } else {
    logSuccess('All environment variables are valid!');
    logSuccess('Environment is ready for production use.');
  }
}

/**
 * Generate environment template
 */
function generateTemplate() {
  logHeader('📝 Environment Variables Template');
  
  console.log('# Required Environment Variables');
  for (const [name, rules] of Object.entries(requiredVars)) {
    console.log(`# ${rules.description}`);
    const suggestion = generateSecureValue(rules);
    if (suggestion) {
      console.log(`${name}="${suggestion}"`);
    } else if (rules.type === 'url') {
      console.log(`${name}="https://your-domain.com"`);
    } else {
      console.log(`${name}="your-${name.toLowerCase().replace(/_/g, '-')}"`);
    }
    console.log('');
  }
  
  console.log('# Optional Environment Variables');
  for (const [name, rules] of Object.entries(optionalVars)) {
    console.log(`# ${rules.description} (default: ${rules.default})`);
    console.log(`# ${name}="${rules.default}"`);
    console.log('');
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'template':
  case '--template':
    generateTemplate();
    break;
  case 'help':
  case '--help':
    console.log(`
Environment Variables Validation Script

Usage:
  node scripts/validate-env.js          Validate current environment
  node scripts/validate-env.js template Generate environment template
  node scripts/validate-env.js help     Show this help message

Examples:
  npm run validate:env                  Validate environment
  npm run validate:env template         Generate .env template
    `);
    break;
  default:
    validateEnvironment();
}