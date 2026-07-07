import type { Pinia } from 'pinia';
import { mount } from '@vue/test-utils';
import RowIndex from '@/listing/Components/Table/Row/index.vue';
import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useGeneralStore } from '@/listing/store';

describe('Listing Row Component', () => {
    let generalStore: ReturnType<typeof useGeneralStore>;
    let pinia: Pinia;

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        generalStore = useGeneralStore();
    });

    const defaultProps = {
        record: {
            id: 1,
            fieldValues: {
                slug: 'my-slug',
            },
            extras: {
                title: 'My Title',
                editLink: '/edit/1',
                excerpt: 'This is an excerpt',
                feature: 'Featured',
                image: {
                    thumbnail: 'thumb.jpg',
                    alt: 'My Alt',
                },
            },
        },
        labels: {
            actions: { edit: 'Edit' },
        },
    };

    const mountComponent = () => {
        return mount(RowIndex, {
            props: defaultProps,
            global: {
                plugins: [pinia],
                stubs: {
                    'row-checkbox': true,
                    'row-meta': true,
                    'row-actions': true,
                },
            },
        });
    };

    it('renders correctly', () => {
        generalStore.type = 'articles';
        generalStore.rowSize = 'normal';

        const wrapper = mountComponent();

        // Check if elements are rendered
        expect(wrapper.find('.listing__row--item-title').text()).toBe('My Title');
        expect(wrapper.find('.badge').text()).toBe('Featured');
        expect(wrapper.find('.listing__row--item-title-excerpt').text()).toBe('This is an excerpt');

        // Thumbnail should be rendered
        const img = wrapper.find('.listing__row--item.is-thumbnail img');
        expect(img.exists()).toBe(true);
        expect(img.attributes('src')).toBe('thumb.jpg');

        // Stubs should exist
        expect(wrapper.findComponent({ name: 'row-checkbox' }).exists()).toBe(true);
        expect(wrapper.findComponent({ name: 'row-meta' }).exists()).toBe(true);
        expect(wrapper.findComponent({ name: 'row-actions' }).exists()).toBe(true);
    });

    it('does not render checkbox if type is dashboard', () => {
        generalStore.type = 'dashboard';
        const wrapper = mountComponent();

        expect(wrapper.findComponent({ name: 'row-checkbox' }).exists()).toBe(false);
    });

    it('does not render thumbnail if size is small', () => {
        generalStore.type = 'articles';
        generalStore.rowSize = 'small';
        const wrapper = mountComponent();

        expect(wrapper.find('.listing__row--item.is-thumbnail').exists()).toBe(false);
    });

    it('extracts slug correctly from multi-locale field', () => {
        generalStore.type = 'articles';
        const wrapper = mount(RowIndex, {
            props: {
                ...defaultProps,
                record: {
                    ...defaultProps.record,
                    fieldValues: {
                        slug: { en: 'slug-en', nl: 'slug-nl' },
                    },
                },
            },
            global: {
                plugins: [pinia],
                stubs: {
                    'row-checkbox': true,
                    'row-meta': true,
                    'row-actions': true,
                },
            },
        });

        const link = wrapper.find('a.listing__row--item-title');
        expect(link.attributes('title')).toBe('slug-en');
    });

    it('returns empty string if slug is null', () => {
        generalStore.type = 'articles';
        const wrapper = mount(RowIndex, {
            props: {
                ...defaultProps,
                record: {
                    ...defaultProps.record,
                    fieldValues: {
                        slug: null,
                    },
                },
            },
            global: {
                plugins: [pinia],
                stubs: {
                    'row-checkbox': true,
                    'row-meta': true,
                    'row-actions': true,
                },
            },
        });

        const link = wrapper.find('a.listing__row--item-title');
        expect(link.attributes('title')).toBe('');
    });
});
