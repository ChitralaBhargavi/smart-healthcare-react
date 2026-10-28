import { EventEmitter } from 'node:events'

export const demoEmitter = new EventEmitter()
let emittedEventCount = 0

demoEmitter.on('demo-event', () => {
  emittedEventCount += 1
})

export function emitDemoEvent() {
  demoEmitter.emit('demo-event')
  return emittedEventCount
}
