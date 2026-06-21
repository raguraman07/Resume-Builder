// Resume Builder Core UI Controller

let resumeId = null;
let resumeState = null;
let autoSaveTimer = null;
let zoomLevel = 1.0;
let isSaving = false;

// API Base URL
const API_BASE_URL = (window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : window.location.origin;

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    const pageName = path.substring(path.lastIndexOf('/') + 1);
    if (pageName !== 'builder.html') return;
    
    // Auth Guard check
    activeAuth.onAuthStateChanged((user) => {
        if (user) {
            initBuilder(user);
        }
    });
});

// 1. Fixed Initialization
// 1. Fixed Initialization
async function initBuilder(user) {
    const urlParams = new URLSearchParams(window.location.search);
    resumeId = urlParams.get('id');
    
    if (!resumeId) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    try {
        const doc = await activeDb.collection('resumes').doc(resumeId).get();
        if (!doc.exists) {
            alert("Resume not found.");
            window.location.href = 'dashboard.html';
            return;
        }
        
        resumeState = doc.data() || {}; // Ensure resumeState is at least an empty object
        if (!resumeState.resumeData) {
            resumeState.resumeData = {};
        }
        if (!resumeState.customStyle) {
            resumeState.customStyle = {};
        }
        
        // Initialize UI
        populateFormFields();
        updatePreview();
        triggerAtsCheck();
        
        setupWizardStepper();
        setupStylesSidebar();
        setupGuideSidebar();
        setupToolbarActions();
        setupDynamicLists();
        setupAutoSave();
        setupAISuggestions();
        setupPhotoUpload();
        
        if (urlParams.get('download') === 'true') {
            setTimeout(() => downloadPdf(), 1500);
        }
    } catch(err) {
        console.error("Initialization failed: ", err);
        alert("Failed to load resume workspace: " + err.message);
    }
}

// 2. Fixed Population Logic
function populateFormFields() {
    if (!resumeState) return;

    // Use empty objects as fallbacks
    const data = resumeState.resumeData || {};
    const info = data.personalInfo || {};
    const styles = resumeState.customStyle || {};

    // 1. Meta Title
    const titleEl = document.getElementById('meta-resume-title');
    if (titleEl) titleEl.textContent = resumeState.title || "My Resume";
    
    // 2. Helper for Safe Input Setting
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val || "";
    };

    // Personal Info
    setVal('info-fullname', info.fullName);
    setVal('info-jobtitle', info.jobTitle);
    setVal('info-email', info.email);
    setVal('info-phone', info.phone);
    setVal('info-address', info.address);
    setVal('info-linkedin', info.linkedIn);
    setVal('info-github', info.github);
    setVal('info-portfolio', info.portfolio);
    setVal('info-summary', info.summary);

    // Load resume photo
    const photoPreviewEl = document.getElementById('resume-photo-preview');
    const btnRemovePhoto = document.getElementById('btn-remove-resume-photo');
    if (info.photo) {
        if (photoPreviewEl) {
            photoPreviewEl.innerHTML = `<img src="${info.photo}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            photoPreviewEl.style.background = 'transparent';
        }
        if (btnRemovePhoto) btnRemovePhoto.style.display = 'inline-block';
    } else {
        if (photoPreviewEl) {
            photoPreviewEl.innerHTML = `<i class="fas fa-user-alt" style="font-size: 24px; color: var(--text-muted);"></i>`;
            photoPreviewEl.style.background = 'var(--bg-tertiary)';
        }
        if (btnRemovePhoto) btnRemovePhoto.style.display = 'none';
    }
    
    // 3. Dynamic Lists (Safe rendering)
    const renderList = (id, list, addFn) => {
        const container = document.getElementById(id);
        if (container) {
            container.innerHTML = '';
            if (Array.isArray(list)) list.forEach(item => addFn(item));
        }
    };

    renderList('experience-list', data.experience, addExperienceItem);
    renderList('education-list', data.education, addEducationItem);
    renderList('skills-list', data.skills, addSkillItem);
    renderList('projects-list', data.projects, addProjectItem);
    renderList('certs-list', data.certifications, addCertItem);
    renderList('custom-sections-list', data.customSections, addCustomSectionItem);
    
    // 4. Safe Style Settings
    setVal('style-font', styles.fontFamily || 'Inter');
    setVal('style-layout', styles.layout || 'two');
    setVal('style-spacing', styles.spacing || 'comfortable');

    // 5. Active Styling Swatches
    document.querySelectorAll('.swatch').forEach(sw => {
        if (sw.getAttribute('data-color') === styles.primaryColor) {
            sw.classList.add('active');
        } else {
            sw.classList.remove('active');
        }
    });
}

function setupPhotoUpload() {
    const photoInput = document.getElementById('info-photo-input');
    const photoPreviewEl = document.getElementById('resume-photo-preview');
    const btnRemovePhoto = document.getElementById('btn-remove-resume-photo');

    if (photoInput && photoPreviewEl && btnRemovePhoto) {
        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > 2 * 1024 * 1024) {
                alert("Image is too large. Please select an image smaller than 2MB.");
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = 180;
                    canvas.height = 180;
                    
                    const minDim = Math.min(img.width, img.height);
                    const sx = (img.width - minDim) / 2;
                    const sy = (img.height - minDim) / 2;
                    ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 180, 180);

                    const base64 = canvas.toDataURL('image/jpeg', 0.85);
                    
                    photoPreviewEl.innerHTML = `<img src="${base64}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                    photoPreviewEl.style.background = 'transparent';
                    btnRemovePhoto.style.display = 'inline-block';
                    
                    updatePreview();
                    saveDocumentDebounced();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });

        btnRemovePhoto.addEventListener('click', () => {
            photoPreviewEl.innerHTML = `<i class="fas fa-user-alt" style="font-size: 24px; color: var(--text-muted);"></i>`;
            photoPreviewEl.style.background = 'var(--bg-tertiary)';
            btnRemovePhoto.style.display = 'none';
            photoInput.value = '';
            
            updatePreview();
            saveDocumentDebounced();
        });
    }
}
// 2. Dynamic HTML compilation & live-preview injection
function updatePreview() {
    const previewPaper = document.getElementById('resume-preview');
    if (!previewPaper || !resumeState) return;
    
    // Read current input form values into resumeState object
    readFormValues();
    
    // Compile using selected template rendering function
    const html = compileTemplate(resumeState.templateId, resumeState.resumeData, resumeState.customStyle);
    previewPaper.innerHTML = html;
}

