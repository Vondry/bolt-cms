import Axios from 'axios';
import { Modal } from 'bootstrap';
import { renable } from '../../patience-is-a-virtue';
import { resetModalContent } from '../../modal';

export type ServerFile = {
    group?: string;
    value: string;
    text: string;
    base_url_path?: string;
};

type BrowserOptions = {
    initialFilelist?: string;
    extensions: string[];
    labels: Record<string, string>;
    modalTitlePrefix: string;
    generateModalContent: (inputOptions: ServerFile[]) => string;
    onSelect: (selectedFile: string) => void;
    onOpenError: (error: unknown) => void;
    onNavigateError: (error: unknown) => void;
};

export function createServerFileBrowser(options: BrowserOptions) {
    let currentFilelist = options.initialFilelist;

    function filterServerFiles(files: ServerFile[]) {
        return files.filter((file) => {
            if (file.group === 'directories') {
                return true;
            }

            const ext = /(?:\.([^.]+))?$/.exec(file.text)?.[1];
            return ext ? options.extensions.includes(ext) : false;
        });
    }

    function selectServerFile(event: Event) {
        return loadModal(currentFilelist, 'open', event);
    }

    function navigateDirectory() {
        return loadModal(currentFilelist, 'navigate');
    }

    function loadModal(filelist: string | undefined, mode: 'open' | 'navigate', event?: Event) {
        return Axios.get(filelist)
            .then((res) => {
                const inputOptions = filterServerFiles(res.data);
                if (mode === 'open') {
                    openModal(event as Event, inputOptions);
                } else {
                    refreshModal(inputOptions);
                }
            })
            .catch((err) => {
                if (mode === 'open') {
                    options.onOpenError(err);
                } else {
                    options.onNavigateError(err);
                }
                renable();
            });
    }

    function getModalParts() {
        const resourcesModal = document.getElementById('resourcesModal');
        const bootstrapResourcesModal = document.querySelector('#resourcesModal');
        const resourcesModalObject = Modal.getOrCreateInstance(bootstrapResourcesModal);

        return {
            resourcesModal,
            resourcesModalObject,
            modalDialog: resourcesModal.querySelector('.modal-dialog'),
            modalTitle: resourcesModal.querySelector('.modal-title'),
            modalBody: resourcesModal.querySelector('.modal-body'),
            modalFooter: resourcesModal.querySelector('.modal-footer'),
        };
    }

    function openModal(event: Event, inputOptions: ServerFile[]) {
        const { resourcesModal, modalDialog, modalTitle, modalBody, modalFooter } = getModalParts();
        const button = (event.currentTarget || event.target) as HTMLElement;
        const dialogClass = button.getAttribute('data-modal-dialog-class');

        if (dialogClass) {
            modalDialog.classList.add(dialogClass);
        }

        modalTitle.innerHTML = button.getAttribute('data-modal-title') || '';
        modalBody.innerHTML = options.generateModalContent(inputOptions);
        modalFooter?.remove();

        bindModalInteractions();

        resourcesModal.addEventListener(
            'hidden.bs.modal',
            () => {
                const selectedInput = modalBody.querySelector(
                    'input[type=checkbox]:checked',
                ) as HTMLInputElement | null;

                if (selectedInput) {
                    options.onSelect(selectedInput.value.replace('files/', ''));
                }

                resetModalContent(options.labels);
            },
            { once: true },
        );

        renable();
    }

    function refreshModal(inputOptions: ServerFile[]) {
        const { modalTitle, modalBody } = getModalParts();
        const folderPathChunks = inputOptions[0].value.split('/');
        folderPathChunks.pop();
        const folderPath = folderPathChunks.join('/');

        modalTitle.innerHTML = `${options.modalTitlePrefix}: <i class="fas fa-solid fa-folder-tree"></i>${folderPath}`;
        modalBody.innerHTML = options.generateModalContent(inputOptions);

        bindModalInteractions();
    }

    function bindModalInteractions() {
        const { resourcesModal, resourcesModalObject, modalBody } = getModalParts();

        resourcesModal.querySelectorAll('.directory').forEach((link) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                currentFilelist = (link as HTMLAnchorElement).href;
                navigateDirectory();
            });
        });

        modalBody.querySelectorAll('.form-check-input').forEach((card) => {
            card.addEventListener('click', () => {
                resourcesModalObject.hide();
            });
        });
    }

    return {
        filterServerFiles,
        selectServerFile,
        navigateDirectory,
    };
}
