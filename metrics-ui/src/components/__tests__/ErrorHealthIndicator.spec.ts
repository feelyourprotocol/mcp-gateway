import { mount, flushPromises } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ErrorHealthIndicator from '@/components/ErrorHealthIndicator.vue'

describe('ErrorHealthIndicator', () => {
  it('shows error count from demo API', async () => {
    const wrapper = mount(ErrorHealthIndicator, {
      props: { window: '7d' },
    })
    await flushPromises()
    expect(wrapper.attributes('data-testid')).toBe('error-health-indicator')
    expect(wrapper.text()).toMatch(/\d/)
  })
})