function readFormValues() {
    if (!resumeState) return;
    if (!resumeState.resumeData) {
        resumeState.resumeData = {};
    }
    if (!resumeState.customStyle) {
        resumeState.customStyle = {};
    }
    const data = resumeState.resumeData;
    
    // Personal Info
    const photoPreviewEl = document.getElementById('resume-photo-preview');
    const photoImg = photoPreviewEl ? photoPreviewEl.querySelector('img') : null;
    const photoBase64 = photoImg ? photoImg.src : "";

    data.personalInfo = {
        fullName: document.getElementById('info-fullname').value,
        jobTitle: document.getElementById('info-jobtitle').value,
        email: document.getElementById('info-email').value,
        phone: document.getElementById('info-phone').value,
        address: document.getElementById('info-address').value,
        linkedIn: document.getElementById('info-linkedin').value,
        github: document.getElementById('info-github').value,
        portfolio: document.getElementById('info-portfolio').value,
        summary: document.getElementById('info-summary').value,
        photo: photoBase64
    };
    
    // Experience List items
    data.experience = [];
    document.querySelectorAll('.exp-item-card').forEach(card => {
        data.experience.push({
            role: card.querySelector('.exp-role').value,
            company: card.querySelector('.exp-company').value,
            startDate: card.querySelector('.exp-start').value,
            endDate: card.querySelector('.exp-end').value,
            description: card.querySelector('.exp-desc').value
        });
    });
    
    // Education List items
    data.education = [];
    document.querySelectorAll('.edu-item-card').forEach(card => {
        data.education.push({
            degree: card.querySelector('.edu-degree').value,
            institution: card.querySelector('.edu-inst').value,
            startDate: card.querySelector('.edu-start').value,
            endDate: card.querySelector('.edu-end').value,
            grade: card.querySelector('.edu-grade').value
        });
    });
    
    // Skills List items
    data.skills = [];
    document.querySelectorAll('.skill-item-card').forEach(card => {
        const catName = card.querySelector('.skill-cat-name').value;
        const tags = [];
        card.querySelectorAll('.skill-tag span').forEach(tag => {
            tags.push(tag.textContent);
        });
        data.skills.push({ name: catName, tags: tags });
    });
    
    // Projects List items
    data.projects = [];
    document.querySelectorAll('.proj-item-card').forEach(card => {
        data.projects.push({
            name: card.querySelector('.proj-name').value,
            technologiesUsed: card.querySelector('.proj-tech').value,
            description: card.querySelector('.proj-desc').value,
            liveUrl: card.querySelector('.proj-url').value
        });
    });
    
    // Certifications List items
    data.certifications = [];
    document.querySelectorAll('.cert-item-input').forEach(input => {
        if (input.value.trim()) {
            data.certifications.push(input.value.trim());
        }
    });
    
    // Custom Sections List items
    data.customSections = [];
    document.querySelectorAll('.custom-sect-card').forEach(card => {
        data.customSections.push({
            sectionTitle: card.querySelector('.custom-title').value,
            sectionContent: card.querySelector('.custom-content').value
        });
    });
    
    // Styles
    resumeState.customStyle.fontFamily = document.getElementById('style-font').value;
    resumeState.customStyle.layout = document.getElementById('style-layout').value;
    resumeState.customStyle.spacing = document.getElementById('style-spacing').value;
}

