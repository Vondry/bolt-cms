<template>
    <transition-group tag="div" class="listing--container" :class="{ 'is-dashboard': type === 'dashboard' }">
        <!-- check box -->
        <row-checkbox v-if="type !== 'dashboard'" :id="record.id" key="select"></row-checkbox>

        <!-- row -->
        <div key="row" class="listing__row" :class="`is-${size}`">
            <!-- column details / excerpt -->
            <div class="listing__row--item is-details">
                <a class="listing__row--item-title text-decoration-none" :href="record.extras.editLink" :title="slug">
                    {{ raw(trim(record.extras.title, 62)) }}
                </a>
                <span v-if="record.extras.feature" class="badge" :class="`badge-${record.extras.feature}`">{{
                    record.extras.feature
                }}</span>
                <span class="listing__row--item-title-excerpt">{{ raw(record.extras.excerpt) }}</span>
            </div>
            <!-- end column -->

            <!-- column thumbnail -->
            <div v-if="size === 'normal' && record.extras.image" class="listing__row--item is-thumbnail">
                <img
                    :src="record.extras.image.thumbnail"
                    style="width: 108px"
                    loading="lazy"
                    :alt="record.extras.image.alt"
                />
            </div>
            <!-- end column -->

            <!-- column meta -->
            <row-meta :type="type" :size="size" :record="record"></row-meta>
            <!-- end column -->

            <!-- excerpt for small screens -->
            <div class="listing__row--item is-excerpt">
                <span>{{ record.extras.excerpt }}</span>
            </div>

            <!-- column actions -->
            <row-actions :type="type" :record="record" :size="size" :labels="labels['actions']"></row-actions>
            <!-- end column -->
        </div>
    </transition-group>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import RowCheckbox from './_Checkbox.vue';
import RowMeta from './_Meta.vue';
import RowActions from './_Actions.vue';
import { trim, raw } from '../../../../../filters/string';
import { useGeneralStore } from '../../../store';

const props = defineProps<{
    record: Record<string, any>;
    labels: Record<string, any>;
}>();

const generalStore = useGeneralStore();
const type = computed(() => generalStore.type);
const size = computed(() => generalStore.rowSize);

const slug = computed(() => {
    if (props.record.fieldValues.slug === null) {
        return '';
    }
    if (typeof props.record.fieldValues.slug === 'string') {
        return props.record.fieldValues.slug;
    }
    // if slug has different locales, return the 0st one
    return props.record.fieldValues.slug[Object.keys(props.record.fieldValues.slug)[0]];
});
</script>
