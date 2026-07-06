import { mount } from '@vue/test-utils';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import $ from 'jquery';
import Select from '@/editor/Components/Select.vue';
import Multiselect from 'vue-multiselect';

describe('EditorSelect', () => {
    let wrapper;

    const defaultProps = {
        name: 'test_select',
        id: 'test_id',
        form: 'test_form',
        options: [
            {
                key: '1',
                value: 'One',
                link_to_record_url: 'http://example.com',
            },
            { key: '2', value: 'Two' },
            { key: '3', value: 'Three' },
        ],
        value: ['1', '2'],
        multiple: true,
        taggable: true,
    };

    beforeEach(() => {
        (window as any).$ = $;
        // Mock jQuery ajax
        vi.spyOn($, 'ajax').mockImplementation((options) => {
            return Promise.resolve([
                { key: 'remote1', value: 'Remote 1' },
                { key: 'remote2', value: 'Remote 2' },
            ]);
        });
        (window as any).selectCache = {};
        (window as any).requestCache = {};
    });

    afterEach(() => {
        if (wrapper) wrapper.unmount();
        vi.restoreAllMocks();
        delete (window as any).selectCache;
        delete (window as any).requestCache;
    });

    it('initializes and computes sanitized selected items', () => {
        wrapper = mount(Select, {
            props: defaultProps,
            global: { components: { multiselect: Multiselect } },
        });

        expect(wrapper.vm.selected).toHaveLength(2);
        expect(wrapper.vm.selected[0].key).toBe('1');

        expect(wrapper.vm.sanitized).toBe('["1","2"]');
        expect(wrapper.vm.fieldName).toBe('test_select[]');
        expect(wrapper.vm.hasRecordLinks).toBe(true);
    });

    it('sanitizes null selected items', async () => {
        wrapper = mount(Select, {
            props: { ...defaultProps, value: [] },
            global: { components: { multiselect: Multiselect } },
        });
        wrapper.vm.selected = null;
        expect(wrapper.vm.sanitized).toBe('[]');
    });

    it('sanitizes non-array selected items', () => {
        wrapper = mount(Select, {
            props: { ...defaultProps, value: '2', multiple: false },
            global: { components: { multiselect: Multiselect } },
        });

        expect(wrapper.vm.selected).toHaveLength(1);
        expect(wrapper.vm.selected[0].key).toBe('2');

        // simulate single object selection by multiselect
        wrapper.vm.selected = { key: '2', value: 'Two' };
        expect(wrapper.vm.sanitized).toBe('["2"]');
    });

    it('adds a tag', () => {
        wrapper = mount(Select, {
            props: defaultProps,
            global: { components: { multiselect: Multiselect } },
        });
        wrapper.vm.addTag('New Tag');

        expect(
            wrapper.vm.selectOptions.find((o) => o.key === 'New Tag'),
        ).toBeTruthy();
        expect(
            wrapper.vm.selected.find((o) => o.key === 'New Tag'),
        ).toBeTruthy();
    });

    it('removes an element via refs', () => {
        // use shallowMount/mount without stubbing multiselect or just mock the ref directly
        wrapper = mount(Select, {
            props: defaultProps,
            global: { components: { multiselect: Multiselect } },
        });
        const vselect = wrapper.findComponent({ ref: 'vselect' });
        vselect.vm.removeElement = vi.fn();
        wrapper.vm.removeElement({ key: '1' });
        expect(vselect.vm.removeElement).toHaveBeenCalledWith({ key: '1' });
    });

    it('loads options via fetchurl', async () => {
        wrapper = mount(Select, {
            props: {
                ...defaultProps,
                options: undefined,
                fetchurl: '/api/options',
                value: 'remote1',
            },
            global: { components: { multiselect: Multiselect } },
        });

        expect(wrapper.vm.isLoading).toBe(true);
        // Wait for ajax promise
        await new Promise((r) => setTimeout(r, 0));

        expect(wrapper.vm.isLoading).toBe(false);
        expect(wrapper.vm.selectOptions.length).toBe(2);
        expect(wrapper.vm.selected.length).toBe(1);
        expect(wrapper.vm.selected[0].key).toBe('remote1');
    });

    it('uses cache for fetchurl', async () => {
        (window as any).selectCache['/api/cache'] = [
            { key: 'cached1', value: 'Cached 1' },
        ];
        wrapper = mount(Select, {
            props: {
                ...defaultProps,
                options: undefined,
                fetchurl: '/api/cache',
                value: 'cached1',
            },
            global: { components: { multiselect: Multiselect } },
        });

        expect(wrapper.vm.selectOptions.length).toBe(1);
        expect(wrapper.vm.selected[0].key).toBe('cached1');
    });

    it('uses promise cache for fetchurl', async () => {
        const p = Promise.resolve([{ key: 'prom1', value: 'Prom 1' }]);
        (window as any).requestCache['/api/prom'] = p;
        wrapper = mount(Select, {
            props: {
                ...defaultProps,
                options: undefined,
                fetchurl: '/api/prom',
                value: 'prom1',
            },
            global: { components: { multiselect: Multiselect } },
        });

        await p;
        expect(wrapper.vm.selectOptions.length).toBe(1);
    });

    it('handles required field with no value', () => {
        wrapper = mount(Select, {
            props: { ...defaultProps, value: undefined, required: true },
            global: { components: { multiselect: Multiselect } },
        });

        // Should select the first option
        expect(wrapper.vm.selected.length).toBe(1);
        expect(wrapper.vm.selected[0].key).toBe('1');
    });

    it('handles drag and drop', () => {
        wrapper = mount(Select, {
            props: defaultProps,
            global: { components: { multiselect: Multiselect } },
        });

        const dragEvent = {
            preventDefault: vi.fn(),
            dataTransfer: {
                setData: vi.fn(),
                getData: () => '1', // incoming item
            },
            target: document.createElement('div'),
        };
        dragEvent.target.id = '1';
        dragEvent.target.setAttribute('draggable', 'true');

        wrapper.vm.drag(dragEvent);
        expect(dragEvent.dataTransfer.setData).toHaveBeenCalledWith(
            'text',
            '1',
        );

        // drop target
        const dropTarget = document.createElement('div');
        dropTarget.id = '2'; // outgoing item
        dropTarget.setAttribute('draggable', 'true');

        const dropEvent = {
            preventDefault: vi.fn(),
            dataTransfer: { getData: () => '1' },
            target: dropTarget,
        };

        wrapper.vm.dragOver(dropEvent);
        expect(dropTarget.classList.contains('dragover')).toBe(true);

        wrapper.vm.dragLeave(dropEvent);
        expect(dropTarget.classList.contains('dragover')).toBe(false);

        wrapper.vm.dragEnd(dragEvent);
        expect(dragEvent.target.classList.contains('dragging')).toBe(false);

        // Initial selected: '1', '2'
        // dragging '1' to '2', index of '1' is 0, '2' is 1
        // newPosition: 0 < 1 ? 1 + 1 : 1 = 2
        // splice(0,1) -> ['2'], splice(2,0,'1') -> ['2', '1'] (but '1' is pushed to the end)
        wrapper.vm.drop(dropEvent);

        expect(wrapper.vm.selected[0].key).toBe('2');
        expect(wrapper.vm.selected[1].key).toBe('1');

        wrapper.vm.allowDrop(dropEvent);
        expect(dropEvent.preventDefault).toHaveBeenCalled();
    });

    it('ignores drops when either selected item cannot be found', () => {
        wrapper = mount(Select, {
            props: defaultProps,
            global: { components: { multiselect: Multiselect } },
        });

        const dropTarget = document.createElement('div');
        dropTarget.id = 'missing';
        dropTarget.setAttribute('draggable', 'true');

        wrapper.vm.drop({
            preventDefault: vi.fn(),
            dataTransfer: { getData: () => '1' },
            target: dropTarget,
        });

        expect(wrapper.vm.selected.map((item) => item.key)).toEqual(['1', '2']);
    });

    it('filters raw string', () => {
        wrapper = mount(Select, {
            props: defaultProps,
            global: { components: { multiselect: Multiselect } },
        });
        expect(wrapper.vm.rawFilter('test')).toBe('test');
        expect(wrapper.vm.rawFilter(undefined)).toBe('');
    });
});
