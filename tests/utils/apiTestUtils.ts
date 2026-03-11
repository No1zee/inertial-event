import request from 'supertest'
import express from 'express'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

let mongoServer: MongoMemoryServer
let app: express.Application

// Test database setup
export const setupTestDatabase = async () => {
  mongoServer = await MongoMemoryServer.create()
  const mongoUri = mongoServer.getUri()
  await mongoose.connect(mongoUri)
  return mongoUri
}

export const teardownTestDatabase = async () => {
  await mongoose.disconnect()
  await mongoServer.stop()
}

// Test app setup
export const setupTestApp = () => {
  // Import the app after setting up test environment
  const { default: appInstance } = require('../../backend/src/index')
  app = appInstance
  return app
}

// Authentication helpers
export const createTestUser = async (userData = {}) => {
  const User = require('../../backend/src/models/User').default
  const defaultUser = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedPassword',
  }
  const user = new User({ ...defaultUser, ...userData })
  return await user.save()
}

export const generateTestToken = (userId: string) => {
  const jwt = require('jsonwebtoken')
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'test-secret')
}

export const createAuthenticatedRequest = (token: string) => {
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }
}

// Mock data generators
export const createMockContentData = (overrides = {}) => ({
  title: 'Test Movie',
  type: 'movie',
  overview: 'A test movie for testing purposes',
  poster: '/test-poster.jpg',
  backdrop: '/test-backdrop.jpg',
  releaseDate: '2024-01-01',
  rating: 8.5,
  genres: ['Action', 'Adventure'],
  providers: ['netflix', 'prime'],
  ...overrides,
})

export const createMockEpisodeData = (overrides = {}) => ({
  title: 'Test Episode',
  season: 1,
  episode: 1,
  overview: 'A test episode',
  still: '/test-still.jpg',
  duration: 45,
  airDate: '2024-01-01',
  ...overrides,
})

// Request helpers
export const makeRequest = async (
  method: 'get' | 'post' | 'put' | 'delete',
  endpoint: string,
  data?: any,
  headers?: any
) => {
  let req = request(app)[method](endpoint)
  
  if (headers) {
    req = req.set(headers)
  }
  
  if (data) {
    req = req.send(data)
  }
  
  return req
}

// Cleanup helpers
export const clearDatabase = async () => {
  const collections = mongoose.connection.collections
  for (const key in collections) {
    const collection = collections[key]
    await collection.deleteMany({})
  }
}