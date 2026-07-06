<template>
    <ul class="admin__sidebar--menu">
        <li v-for="(item, index) in menu" :key="index">
            <p v-if="item.type === 'separator'" class="admin__sidebar--separator">
                {{ item.name }}
            </p>
            <a v-else-if="item.singleton" class="admin__sidebar--link text-decoration-none" :href="singleton(item)">
                <i class="fas me-2 link--icon" :class="item.icon"></i><span class="link--text">{{ item.name }}</span>
            </a>
            <a
                v-else
                class="admin__sidebar--link text-decoration-none"
                :class="{ 'has-menu': item.submenu !== null }"
                :href="item.link"
            >
                <i class="fas me-2 link--icon" :class="item.icon"></i><span class="link--text">{{ item.name }}</span>
                <template v-if="item.submenu !== null">
                    <i class="fas fa-caret-right link--caret"></i>
                    <sub-menu :item="item" :labels="labels"></sub-menu>
                </template>
            </a>
        </li>
    </ul>
</template>

<script setup lang="ts">
import SubMenu from './_SubMenu.vue';

defineProps<{
    menu: any[];
    labels: Record<string, string>;
}>();

function singleton(item: any) {
    if (item.submenu && item.submenu.length > 0) {
        return item.submenu[0].editLink;
    } else {
        return item.link_new;
    }
}
</script>