// 3. Step wizard navigation
function setupWizardStepper() {
    const steps = ['personal', 'experience', 'education', 'skills', 'projects', 'certifications', 'custom'];
    let currentStepIdx = 0;
    
    const showStep = (idx) => {
        currentStepIdx = idx;
        // Hide all form panels
        document.querySelectorAll('.form-step-container').forEach(c => c.classList.remove('active'));
        
        // Show target panel
        const stepId = `step-${steps[idx]}`;
        const targetContainer = document.getElementById(stepId);
        if (targetContainer) targetContainer.classList.add('active');
        
        // Update indicator states
        document.querySelectorAll('.step-indicator').forEach((ind, i) => {
            ind.classList.remove('active', 'completed');
            if (i === idx) {
                ind.classList.add('active');
            } else if (i < idx) {
                ind.classList.add('completed');
            }
        });
        
        // Toggle footer buttons
        document.getElementById('btn-prev-step').style.visibility = idx === 0 ? 'hidden' : 'visible';
        document.getElementById('btn-next-step').textContent = idx === steps.length - 1 ? 'Finish' : 'Next';
    };
    
    // Click indicator numbers directly
    document.querySelectorAll('.step-indicator').forEach((ind, i) => {
        ind.addEventListener('click', () => {
            readFormValues();
            showStep(i);
            updatePreview();
        });
    });
    
    // Footer button navigation
    document.getElementById('btn-prev-step').addEventListener('click', () => {
        if (currentStepIdx > 0) {
            readFormValues();
            showStep(currentStepIdx - 1);
            updatePreview();
        }
    });
    
    document.getElementById('btn-next-step').addEventListener('click', () => {
        if (currentStepIdx < steps.length - 1) {
            readFormValues();
            showStep(currentStepIdx + 1);
            updatePreview();
            triggerAtsCheck(); // Check ATS score periodically as they progress
        } else {
            // Finish: Save and redirect
            readFormValues();
            saveDocument(true);
        }
    });
    
    showStep(0);
}

// 4. Styles drawer & Colors
function setupStylesSidebar() {
    const btnToggleStyle = document.getElementById('btn-toggle-styles');
    const styleDrawer = document.getElementById('styles-drawer');
    const btnCloseStyles = document.getElementById('close-styles');
    
    btnToggleStyle.addEventListener('click', () => {
        styleDrawer.classList.toggle('active');
        document.getElementById('ats-drawer').classList.remove('active');
        const guideDrawer = document.getElementById('guide-drawer');
        if (guideDrawer) guideDrawer.classList.remove('active');
    });
    
    btnCloseStyles.addEventListener('click', () => {
        styleDrawer.classList.remove('active');
    });
    
    // Primary styling swatches
    document.querySelectorAll('.swatch').forEach(sw => {
        sw.addEventListener('click', () => {
            document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
            sw.classList.add('active');
            
            const color = sw.getAttribute('data-color');
            resumeState.customStyle.primaryColor = color;
            updatePreview();
            saveDocumentDebounced();
        });
    });
    
    // Selection menus
    ['style-font', 'style-layout', 'style-spacing'].forEach(id => {
        document.getElementById(id).addEventListener('change', () => {
            updatePreview();
            saveDocumentDebounced();
        });
    });
}

