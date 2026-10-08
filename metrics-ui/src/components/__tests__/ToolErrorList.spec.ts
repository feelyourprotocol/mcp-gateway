import { mount, flushPromises } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ToolErrorList from '@/components/ToolErrorList.vue'

describe('ToolErrorList', () => {
  it('renders diagnostic code and message from demo fetch', async () => {
    const wrapper = mount(ToolErrorList, {
      props: { window: '7d' },
    })
    await flushPromises()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('odd_length')
    expect(wrapper.find('button').text()).toBe('Copy')
  })
})
