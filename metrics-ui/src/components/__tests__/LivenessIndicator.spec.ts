import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import LivenessIndicator from '@/components/LivenessIndicator.vue'

vi.mock('@/api/client', () => ({
  fetchLivenessCurrent: vi.fn(async () => ({
    state: 'degraded',
    lastCheckTs: Date.now(),
    lastOk: true,
    lastDurationMs: 4000,
    pollIntervalMs: 60_000,
    message: 'Health OK but slow (4000 ms).',
  })),
}))

describe('LivenessIndicator', () => {
  it('shows degraded label after load', async () => {
    const wrapper = mount(LivenessIndicator)
    await vi.waitFor(() => {
      expect(wrapper.find('[data-testid="liveness-indicator"]').attributes('title')).toContain(
        'slow',
      )
    })
    expect(wrapper.text()).toContain('MCP degraded')
  })
})