// 4b. Guide drawer
function setupGuideSidebar() {
    const btnToggleGuide = document.getElementById('btn-toggle-guide');
    const guideDrawer = document.getElementById('guide-drawer');
    const btnCloseGuide = document.getElementById('close-guide');
    
    if (btnToggleGuide && guideDrawer && btnCloseGuide) {
        btnToggleGuide.addEventListener('click', () => {
            guideDrawer.classList.toggle('active');
            document.getElementById('styles-drawer').classList.remove('active');
            document.getElementById('ats-drawer').classList.remove('active');
        });
        
        btnCloseGuide.addEventListener('click', () => {
            guideDrawer.classList.remove('active');
        });
    }
}

// 5. Header / Preview Toolbar actions
function setupToolbarActions() {
    const paper = document.getElementById('resume-preview');
    
    // Zoom controls
    document.getElementById('btn-zoom-in').addEventListener('click', () => {
        if (zoomLevel < 1.4) {
            zoomLevel += 0.1;
            paper.style.transform = `scale(${zoomLevel})`;
        }
    });
    
    document.getElementById('btn-zoom-out').addEventListener('click', () => {
        if (zoomLevel > 0.6) {
            zoomLevel -= 0.1;
            paper.style.transform = `scale(${zoomLevel})`;
        }
    });
    
    // Fullscreen toggler
    const previewPanel = document.getElementById('preview-panel');
    document.getElementById('btn-fullscreen').addEventListener('click', () => {
        previewPanel.classList.toggle('fullscreen');
        const icon = document.querySelector('#btn-fullscreen i');
        if (previewPanel.classList.contains('fullscreen')) {
            icon.className = 'fas fa-compress';
        } else {
            icon.className = 'fas fa-expand';
        }
    });
    
    // Sidebar drawers
    const btnToggleAts = document.getElementById('btn-toggle-ats');
    const atsDrawer = document.getElementById('ats-drawer');
    const btnCloseAts = document.getElementById('close-ats');
    
    btnToggleAts.addEventListener('click', () => {
        atsDrawer.classList.toggle('active');
        document.getElementById('styles-drawer').classList.remove('active');
        const guideDrawer = document.getElementById('guide-drawer');
        if (guideDrawer) guideDrawer.classList.remove('active');
        triggerAtsCheck();
    });
    
    btnCloseAts.addEventListener('click', () => {
        atsDrawer.classList.remove('active');
    });
    
    // Template Switcher (Selector) in toolbar
    const toolbarTempSelect = document.getElementById('toolbar-template-select');
    if (toolbarTempSelect) {
        toolbarTempSelect.value = resumeState.templateId;
        toolbarTempSelect.addEventListener('change', (e) => {
            resumeState.templateId = e.target.value;
            updatePreview();
            saveDocumentDebounced();
        });
    }
    
    // Download PDF Action button
    document.getElementById('btn-download-pdf').addEventListener('click', (e) => {
        e.preventDefault();
        downloadPdf();
    });
    
    // Manual trigger form values update
    document.querySelectorAll('.form-input, .form-textarea, .form-select').forEach(input => {
        input.addEventListener('input', () => {
            updatePreview();
            saveDocumentDebounced();
        });
    });
}

// 6. Dynamic repeatable list fields
function setupDynamicLists() {
    // Experience
    document.getElementById('btn-add-experience').addEventListener('click', () => {
        addExperienceItem();
        updatePreview();
    });
    
    // Education
    document.getElementById('btn-add-education').addEventListener('click', () => {
        addEducationItem();
        updatePreview();
    });
    
    // Skills category
    document.getElementById('btn-add-skill-cat').addEventListener('click', () => {
        addSkillItem();
        updatePreview();
    });
    
    // Projects
    document.getElementById('btn-add-project').addEventListener('click', () => {
        addProjectItem();
        updatePreview();
    });
    
    // Certifications
    document.getElementById('btn-add-cert').addEventListener('click', () => {
        addCertItem();
        updatePreview();
    });
    
    // Custom section
    document.getElementById('btn-add-custom-sect').addEventListener('click', () => {
        addCustomSectionItem();
        updatePreview();
    });
}

