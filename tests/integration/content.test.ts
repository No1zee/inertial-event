import request from 'supertest'
import express from 'express'
import { setupTestDatabase, teardownTestDatabase, setupTestApp, createTestUser, generateTestToken, createAuthenticatedRequest, clearDatabase } from '../utils/apiTestUtils'

describe('Content API', () => {
  let app: express.Application
  let authToken: string

  beforeAll(async () => {
    await setupTestDatabase()
    app = setupTestApp()
    
    const user = await createTestUser()
    authToken = generateTestToken(user._id)
  })

  afterAll(async () => {
    await teardownTestDatabase()
  })

  beforeEach(async () => {
    await clearDatabase()
  })

  describe('GET /api/content', () => {
    it('should return paginated content list', async () => {
      const response = await request(app)
        .get('/api/content')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('pagination')
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('should filter content by type', async () => {
      const response = await request(app)
        .get('/api/content')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ type: 'movie' })

      expect(response.status).toBe(200)
      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'movie' })
        ])
      )
    })

    it('should filter content by genre', async () => {
      const response = await request(app)
        .get('/api/content')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ genre: 'action' })

      expect(response.status).toBe(200)
    })

    it('should search content by title', async () => {
      const response = await request(app)
        .get('/api/content')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'test movie' })

      expect(response.status).toBe(200)
    })
  })

  describe('GET /api/content/:id', () => {
    it('should return content details for valid ID', async () => {
      // First, create some test content
      const Content = require('../../backend/src/models/Content').default
      const testContent = new Content({
        title: 'Test Movie',
        type: 'movie',
        overview: 'A test movie',
        poster: '/test-poster.jpg',
        releaseDate: '2024-01-01',
        rating: 8.5,
      })
      await testContent.save()

      const response = await request(app)
        .get(`/api/content/${testContent._id}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.title).toBe('Test Movie')
      expect(response.body.type).toBe('movie')
    })

    it('should return 404 for non-existent content', async () => {
      const fakeId = '507f1f77bcf86cd799439011'
      
      const response = await request(app)
        .get(`/api/content/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
    })

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/content/507f1f77bcf86cd799439011')

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/content/trending', () => {
    it('should return trending content', async () => {
      const response = await request(app)
        .get('/api/content/trending')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
    })

    it('should limit trending results', async () => {
      const response = await request(app)
        .get('/api/content/trending')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 5 })

      expect(response.status).toBe(200)
      expect(response.body.length).toBeLessThanOrEqual(5)
    })
  })

  describe('GET /api/content/recommended', () => {
    it('should return personalized recommendations', async () => {
      const response = await request(app)
        .get('/api/content/recommended')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
    })
  })

  describe('POST /api/content/:id/watch', () => {
    it('should record when user starts watching content', async () => {
      // Create test content
      const Content = require('../../backend/src/models/Content').default
      const testContent = new Content({
        title: 'Test Movie',
        type: 'movie',
        overview: 'A test movie',
      })
      await testContent.save()

      const response = await request(app)
        .post(`/api/content/${testContent._id}/watch`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ currentTime: 0 })

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Watch progress updated')
    })

    it('should update watch progress', async () => {
      // Create test content
      const Content = require('../../backend/src/models/Content').default
      const testContent = new Content({
        title: 'Test Movie',
        type: 'movie',
        overview: 'A test movie',
      })
      await testContent.save()

      // Start watching
      await request(app)
        .post(`/api/content/${testContent._id}/watch`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ currentTime: 0 })

      // Update progress
      const response = await request(app)
        .post(`/api/content/${testContent._id}/watch`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ currentTime: 1800 }) // 30 minutes

      expect(response.status).toBe(200)
    })
  })

  describe('POST /api/content/:id/rating', () => {
    it('should allow user to rate content', async () => {
      // Create test content
      const Content = require('../../backend/src/models/Content').default
      const testContent = new Content({
        title: 'Test Movie',
        type: 'movie',
        overview: 'A test movie',
      })
      await testContent.save()

      const response = await request(app)
        .post(`/api/content/${testContent._id}/rating`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 8 })

      expect(response.status).toBe(200)
      expect(response.body.rating).toBe(8)
    })

    it('should validate rating range', async () => {
      // Create test content
      const Content = require('../../backend/src/models/Content').default
      const testContent = new Content({
        title: 'Test Movie',
        type: 'movie',
        overview: 'A test movie',
      })
      await testContent.save()

      const response = await request(app)
        .post(`/api/content/${testContent._id}/rating`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 15 }) // Invalid rating

      expect(response.status).toBe(400)
    })
  })
})