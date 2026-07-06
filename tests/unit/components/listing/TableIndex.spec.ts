import type { Pinia } from 'pinia';
import { mount } from '@vue/test-utils';
import TableIndex from '@/listing/Components/Table/index.vue';
import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useListingStore } from '@/listing/store';
import draggable from 'vuedraggable';

describe('Listing Table Component', () => {
    let listingStore: ReturnType<typeof useListingStore>;
    let pinia: Pinia;

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        listingStore = useListingStore();
    });

    const defaultProps = {
        labels: {
            edit: 'Edit',
        },
    };

    const mountComponent = () => {
        return mount(TableIndex, {
            props: defaultProps,
            global: {
                plugins: [pinia],
                stubs: {
                    draggable,
                    'table-row': true,
                },
            },
        });
    };

    it('renders correctly with empty records', () => {
        const wrapper = mountComponent();
        expect(wrapper.find('.listing__records').exists()).toBe(true);
        expect(wrapper.findAllComponents({ name: 'table-row' }).length).toBe(0);
    });

    it('renders correctly with records', async () => {
        listingStore.records = [{ id: 1 }, { id: 2 }];
        const wrapper = mountComponent();
        await wrapper.vm.$nextTick();

        // Check if vuedraggable rendered items
        expect(wrapper.findComponent(draggable).exists()).toBe(true);
        // Note: when stubbed or even fully rendered, vuedraggable will render its slots
        // Depending on vuedraggable implementation in tests, we can verify the get/set logic directly.
    });

    it('gets records from store', () => {
        listingStore.records = [{ id: 1 }, { id: 2 }];
        const wrapper = mountComponent();
        const component = wrapper.vm as unknown as {
            records: { id: number }[];
        };

        expect(component.records).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('sets records to store', () => {
        const wrapper = mountComponent();
        const component = wrapper.vm as unknown as {
            records: { id: number }[];
        };

        component.records = [{ id: 3 }];

        expect(listingStore.records).toEqual([{ id: 3 }]);
    });
});
