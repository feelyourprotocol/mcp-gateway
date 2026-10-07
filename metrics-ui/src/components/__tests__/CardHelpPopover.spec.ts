import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import CardHelpPopover from '@/components/CardHelpPopover.vue'

describe('CardHelpPopover', () => {
  it('toggles help copy on button click', async () => {
    const wrapper = mount(CardHelpPopover, {
      props: { text: 'Example help copy.' },
      attachTo: document.body,
    })
    const button = wrapper.get('[aria-label="About this metric"]')
    expect(wrapper.text()).not.toContain('Example help copy')
    await button.trigger('click')
    expect(wrapper.text()).toContain('Example help copy')
    await button.trigger('click')
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
