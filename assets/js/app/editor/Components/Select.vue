<template>
    <div :id="`multiselect-${id}`" :class="classname" class="multiselect-bolt-wrapper">
        <multiselect
            ref="vselect"
            v-model="selected"
            :limit="1000"
            :multiple="multiple"
            :options="selectOptions"
            :options-limit="optionslimit"
            :searchable="autocomplete || taggable"
            :show-labels="false"
            :taggable="taggable"
            :disabled="readonly"
            :data-errormessage="errormessage || undefined"
            label="value"
            tag-placeholder="Add this as new tag"
            tag-position="bottom"
            track-by="key"
            :loading="isLoading"
            @tag="addTag"
        >
            <template v-if="name === 'status'" #singleLabel="slotProps">
                <span class="status me-2" :class="`is-${slotProps.option.key}`"></span>
                {{ rawFilter(slotProps.option.value) }}
            </template>
            <template v-else-if="hasRecordLinks" #singleLabel="slotProps">
                <!-- eslint-disable vue/no-v-html -->
                <span v-html="slotProps.option.value"></span>
                <!--eslint-enable-->
                <div v-if="slotProps.option.link_to_record_url" class="multiselect__tag__edit">
                    <a :href="slotProps.option.link_to_record_url" target="_blank" rel="noopener noreferrer">
                        <i class="far fa-edit me-0"></i>
                    </a>
                </div>
            </template>

            <template v-if="name === 'status'" #option="slotProps">
                <span class="status me-2" :class="`is-${slotProps.option.key}`"></span>
                {{ rawFilter(slotProps.option.value) }}
            </template>

            <template v-if="name !== 'status'" #tag="slotProps">
                <span
                    :class="{ empty: slotProps.option.value == '' }"
                    @drop="drop($event)"
                    @dragover="allowDrop($event)"
                >
                    <span
                        :id="slotProps.option.key"
                        :key="slotProps.option.value"
                        class="multiselect__tag"
                        :draggable="!taggable"
                        @dragstart="drag($event)"
                        @dragover="dragOver($event)"
                        @dragleave="dragLeave($event)"
                        @dragend="dragEnd($event)"
                    >
                        <div v-if="!taggable" class="multiselect__tag__drag">
                            <i class="fas fa-arrows-alt"></i>
                        </div>
                        <!-- eslint-disable-next-line vue/no-v-html -->
                        <span v-html="slotProps.option.value"></span>

                        <div v-if="slotProps.option.link_to_record_url" class="multiselect__tag__edit">
                            <a :href="slotProps.option.link_to_record_url" target="_blank" rel="noopener noreferrer">
                                <i class="far fa-edit me-0"></i>
                            </a>
                        </div>

                        <i
                            tabindex="1"
                            class="multiselect__tag-icon"
                            @keypress.enter.prevent="removeElement(slotProps.option)"
                            @mousedown.prevent="removeElement(slotProps.option)"
                        ></i>
                    </span>
                </span>
            </template>
        </multiselect>
        <input :id="id" type="hidden" :name="name" :form="form" :value="sanitized" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Multiselect from 'vue-multiselect';
import $ from 'jquery';
import { raw } from '../../../filters/string';

const props = defineProps<{
    value?: any[] | string;
    name?: string;
    id?: string;
    form?: string;
    options?: any[];
    optionslimit?: number;
    multiple?: boolean;
    taggable?: boolean;
    readonly?: boolean;
    classname?: string;
    autocomplete?: boolean;
    errormessage?: string | boolean;
    required?: string | boolean;
    fetchurl?: string;
}>();

const vselect = ref<InstanceType<typeof Multiselect> | null>(null);

const selected = ref<any[]>([]);
const isLoading = ref(false);
const selectOptions = ref<any[]>(props.options || []);

const sanitized = computed(() => {
    let filtered;

    if (selected.value === null) {
        return JSON.stringify([]);
    } else if (Array.isArray(selected.value)) {
        filtered = selected.value.map((item: any) => item.key);
        return JSON.stringify(filtered);
    } else {
        return JSON.stringify([(selected.value as any).key]);
    }
});

const fieldName = computed(() => {
    return props.name + '[]';
});

