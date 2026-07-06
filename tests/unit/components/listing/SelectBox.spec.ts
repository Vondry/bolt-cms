import type { Pinia } from 'pinia';
import { mount } from '@vue/test-utils';
import SelectBox from '@/listing/Components/SelectBox.vue';
import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useSelectingStore } from '@/listing/store';
import Multiselect from 'vue-multiselect';

describe('Listing SelectBox Component', () => {
    let selectingStore: ReturnType<typeof useSelectingStore>;
    let pinia: Pinia;

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        selectingStore = useSelectingStore();
    });

    const defaultProps = {
        singular: 'record',
        plural: 'records',
        labels: {
            selected: 'selected',
            update_all: 'Update All',
            status_to_published: 'Publish',
            status_to_draft: 'Draft',
            status_to_held: 'Hold',
            delete: 'Delete',
        },
        csrftoken: 'fake-token',
        backendPrefix: '/bolt/',
    };

    const mountComponent = () => {
        return mount(SelectBox, {
            props: defaultProps,
            global: {
                plugins: [pinia],
                stubs: {
                    Multiselect,
                },
            },
        });
    };

    it('does not render when selectedCount is 0', () => {
        const wrapper = mountComponent();
        expect(wrapper.find('.card').exists()).toBe(false);
    });

    it('renders singular text when selectedCount is 1', async () => {
        const wrapper = mountComponent();
        selectingStore.select(1);
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.card').exists()).toBe(true);
        expect(wrapper.find('.card-header').text()).toContain(
            '1record selected',
        );
    });

    it('renders plural text when selectedCount is > 1', async () => {
        const wrapper = mountComponent();
        selectingStore.select(1);
        selectingStore.select(2);
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.card-header').text()).toContain(
            '2records selected',
        );
    });

    it('derives selectedCount from unique selected records', async () => {
        const wrapper = mountComponent();
        selectingStore.select(1);
        selectingStore.select(1);
        selectingStore.select(2);
        selectingStore.deSelect(999);
        await wrapper.vm.$nextTick();

        expect(selectingStore.selected).toEqual([1, 2]);
        expect(selectingStore.selectedCount).toBe(2);
        expect(wrapper.find('.card-header').text()).toContain(
            '2records selected',
        );
    });

    it('disables submit button when no action is selected', async () => {
        selectingStore.select(1);
        const wrapper = mountComponent();
        await wrapper.vm.$nextTick();

        const button = wrapper.find('button[type="submit"]');
        expect(button.attributes('disabled')).toBeDefined();
    });

    it('sets the correct postUrl when an action is selected', async () => {
        selectingStore.select(1);
        const wrapper = mountComponent();
        await wrapper.vm.$nextTick();

        const component = wrapper.vm as unknown as {
            selectedAction: { key: string };
        };
        component.selectedAction = { key: 'status/published' };
        await wrapper.vm.$nextTick();

        const form = wrapper.find('form');
        expect(form.attributes('action')).toBe('/bolt/bulk/status/published');

        const button = wrapper.find('button[type="submit"]');
        expect(button.attributes('disabled')).toBeUndefined();
    });

    it('renders hidden inputs correctly', async () => {
        selectingStore.select(10);
        selectingStore.select(20);
        const wrapper = mountComponent();
        await wrapper.vm.$nextTick();

        const csrfInput = wrapper.find('input[name="_csrf_token"]');
        expect(csrfInput.attributes('value')).toBe('fake-token');

        const recordsInput = wrapper.find('input[name="records"]');
        expect(recordsInput.attributes('value')).toBe('10,20');
    });
});