function addExperienceItem(val = {}) {
    const list = document.getElementById('experience-list');
    const card = document.createElement('div');
    card.className = 'dynamic-item-card exp-item-card';
    card.innerHTML = `
        <div class="dynamic-item-card-header">
            <h4>Work Experience Block</h4>
            <button class="btn-remove-item"><i class="fas fa-trash-alt"></i> Remove</button>
        </div>
        <div class="form-group">
            <label class="form-label">Job Title / Role</label>
            <input type="text" class="form-input exp-role" value="${val.role || ''}" placeholder="e.g. Lead Software Engineer">
        </div>
        <div class="form-group">
            <label class="form-label">Company / Employer</label>
            <input type="text" class="form-input exp-company" value="${val.company || ''}" placeholder="e.g. Google">
        </div>
        <div style="display: flex; gap: 16px;">
            <div class="form-group" style="flex: 1;">
                <label class="form-label">Start Date</label>
                <input type="text" class="form-input exp-start" value="${val.startDate || ''}" placeholder="e.g. June 2021">
            </div>
            <div class="form-group" style="flex: 1;">
                <label class="form-label">End Date</label>
                <input type="text" class="form-input exp-end" value="${val.endDate || ''}" placeholder="e.g. Present">
            </div>
        </div>
        <div class="form-group">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <label class="form-label" style="margin-bottom:0;">Responsibilities & Achievements</label>
                <button class="btn btn-secondary btn-enhance-experience" style="padding:4px 10px; font-size:11px;"><i class="fas fa-magic"></i> AI Assist</button>
            </div>
            <textarea class="form-textarea exp-desc" rows="4" placeholder="Describe your achievements (STAR framework: Action + Impact)...">${val.description || ''}</textarea>
        </div>
    `;
    
    // Remove handler
    card.querySelector('.btn-remove-item').addEventListener('click', () => {
        card.remove();
        updatePreview();
        saveDocumentDebounced();
    });
    
    // Sync on typing
    card.querySelectorAll('.form-input, .form-textarea').forEach(inp => {
        inp.addEventListener('input', () => {
            updatePreview();
            saveDocumentDebounced();
        });
    });
    
    list.appendChild(card);
}

function addEducationItem(val = {}) {
    const list = document.getElementById('education-list');
    const card = document.createElement('div');
    card.className = 'dynamic-item-card edu-item-card';
    card.innerHTML = `
        <div class="dynamic-item-card-header">
            <h4>Academic Record</h4>
            <button class="btn-remove-item"><i class="fas fa-trash-alt"></i> Remove</button>
        </div>
        <div class="form-group">
            <label class="form-label">Degree / Certificate</label>
            <input type="text" class="form-input edu-degree" value="${val.degree || ''}" placeholder="e.g. M.S. Computer Science">
        </div>
        <div class="form-group">
            <label class="form-label">Institution / School</label>
            <input type="text" class="form-input edu-inst" value="${val.institution || ''}" placeholder="e.g. Stanford University">
        </div>
        <div style="display: flex; gap: 16px;">
            <div class="form-group" style="flex: 1;">
                <label class="form-label">Start Date</label>
                <input type="text" class="form-input edu-start" value="${val.startDate || ''}" placeholder="e.g. Sep 2018">
            </div>
            <div class="form-group" style="flex: 1;">
                <label class="form-label">End Date</label>
                <input type="text" class="form-input edu-end" value="${val.endDate || ''}" placeholder="e.g. June 2020">
            </div>
        </div>
        <div class="form-group">
            <label class="form-label">Grade / GPA (Optional)</label>
            <input type="text" class="form-input edu-grade" value="${val.grade || ''}" placeholder="e.g. 3.9/4.0">
        </div>
    `;
    
    card.querySelector('.btn-remove-item').addEventListener('click', () => {
        card.remove();
        updatePreview();
        saveDocumentDebounced();
    });
    
    card.querySelectorAll('.form-input').forEach(inp => {
        inp.addEventListener('input', () => {
            updatePreview();
            saveDocumentDebounced();
        });
    });
    
    list.appendChild(card);
}