const hasRecordLinks = computed(() => {
    return selectOptions.value.some((option: any) => option && option.link_to_record_url);
});

function fixSelectedItems() {
    const _values = !props.value ? [] : Array.isArray(props.value) ? props.value : [props.value];

    let filterSelectedItems = _values
        .map((val: string | number) => {
            const item = selectOptions.value.filter((opt: any) => opt.key === val);
            if (item.length > 0) {
                return item[0];
            }
        })
        .filter((item: any) => undefined !== item);

    if (!!props.required && filterSelectedItems.length === 0) {
        filterSelectedItems = [selectOptions.value[0]];
    }

    selected.value = filterSelectedItems;
}

onMounted(() => {
    if (props.fetchurl) {
        (window as any).selectCache = (window as any).selectCache || {};
        (window as any).requestCache = (window as any).requestCache || {};

        if ((window as any).selectCache[props.fetchurl]) {
            selectOptions.value = (window as any).selectCache[props.fetchurl];
            fixSelectedItems();
        } else if ((window as any).requestCache[props.fetchurl]) {
            (window as any).requestCache[props.fetchurl].then((response: Record<string, any>[]) => {
                selectOptions.value = response;
                fixSelectedItems();
            });
        } else {
            isLoading.value = true;

            (window as any).requestCache[props.fetchurl] = $.ajax({
                url: props.fetchurl,
                dataType: 'json',
                cache: true,
            });
            (window as any).requestCache[props.fetchurl].then((response: Record<string, any>[]) => {
                selectOptions.value = response;
                (window as any).selectCache[props.fetchurl as string] = response;
                isLoading.value = false;
                fixSelectedItems();
            });
        }
    } else {
        fixSelectedItems();
    }
});

function addTag(newTag: string) {
    const tag = {
        key: newTag,
        value: newTag,
        selected: true,
    };
    selectOptions.value.push(tag);
    selected.value.push(tag);
}

function removeElement(element: any) {
    if (vselect.value) {
        (vselect.value as any).removeElement(element);
    }
}

function findDropElement(el: HTMLElement): HTMLElement {
    while (!el.hasAttribute('draggable') && el.parentNode) {
        el = el.parentNode as HTMLElement;
    }
    return el;
}

function drop(e: DragEvent) {
    e.preventDefault();

    const incomingId = e.dataTransfer?.getData('text');
    const outgoingId = findDropElement(e.target as HTMLElement).id;

    const incomingElement = selected.value.find((el: any) => '' + el.key === '' + incomingId);
    const outgoingElement = selected.value.find((el: any) => '' + el.key === '' + outgoingId);

    const incomingIndex = selected.value.indexOf(incomingElement);
    const outgoingIndex = selected.value.indexOf(outgoingElement);

    if (incomingIndex === -1 || outgoingIndex === -1) {
        return;
    }

    const newPosition = incomingIndex < outgoingIndex ? outgoingIndex + 1 : outgoingIndex;

    selected.value.splice(incomingIndex, 1);
    selected.value.splice(newPosition, 0, incomingElement);
}

function allowDrop(e: DragEvent) {
    e.preventDefault();
}

function drag(e: DragEvent) {
    $(e.target as HTMLElement).addClass('dragging');
    e.dataTransfer?.setData('text', (e.target as HTMLElement).id);
}

function dragOver(e: DragEvent) {
    const target = findDropElement(e.target as HTMLElement);
    if (!$(target).hasClass('dragging')) {
        $(target).addClass('dragover');
    }
}

function dragLeave(e: DragEvent) {
    const target = findDropElement(e.target as HTMLElement);
    $(target).removeClass('dragover');
}

function dragEnd(e: DragEvent) {
    const target = findDropElement(e.target as HTMLElement);
    $(target).removeClass('dragging');
}

function rawFilter(string: string) {
    return raw(string) || '';
}

defineExpose({
    vselect,
    selected,
    isLoading,
    selectOptions,
    sanitized,
    fieldName,
    hasRecordLinks,
    addTag,
    removeElement,
    drop,
    findDropElement,
    allowDrop,
    drag,
    dragOver,
    dragLeave,
    dragEnd,
    rawFilter,
});
</script>
