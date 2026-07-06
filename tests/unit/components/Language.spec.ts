import { mount } from '@vue/test-utils';
import Language from '@/editor/Components/Language.vue';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('EditorLanguage Component', () => {
    let wrapper;
    let originalLocation;

    const locales = [
        { code: 'en', name: 'English', localizedname: 'English', link: '/en' },
        { code: 'nl', name: 'Dutch', localizedname: 'Nederlands', link: '/nl' },
    ];

    beforeEach(() => {
        originalLocation = window.location;
        delete window.location;
        window.location = { ...originalLocation, href: '', hash: '#hash' };
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
        wrapper = null;
        window.location = originalLocation;
    });

    it('sets locale to current if found in locales', () => {
        wrapper = mount(Language, {
            props: { label: 'Language', locales, current: 'nl' },
        });

        expect(wrapper.vm.locale).toEqual(locales[1]);
    });

    it('sets locale to first locale if current is provided but not found', () => {
        wrapper = mount(Language, {
            props: { label: 'Language', locales, current: 'fr' },
        });

        expect(wrapper.vm.locale).toEqual(locales[0]);
    });

    it('sets locale to first locale if current is not provided', () => {
        wrapper = mount(Language, {
            props: { label: 'Language', locales },
        });

        expect(wrapper.vm.locale).toEqual(locales[0]);
    });

    it('changes window.location.href when switchLocale is called', () => {
        wrapper = mount(Language, {
            props: { label: 'Language', locales },
        });

        wrapper.vm.switchLocale(locales[1]);

        expect(window.location.href).toBe('/nl#hash');
    });

    it('renders the slots properly', async () => {
        const MultiselectStub = {
            template: `<div>
                <slot name="singleLabel" :option="{ name: 'English', code: 'en' }"></slot>
                <slot name="option" :option="{ name: 'English', code: 'en' }"></slot>
            </div>`,
        };

        wrapper = mount(Language, {
            props: { label: 'Language', locales, current: 'en' },
            global: {
                stubs: {
                    multiselect: MultiselectStub,
                },
            },
        });

        // Wait for DOM update
        await wrapper.vm.$nextTick();

        // The text 'English' and '(en)' should be rendered in the single label and options
        expect(wrapper.text()).toContain('English');
        expect(wrapper.text()).toContain('(en)');
    });

    it('handles update:model-value emitted by multiselect', () => {
        wrapper = mount(Language, {
            props: { label: 'Language', locales },
        });

        // Use findComponent with class
        const multiselect = wrapper.findComponent('.multiselect');
        multiselect.vm.$emit('update:model-value', locales[1]);

        expect(window.location.href).toBe('/nl#hash');
    });

    it('does nothing when switchLocale receives empty selected', () => {
        wrapper = mount(Language, {
            props: { label: 'Language', locales },
        });

        // reset href
        window.location.href = '';

        wrapper.vm.switchLocale(null);

        expect(window.location.href).toBe('');
    });

    it('handles undefined locales', () => {
        wrapper = mount(Language, {
            props: { label: 'Language', current: 'en' },
        });

        expect(wrapper.vm.locale).toEqual({});
    });

    it('handles undefined locales and missing current', () => {
        wrapper = mount(Language, {
            props: { label: 'Language' },
        });

        expect(wrapper.vm.locale).toEqual({});
    });

    it('covers the option slot function directly', () => {
        wrapper = mount(Language, {
            props: { label: 'Language', locales },
        });

        const multiselect = wrapper.findComponent('.multiselect');
        if (multiselect.vm.$slots && multiselect.vm.$slots.option) {
            const vnodes = multiselect.vm.$slots.option({ option: locales[0] });
            expect(vnodes).toBeDefined();
        }
    });
});