function addSkillItem(val = {}) {
    const list = document.getElementById('skills-list');
    const card = document.createElement('div');
    card.className = 'dynamic-item-card skill-item-card';
    card.innerHTML = `
        <div class="dynamic-item-card-header">
            <h4>Skills Category Group</h4>
            <button class="btn-remove-item"><i class="fas fa-trash-alt"></i> Remove</button>
        </div>
        <div class="form-group">
            <label class="form-label">Category Name</label>
            <input type="text" class="form-input skill-cat-name" value="${val.name || ''}" placeholder="e.g. Technical Skills / Programming Languages">
        </div>
        <div class="form-group">
            <label class="form-label">Skills (Enter comma separated tags)</label>
            <div class="tags-input-container">
                <!-- tags render here -->
                <input type="text" class="skill-tag-input" placeholder="e.g. HTML, CSS, React">
            </div>
            <p style="font-size:11px; color:var(--text-muted); margin-top:4px;">Type tags and separate them with a comma (,) or press Enter.</p>
        </div>
    `;
    
    const tagsContainer = card.querySelector('.tags-input-container');
    const tagInput = card.querySelector('.skill-tag-input');
    
    function addTag(text) {
        if (!text.trim()) return;
        const tag = document.createElement('span');
        tag.className = 'skill-tag';
        tag.innerHTML = `<span>${text.trim()}</span><button type="button">&times;</button>`;
        tag.querySelector('button').addEventListener('click', () => {
            tag.remove();
            updatePreview();
            saveDocumentDebounced();
        });
        
        tagsContainer.insertBefore(tag, tagInput);
        updatePreview();
        saveDocumentDebounced();
    }
    
    // Input tag handlers
    tagInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(tagInput.value);
            tagInput.value = '';
        }
    });
    
    tagInput.addEventListener('blur', () => {
        addTag(tagInput.value);
        tagInput.value = '';
    });
    
    // Load pre-existing tags
    if (val.tags) {
        val.tags.forEach(t => addTag(t));
    }
    
    card.querySelector('.btn-remove-item').addEventListener('click', () => {
        card.remove();
        updatePreview();
        saveDocumentDebounced();
    });
    
    card.querySelector('.skill-cat-name').addEventListener('input', () => {
        updatePreview();
        saveDocumentDebounced();
    });
    
    list.appendChild(card);
}

function addProjectItem(val = {}) {
    const list = document.getElementById('projects-list');
    const card = document.createElement('div');
    card.className = 'dynamic-item-card proj-item-card';
    card.innerHTML = `
        <div class="dynamic-item-card-header">
            <h4>Project Profile</h4>
            <button class="btn-remove-item"><i class="fas fa-trash-alt"></i> Remove</button>
        </div>
        <div class="form-group">
            <label class="form-label">Project Name</label>
            <input type="text" class="form-input proj-name" value="${val.name || ''}" placeholder="e.g. Chatbot Interface">
        </div>
        <div class="form-group">
            <label class="form-label">Technologies Used</label>
            <input type="text" class="form-input proj-tech" value="${val.technologiesUsed || ''}" placeholder="e.g. React, Node, WebSockets">
        </div>
        <div class="form-group">
            <label class="form-label">Project Live URL / GitHub URL</label>
            <input type="text" class="form-input proj-url" value="${val.liveUrl || ''}" placeholder="e.g. https://github.com/profile/chatbot">
        </div>
        <div class="form-group">
            <label class="form-label">Description</label>
            <textarea class="form-textarea proj-desc" rows="3" placeholder="Brief details about the project...">${val.description || ''}</textarea>
        </div>
    `;
    
    card.querySelector('.btn-remove-item').addEventListener('click', () => {
        card.remove();
        updatePreview();
        saveDocumentDebounced();
    });
    
    card.querySelectorAll('.form-input, .form-textarea').forEach(inp => {
        inp.addEventListener('input', () => {
            updatePreview();
            saveDocumentDebounced();
        });
    });
    
    list.appendChild(card);
}

function addCertItem(text = '') {
    const list = document.getElementById('certs-list');
    const div = document.createElement('div');
    div.className = 'form-group';
    div.style.display = 'flex';
    div.style.gap = '10px';
    div.innerHTML = `
        <input type="text" class="form-input cert-item-input" value="${text}" placeholder="e.g. AWS Solutions Architect Associate" style="flex:1;">
        <button class="btn btn-secondary btn-remove-cert" style="padding:10px;"><i class="fas fa-trash-alt" style="color:#ef4444;"></i></button>
    `;
    
    div.querySelector('.btn-remove-cert').addEventListener('click', () => {
        div.remove();
        updatePreview();
        saveDocumentDebounced();
    });
    
    div.querySelector('input').addEventListener('input', () => {
        updatePreview();
        saveDocumentDebounced();
    });
    
    list.appendChild(div);
}

