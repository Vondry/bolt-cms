<template>
    <div id="multiselect-localeswitcher" class="form-group">
        <label>{{ label }}</label>
        <multiselect
            v-model="locale"
            track-by="name"
            label="localizedname"
            :options="locales || []"
            :searchable="false"
            :show-labels="false"
            :limit="1"
            @update:model-value="switchLocale"
        >
            <template #singleLabel="slotProps">
                <span class="fp me-1" :class="slotProps.option.flag"></span>
                <span>
                    {{ slotProps.option.name }}
                    <small style="white-space: nowrap">({{ slotProps.option.code }})</small>
                </span>
            </template>
            <template #option="slotProps">
                <span class="fp me-1" :class="slotProps.option.flag"></span>
                <span>
                    {{ slotProps.option.name }}
                    <small style="white-space: nowrap">({{ slotProps.option.code }})</small>
                </span>
            </template>
        </multiselect>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Multiselect from 'vue-multiselect';

const props = defineProps<{
    label?: string;
    locales?: Record<string, any>[];
    current?: string;
}>();

const locale = ref<any>({});

onMounted(() => {
    const localesList = props.locales || [];
    if (props.current) {
        const currentLocale = localesList.find((l) => l.code === props.current);
        if (currentLocale) {
            locale.value = currentLocale;
        } else {
            locale.value = localesList[0] || {};
        }
    } else {
        locale.value = localesList[0] || {};
    }
});

function switchLocale(selected: any) {
    if (!selected) return;
    const link = selected.link + location.hash;
    window.location.href = link;
    return link;
}

defineExpose({
    locale,
    switchLocale,
});
</script>
