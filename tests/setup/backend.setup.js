// Mongoose mock removed for integration tests using MongoMemoryServer

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-token'),
  verify: jest.fn(() => ({ userId: 'mock-user-id' })),
}))

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(() => Promise.resolve('hashed-password')),
  compare: jest.fn(() => Promise.resolve(true)),
  genSalt: jest.fn(() => Promise.resolve('mock-salt')),
}))

// Mock Express middleware
jest.mock('cors', () => jest.fn(() => (req, res, next) => next()))
jest.mock('helmet', () => jest.fn(() => (req, res, next) => next()))
jest.mock('morgan', () => jest.fn(() => (req, res, next) => next()))

// Global test environment variables
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.MONGODB_URI = 'mongodb://localhost:27017/novastream-test'
process.env.BACKEND_PORT = '5001'