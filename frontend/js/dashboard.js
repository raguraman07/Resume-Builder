// ==========================================================================
// DASHBOARD CONTROLLER PIPELINE
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    const pageName = path.substring(path.lastIndexOf('/') + 1);
    if (pageName !== 'dashboard.html' && pageName !== '') return;
    
    activeAuth.onAuthStateChanged((user) => {
        if (user) {
            initDashboard(user);
        } else {
            window.location.href = "index.html";
        }
    });
});

let currentUserResumes = [];

function initDashboard(user) {
    const resumeGrid = document.getElementById('resume-grid');
    const totalResumesEl = document.getElementById('stat-total-resumes');
    const recentlyEditedEl = document.getElementById('stat-recent-resume');
    const platformsUsedEl = document.getElementById('stat-platforms-used');
    const searchInput = document.getElementById('dashboard-search');
    
    const createModal = document.getElementById('create-modal');
    const btnCloseModal = document.getElementById('close-modal');
    const formCreateResume = document.getElementById('form-create-resume');
    const quickCreateBtn = document.getElementById('quick-create-action-btn');

    // 1. READ: Load User Resumes
    async function loadResumes() {
        try {
            // Ensure security rules allow read access where 'userId' == request.auth.uid
            const snapshot = await activeDb.collection('resumes')
                                           .where('userId', '==', user.uid)
                                           .get();
            
            currentUserResumes = [];
            snapshot.docs.forEach(doc => {
                currentUserResumes.push({ ...doc.data(), id: doc.id });
            });
            
            currentUserResumes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            
            updateMetrics();
            renderRecentResumes();
            renderResumeCards(currentUserResumes);
        } catch (err) {
            console.error("Fetch Error:", err);
        }
    }
    
    function updateMetrics() {
        if (!totalResumesEl) return;
        totalResumesEl.textContent = currentUserResumes.length;
        if (currentUserResumes.length > 0) {
            recentlyEditedEl.textContent = currentUserResumes[0].title || "Untitled";
            const platforms = new Set(currentUserResumes.map(r => r.platform || 'general'));
            platformsUsedEl.textContent = platforms.size;
        } else {
            recentlyEditedEl.textContent = "None";
            platformsUsedEl.textContent = 0;
        }
    }

    function generateVisualMockup(resume) {
        const platform = resume.platform || 'general';
        const personal = (resume.resumeData && resume.resumeData.personalInfo) || {};
        const hasPhoto = personal.photo;
        const photoStyle = hasPhoto ? `background-image: url(${personal.photo});` : '';
        
        return `
            <div class="mock-resume">
                <div class="mock-header">
                    ${hasPhoto ? 
                        `<div class="mock-photo" style="${photoStyle}"></div>` : 
                        `<div class="mock-avatar"><i class="fas fa-user"></i></div>`
                    }
                    <div class="mock-name-block">
                        <div class="mock-line-title" style="width: ${personal.fullName ? '75%' : '60%'}; background: ${personal.fullName ? 'var(--text-primary)' : 'var(--text-muted)'}; height: ${personal.fullName ? '8px' : '6px'}"></div>
                        <div class="mock-line-subtitle" style="width: ${personal.jobTitle ? '60%' : '40%'}"></div>
                    </div>
                </div>
                <div class="mock-body">
                    <div class="mock-left-col">
                        <div class="mock-section-title"></div>
                        <div class="mock-text-line"></div>
                        <div class="mock-text-line short"></div>
                        <div class="mock-text-line very-short"></div>
                        <div class="mock-section-title" style="margin-top: 4px;"></div>
                        <div class="mock-text-line"></div>
                        <div class="mock-text-line short"></div>
                    </div>
                    <div class="mock-right-col">
                        <div class="mock-section-title" style="width: 90%;"></div>
                        <div class="mock-text-line"></div>
                        <div class="mock-text-line short"></div>
                        <div class="mock-section-title" style="width: 90%; margin-top: 4px;"></div>
                        <div class="mock-text-line"></div>
                        <div class="mock-text-line very-short"></div>
                    </div>
                </div>
                <div class="mock-accent-strip tag-${platform}-strip"></div>
            </div>
        `;
    }

    function renderRecentResumes() {
        const recentContainer = document.getElementById('recent-designs-container');
        const recentRow = document.getElementById('recent-resumes-row');
        if (!recentContainer || !recentRow) return;

        // Take top 3 recent resumes
        const recents = currentUserResumes.slice(0, 3);
        if (recents.length === 0) {
            recentContainer.style.display = 'none';
            return;
        }

        recentContainer.style.display = 'block';
        recentRow.innerHTML = '';

        recents.forEach(resume => {
            const card = document.createElement('div');
            card.className = 'recent-card';
            card.dataset.id = resume.id;
            card.innerHTML = `
                <div class="recent-thumb">
                    ${generateVisualMockup(resume)}
                </div>
                <div class="recent-info">
                    <div>
                        <h4 title="${resume.title}">${resume.title}</h4>
                        <p style="margin: 2px 0 0 0; font-size: 11px;">Optimized for ${resume.platform || 'general'}</p>
                    </div>
                    <div class="recent-date">
                        Edited ${new Date(resume.updatedAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                    </div>
                </div>
            `;
            card.addEventListener('click', () => {
                window.location.href = `builder.html?id=${resume.id}`;
            });
            recentRow.appendChild(card);
        });
    }
    
    function renderResumeCards(resumesToRender) {
        if (!resumeGrid) return;
    
        resumeGrid.innerHTML = `
            <div class="resume-card create-new-card" id="btn-trigger-create">
                <div class="create-content">
                    <i class="fas fa-plus-circle" style="font-size: 24px;"></i>
                    <span>Create Blank</span>
                </div>
            </div>
        `;
        
        document.getElementById('btn-trigger-create').addEventListener('click', openModalHandler);
        
        resumesToRender.forEach(resume => {
            const card = document.createElement('div');
            card.className = 'resume-card';
            card.innerHTML = `
                <div class="resume-preview-thumb">
                    <span class="resume-platform-tag tag-${resume.platform || 'general'}">${resume.platform || 'general'}</span>
                    
                    <!-- Visual Canva-style Mockup -->
                    ${generateVisualMockup(resume)}
                </div>
                <div class="resume-info">
                    <div>
                        <h4 title="${resume.title}">${resume.title}</h4>
                        <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--text-muted); font-weight: 500;">Optimized for ${resume.platform || 'general'}</p>
                    </div>
                    <div style="font-size: 11px; color: var(--text-muted); font-weight: 500; margin-top: 10px; border-top: 1px solid var(--border-color); padding-top: 8px;">
                        Updated ${new Date(resume.updatedAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                    </div>
                    <div class="resume-card-actions">
                        <button class="btn-card-action menu-edit" data-id="${resume.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-card-action menu-download" data-id="${resume.id}">
                            <i class="fas fa-download"></i> Download
                        </button>
                        <button class="btn-card-action menu-delete" data-id="${resume.id}">
                            <i class="fas fa-trash-alt"></i> Delete
                        </button>
                    </div>
                </div>
            `;
            resumeGrid.appendChild(card);
        });
        setupCardActions();
    }
    
    function setupCardActions() {
        // 1. Edit Action
        document.querySelectorAll('.menu-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                window.location.href = `builder.html?id=${btn.dataset.id}`;
            });
        });
    
        // 3. Download Action
        document.querySelectorAll('.menu-download').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                window.location.href = `builder.html?id=${btn.dataset.id}&download=true`;
            });
        });
    
        // 4. Delete Action
        document.querySelectorAll('.menu-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                if (!confirm("Are you sure you want to delete this design?")) return;
                try {
                    await activeDb.collection('resumes').doc(id).delete();
                    loadResumes(); // Refresh UI
                } catch (err) { alert("Delete failed: " + err.message); }
            });
        });
    }

    // Search Filter Implementation
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (query === '') {
                renderResumeCards(currentUserResumes);
            } else {
                const filtered = currentUserResumes.filter(resume => 
                    (resume.title && resume.title.toLowerCase().includes(query)) ||
                    (resume.platform && resume.platform.toLowerCase().includes(query))
                );
                renderResumeCards(filtered);
            }
        });
    }

    // Canva Quick Banner Tags click binding
    document.querySelectorAll('.action-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const category = tag.dataset.category;
            const selectEl = document.getElementById('resume-platform');
            if (selectEl) {
                selectEl.value = category;
            }
            openModalHandler();
            const titleInput = document.getElementById('resume-title');
            if (titleInput) {
                titleInput.focus();
            }
        });
    });
    
    // Modal Helpers
    function openModalHandler() { if (createModal) createModal.classList.add('active'); }
    if (quickCreateBtn) quickCreateBtn.addEventListener('click', openModalHandler);
    if (btnCloseModal) btnCloseModal.addEventListener('click', () => createModal.classList.remove('active'));

    // 2. CREATE: Form Submission
    if (formCreateResume) {
        formCreateResume.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('resume-title').value.trim();
            const resumeId = 'res-' + Date.now();
            
            const platform = document.getElementById('resume-platform').value || 'general';
            const newResume = {
                resumeId: resumeId,
                userId: user.uid,
                title: title,
                platform: platform,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            try {
                await activeDb.collection('resumes').doc(resumeId).set(newResume);
                createModal.classList.remove('active');
                window.location.href = `builder.html?id=${resumeId}`;
            } catch (err) {
                alert("Creation failed: " + err.message);
            }
        });
    }

    loadResumes();
}