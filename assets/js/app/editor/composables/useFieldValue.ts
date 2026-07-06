import { ref, type Ref } from 'vue';

type FieldValue = string | number | undefined;

/**
 * Composition-API replacement for the `mixins/value` field mixin:
 * `val` holds the editable field value, `rawVal` its HTML-unescaped form.
 * Both are writable refs initialized from the `value` prop, matching the
 * mixin's `data` + `mounted` behavior.
 */
export function useFieldValue(value: FieldValue) {
    const val: Ref<FieldValue> = ref(value);

    // Make sure the "rawVal" is 'unescaped'
    const node = document.createElement('textarea');
    node.innerHTML = String(value ?? '');
    const rawVal = ref(node.value);

    return { val, rawVal };
}
