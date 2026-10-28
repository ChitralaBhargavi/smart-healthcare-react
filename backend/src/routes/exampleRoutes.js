import { Router } from 'express'
import { emitDemoEvent } from '../utils/demoEmitter.js'
import { readExampleFile } from '../utils/fileExample.js'

const router = Router()

router.get('/', (req, res) => {
  res.json({
    message: 'Example GET route is working.',
    syllabusTopics: ['Express routing', 'JSON response'],
  })
})

router.post('/', (req, res) => {
  const { message } = req.body

  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({
      error: 'The request body must include a non-empty string named message.',
    })
  }

  return res.status(201).json({
    message: 'Example POST route received your message.',
    received: message.trim(),
  })
})

router.get('/file', async (req, res, next) => {
  try {
    const content = await readExampleFile()
    res.json({
      message: 'The example file was read asynchronously.',
      content: content.trim(),
    })
  } catch (error) {
    next(error)
  }
})

router.post('/event', (req, res) => {
  const eventCount = emitDemoEvent()
  res.status(201).json({
    message: 'A safe demonstration event was emitted.',
    eventCount,
  })
})

export default router
