<template>
    <div>
        <div class="input-group">
            <input
                :id="id"
                ref="inputField"
                class="form-control"
                type="password"
                :name="name"
                :value="inputValue"
                :required="required"
                :readonly="readonly"
                :data-errormessage="inputErrormessage"
                :pattern="inputPattern"
                :placeholder="inputPlaceholder"
                autocomplete="new-password"
                @input="measureStrength"
            />

            <div class="input-group-text p-0">
                <i ref="visibilityToggle" class="toggle-password fas fa-eye" @click="togglePassword"></i>
            </div>
        </div>
        <progress-bar v-if="strength" :value="score" :max="4" height="4px"></progress-bar>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, useTemplateRef } from 'vue';
import ProgressBar from './ProgressBar.vue';

declare global {
    interface Window {
        zxcvbn: (password: string) => { score: number };
    }
}

const props = defineProps<{
    value?: string | boolean;
    name?: string;
    id?: string;
    hidden?: boolean;
    strength?: boolean;
    required?: boolean;
    readonly?: boolean;
    errormessage?: string | boolean; //string if errormessage is set, and false otherwise
    pattern?: string | boolean;
    placeholder?: string | boolean;
}>();

const inputField = useTemplateRef<HTMLInputElement>('inputField');
const visibilityToggle = useTemplateRef<HTMLElement>('visibilityToggle');

const score = ref(0);

const inputValue = computed(() => normalizeStringAttribute(props.value, ''));
const inputErrormessage = computed(() => normalizeStringAttribute(props.errormessage));
const inputPattern = computed(() => normalizeStringAttribute(props.pattern));
const inputPlaceholder = computed(() => normalizeStringAttribute(props.placeholder));

onMounted(() => {
    if (!props.hidden) {
        (visibilityToggle.value as HTMLElement).click();
    }
    if (props.value && props.strength) {
        (inputField.value as HTMLInputElement).dispatchEvent(new Event('input'));
    }
});

function normalizeStringAttribute(value: string | boolean | undefined, fallback?: string) {
    return typeof value === 'string' ? value : fallback;
}

function togglePassword(event: Event) {
    const iconElement = event.target as HTMLElement;
    const inputElement = inputField.value as HTMLInputElement;
    const inputType = inputElement.getAttribute('type');

    if (inputType === 'password') {
        inputElement.setAttribute('type', 'text');
        iconElement.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        inputElement.setAttribute('type', 'password');
        iconElement.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

function measureStrength(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    if (props.strength) {
        score.value = window.zxcvbn(inputElement.value).score;
    }
}
</script>
