import { mount, flushPromises } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ToolErrorList from '@/components/ToolErrorList.vue'

describe('ToolErrorList', () => {
  it('renders stats and grouped tool sections from demo data', async () => {
    const wrapper = mount(ToolErrorList, {
      props: { window: '7d' },
    })
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('By error code')
    expect(wrapper.text()).toContain('invalid_bytecode')
    expect(wrapper.text()).toContain('run_bytecode')
    expect(wrapper.text()).toContain('Group by tool')
  })

  it('filters when a code stat row is clicked', async () => {
    const wrapper = mount(ToolErrorList, {
      props: { window: '7d' },
    })
    await flushPromises()
    await wrapper.vm.$nextTick()

    const codeButton = wrapper.findAll('button').find((b) => b.text() === 'invalid_gas_limit')
    expect(codeButton).toBeDefined()
    await codeButton!.trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('after filters')
  })
})