function addCustomSectionItem(val = {}) {
    const list = document.getElementById('custom-sections-list');
    const card = document.createElement('div');
    card.className = 'dynamic-item-card custom-sect-card';
    card.innerHTML = `
        <div class="dynamic-item-card-header">
            <h4>Custom Resume Section</h4>
            <button class="btn-remove-item"><i class="fas fa-trash-alt"></i> Remove</button>
        </div>
        <div class="form-group">
            <label class="form-label">Section Heading</label>
            <input type="text" class="form-input custom-title" value="${val.sectionTitle || ''}" placeholder="e.g. Publications / Languages / Interests">
        </div>
        <div class="form-group">
            <label class="form-label">Content Text</label>
            <textarea class="form-textarea custom-content" rows="4" placeholder="Enter bullet points or section text content...">${val.sectionContent || ''}</textarea>
        </div>
    `;
    
    card.querySelector('.btn-remove-item').addEventListener('click', () => {
        card.remove();
        updatePreview();
        saveDocumentDebounced();
    });
    
    card.querySelectorAll('.form-input, .form-textarea').forEach(inp => {
        inp.addEventListener('input', () => {
            updatePreview();
            saveDocumentDebounced();
        });
    });
    
    list.appendChild(card);
}

// 7. Auto Save Scheduler logic
function setupAutoSave() {
    // Setup manual save button listener
    document.getElementById('btn-save-resume').addEventListener('click', (e) => {
        e.preventDefault();
        saveDocument(false);
    });
}

function saveDocumentDebounced() {
    const saveStatus = document.getElementById('save-status');
    if (saveStatus) saveStatus.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Saving changes...';
    
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
        saveDocument(false);
    }, 4000); // Trigger auto-save 4 seconds after typing ends
}

async function saveDocument(redirectOnFinish = false) {
    if (!resumeState || !resumeId) return;
    
    readFormValues();
    resumeState.updatedAt = new Date().toISOString();
    
    try {
        isSaving = true;
        await activeDb.collection('resumes').doc(resumeId).set(resumeState);
        
        const saveStatus = document.getElementById('save-status');
        if (saveStatus) saveStatus.innerHTML = '<i class="fas fa-check-circle"></i> Saved';
        
        if (redirectOnFinish) {
            window.location.href = 'dashboard.html';
        }
    } catch (err) {
        console.error("Save failed:", err);
        const saveStatus = document.getElementById('save-status');
        if (saveStatus) saveStatus.innerHTML = '<i class="fas fa-exclamation-circle" style="color:#ef4444;"></i> Save failed';
    } finally {
        isSaving = false;
    }
}

// 8. Python API: ATS checker call
async function triggerAtsCheck() {
    if (!resumeState) return;
    
    readFormValues();
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/ats-check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                resumeData: resumeState.resumeData,
                platform: resumeState.platform || 'general'
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            updateAtsScoreUI(data);
        }
    } catch(err) {
        console.warn("ATS checker API call failed, falls back. Ensure python server is running on port 5000.", err);
    }
}

function updateAtsScoreUI(atsData) {
    const scoreVal = atsData.score || 0;
    const suggestions = atsData.suggestions || [];
    
    // Update Circle Arc conic gradient
    const progressCircle = document.getElementById('ats-progress-circle');
    const progressVal = document.getElementById('ats-progress-value');
    
    if (progressCircle && progressVal) {
        progressVal.textContent = `${scoreVal}%`;
        
        // Progress color based on score tier
        let scoreColor = '#6366f1'; // primary purple
        if (scoreVal >= 80) scoreColor = '#10b981'; // green
        else if (scoreVal < 50) scoreColor = '#ef4444'; // red
        
        progressCircle.style.background = `conic-gradient(${scoreColor} ${scoreVal * 3.6}deg, var(--bg-tertiary) 0deg)`;
    }
    
    // Render list feedback elements
    const feedbackList = document.getElementById('ats-suggestions-list');
    if (feedbackList) {
        feedbackList.innerHTML = '';
        
        if (suggestions.length === 0) {
            feedbackList.innerHTML = `<p style="font-size:12px; color:var(--text-muted); text-align:center;">No suggestions available. Keep updating the form!</p>`;
            return;
        }
        
        suggestions.forEach(item => {
            const div = document.createElement('div');
            div.className = `ats-item ${item.type || 'info'}`;
            
            let iconClass = 'fa-info-circle';
            if (item.type === 'success') iconClass = 'fa-check-circle';
            else if (item.type === 'warning') iconClass = 'fa-exclamation-triangle';
            
            div.innerHTML = `
                <i class="fas ${iconClass} ats-item-icon"></i>
                <div>
                    <strong>${item.section || 'General'}:</strong> ${item.message}
                </div>
            `;
            feedbackList.appendChild(div);
        });
    }
}

// 9. Python API: AI advisor recommendations call
function setupAISuggestions() {
    // 1. Dynamic click on experience "AI Assist" button
    document.getElementById('experience-list').addEventListener('click', async (e) => {
        const btn = e.target.closest('.btn-enhance-experience');
        if (!btn) return;
        
        const card = btn.closest('.exp-item-card');
        const textarea = card.querySelector('.exp-desc');
        const currentText = textarea.value.trim();
        
        if (!currentText) {
            alert("Please type a brief description of your role achievements first so the AI can enhance it.");
            return;
        }
        
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Improving...';
        
        const advice = await fetchAiSuggestions('experience', currentText);
        
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-magic"></i> AI Assist';
        
        if (advice && advice.success) {
            openAISuggestionsModal(textarea, advice.suggestion);
        } else {
            alert("Failed to fetch AI suggestion. Check backend app server logs.");
        }
    });
    
    // 2. Summary "Enhance with AI" button click
    const btnEnhanceSummary = document.getElementById('btn-enhance-summary');
    if (btnEnhanceSummary) {
        btnEnhanceSummary.addEventListener('click', async () => {
            const textarea = document.getElementById('info-summary');
            const currentText = textarea.value.trim();
            
            btnEnhanceSummary.disabled = true;
            btnEnhanceSummary.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enhancing...';
            
            const advice = await fetchAiSuggestions('summary', currentText);
            
            btnEnhanceSummary.disabled = false;
            btnEnhanceSummary.innerHTML = '<i class="fas fa-magic"></i> AI Suggestion';
            
            if (advice && advice.success) {
                openAISuggestionsModal(textarea, advice.suggestion);
            } else {
                alert("Failed to fetch AI suggestion.");
            }
        });
    }
}

async function fetchAiSuggestions(type, text) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/ai-suggest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: type,
                text: text,
                platform: resumeState.platform || 'general'
            })
        });
        
        if (response.ok) {
            return await response.json();
        }
    } catch(err) {
        console.error("AI service fetch failed: ", err);
    }
    return null;
}

function openAISuggestionsModal(targetTextarea, suggestionText) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content glass-card anim-scale-up" style="max-width: 550px;">
            <div class="modal-header">
                <h3>AI Writing Suggestions</h3>
                <button class="modal-close">&times;</button>
            </div>
            <p style="font-size:12px; color:var(--text-muted); margin-bottom:12px;">Here is your platform-optimized, professional statement suggestion:</p>
            <div style="background:var(--bg-tertiary); padding:20px; border-radius:var(--radius-sm); font-size:14px; font-style:italic; border-left:4px solid var(--primary); margin-bottom:24px; max-height:200px; overflow-y:auto;">
                ${suggestionText}
            </div>
            <div style="display:flex; justify-content:flex-end; gap:12px;">
                <button class="btn btn-secondary btn-cancel-suggestion">Cancel</button>
                <button class="btn btn-primary btn-apply-suggestion"><i class="fas fa-check"></i> Apply to Form</button>
            </div>
        </div>
    `;
    
    const closeModal = () => modal.remove();
    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.querySelector('.btn-cancel-suggestion').addEventListener('click', closeModal);
    
    modal.querySelector('.btn-apply-suggestion').addEventListener('click', () => {
        targetTextarea.value = suggestionText;
        updatePreview();
        saveDocumentDebounced();
        closeModal();
    });
    
    document.body.appendChild(modal);
}

// 10. PDF Export handler
async function downloadPdf() {
    const btn = document.getElementById('btn-download-pdf');
    const originalText = btn.innerHTML;
    
    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';
        
        readFormValues();
        
        // Compile the template into raw HTML content specifically for print
        const templateHtml = compileTemplate(resumeState.templateId, resumeState.resumeData, resumeState.customStyle);
        
        const personalInfo = (resumeState.resumeData && resumeState.resumeData.personalInfo) || {};
        const fullName = personalInfo.fullName || 'Resume';
        const jobTitle = personalInfo.jobTitle || 'Profile';
        const filename = `${fullName}_${jobTitle}_Resume.pdf`.replace(/\s+/g, '_');
            
        const response = await fetch(`${API_BASE_URL}/api/generate-pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                html: templateHtml,
                filename: filename
            })
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } else {
            const errJson = await response.json();
            alert("PDF generation error: " + (errJson.message || "Failed on server"));
        }
        
    } catch(err) {
        console.error("PDF download failed: ", err);
        alert("Failed to download PDF. Please make sure the backend Flask server is running locally on port 5000.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}
