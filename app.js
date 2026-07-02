/**
 * NA STUDIO - CORE APPLICATIVE ENGINE 
 * High Performance Native Architecture (Client-Side Only)
 */

// STATE MANAGER REGISTRY
const LauncherState = {
    activeView: 'dashboard',
    database: null,
    projectsRegistry: [],
    activeProject: null,
    playbackPointer: 0,
    maxDuration: 10, 
    isPlaying: false,
    selectedLayerId: null,
    renderingScale: 1,
    loopEnabled: false,
    undoStack: [],
    redoStack: [],
    mediaCache: new Map() // Caches local ObjectURLs to prevent browser garbage collection leak
};

// PRESET ARCHEPRIME ENGINE TEMPLATES DEFINITIONS
let TemplatesRegistry = [];

// SYNTHETIC CINEMATIC AUDIO GENERATOR (Pure Sound Design API Integration)
const SoundDesignFX = {
    ctx: null,
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },
    triggerCinematicDrop() {
        this.init();
        const now = this.ctx.currentTime;
        
        // Sub Bass Oscillator Channel
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(75, now);
        subOsc.frequency.exponentialRampToValueAtTime(25, now + 1.2);
        
        subGain.gain.setValueAtTime(0.7, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        
        // Transient Click Attack Channel
        const clickOsc = this.ctx.createOscillator();
        const clickGain = this.ctx.createGain();
        clickOsc.type = 'triangle';
        clickOsc.frequency.setValueAtTime(1200, now);
        clickOsc.frequency.exponentialRampToValueAtTime(100, now + 0.08);
        
        clickGain.gain.setValueAtTime(0.2, now);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        
        // Node Pipeline Coupling
        subOsc.connect(subGain);
        subGain.connect(this.ctx.destination);
        clickOsc.connect(clickGain);
        clickGain.connect(this.ctx.destination);
        
        // Execution Sync
        subOsc.start(now);
        subOsc.stop(now + 1.6);
        clickOsc.start(now);
        clickOsc.stop(now + 0.15);
    }
};

// ENTRANCE PARTICLE ANIMATION MATRIX CLASSES
class DustParticle {
    constructor(w, h) {
        this.canvasWidth = w;
        this.canvasHeight = h;
        this.reset();
    }
    reset() {
        this.x = Math.random() * this.canvasWidth;
        this.y = Math.random() * this.canvasHeight;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.2;
        this.speedY = -Math.random() * 0.4 - 0.1;
        this.alpha = Math.random() * 0.5 + 0.2;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.y < 0) this.reset();
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = '#D4AF37';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class SparkParticle {
    constructor(w, h) {
        this.canvasWidth = w;
        this.canvasHeight = h;
        this.reset();
    }
    reset() {
        this.x = Math.random() * this.canvasWidth;
        this.y = this.canvasHeight + 10;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 1.5;
        this.speedY = -Math.random() * 2 - 0.5;
        this.life = 1;
        this.decay = Math.random() * 0.015 + 0.005;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
        if (this.life <= 0) this.reset();
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = `rgba(255, ${216 + Math.random() * 39}, 107, ${this.life})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// APPLICATION INITIALIZER
document.addEventListener('DOMContentLoaded', () => {
    initLocalDatastore();
    parseTemplateData();
    mountEntranceFX();
    bindInterfaceEvents();
    studioCompositionLoop();
});

// PARSE HARDCODED METADATA RECONSTRUCT
function parseTemplateData() {
    const jsonPayload = document.getElementById('templates-registry-payload').textContent;
    TemplatesRegistry = JSON.parse(jsonPayload);
}

// STORAGE ENGINE - INDEXEDDB INTERACTION HOOKS
function initLocalDatastore() {
    const request = indexedDB.open('NAStudioDB', 1);
    request.onupgradeneeded = (e) => {
        let db = e.target.result;
        if (!db.objectStoreNames.contains('projects')) {
            db.createObjectStore('projects', { keyPath: 'id' });
        }
    };
    request.onsuccess = (e) => {
        LauncherState.database = e.target.result;
        syncSavedProjectsShelf();
    };
}

function syncSavedProjectsShelf() {
    if (!LauncherState.database) return;
    const transaction = LauncherState.database.transaction('projects', 'readonly');
    const store = transaction.objectStore('projects');
    const request = store.getAll();
    
    request.onsuccess = () => {
        LauncherState.projectsRegistry = request.result;
        const targetShelf = document.getElementById('recent-projects-list');
        if (LauncherState.projectsRegistry.length === 0) {
            targetShelf.innerHTML = `<div class="empty-shelf-notice">No recent local projects found. Create a new one to begin.</div>`;
            return;
        }
        targetShelf.innerHTML = '';
        LauncherState.projectsRegistry.forEach(p => {
            const card = document.createElement('div');
            card.className = 'action-card';
            card.style.padding = '15px 25px';
            card.style.display = 'flex';
            card.style.justifyContent = 'space-between';
            card.style.alignItems = 'center';
            card.innerHTML = `
                <div style="text-align: left;">
                    <h4 style="font-size:14px;color:#D4AF37;"><i class="fa-solid fa-square-poll-horizontal"></i> ${p.name}</h4>
                    <span style="font-size:11px;color:#666;">LayersCount: ${p.layers.length} | Scale: ${p.resolution}</span>
                </div>
                <button class="ctrl-btn btn-highlight load-trigger" data-pid="${p.id}">Load Studio</button>
            `;
            targetShelf.appendChild(card);
        });
        
        // Bind Project Restorers
        targetShelf.querySelectorAll('.load-trigger').forEach(b => {
            b.addEventListener('click', (e) => {
                const pid = e.target.getAttribute('data-pid');
                restoreActiveProjectState(pid);
            });
        });
    };
}

// ENTRANCE ANIMATION PIPELINE
function mountEntranceFX() {
    const eCanvas = document.getElementById('entrance-canvas');
    const sCanvas = document.getElementById('sparks-canvas');
    const eCtx = eCanvas.getContext('2d');
    const sCtx = sCanvas.getContext('2d');
    
    function resizeContainers() {
        eCanvas.width = window.innerWidth;
        eCanvas.height = window.innerHeight;
        sCanvas.width = window.innerWidth;
        sCanvas.height = 160;
    }
    window.addEventListener('resize', resizeContainers);
    resizeContainers();
    
    const dustArray = Array.from({length: 45}, () => new DustParticle(eCanvas.width, eCanvas.height));
    const sparksArray = Array.from({length: 30}, () => new SparkParticle(sCanvas.width, sCanvas.height));
    
    function executionLoop() {
        eCtx.clearRect(0, 0, eCanvas.width, eCanvas.height);
        // Soft Fog Overlay Atmosphere
        eCtx.fillStyle = 'rgba(5, 5, 5, 0.08)';
        eCtx.fillRect(0, 0, eCanvas.width, eCanvas.height);
        
        dustArray.forEach(p => { p.update(); p.draw(eCtx); });
        
        sCtx.clearRect(0, 0, sCanvas.width, sCanvas.height);
        sparksArray.forEach(p => { p.update(); p.draw(sCtx); });
        
        requestAnimationFrame(executionLoop);
    }
    requestAnimationFrame(executionLoop);
}

// INTERFACE EVAM COUPLING REGISTRY
function bindInterfaceEvents() {
    // Entrance Sequence Transition Action Trigger
    document.getElementById('btn-enter-studio').addEventListener('click', () => {
        SoundDesignFX.triggerCinematicDrop();
        
        gsap.to('.entrance-content', { opacity: 0, y: -40, duration: 0.8, ease: 'power3.inOut' });
        gsap.to('#entrance-container', { 
            opacity: 0, 
            duration: 1.2, 
            delay: 0.4, 
            ease: 'power4.inOut',
            onComplete: () => {
                document.getElementById('entrance-container').style.display = 'none';
                document.getElementById('app-container').classList.remove('app-hidden');
                populateTemplatesMatrix();
            }
        });
    });

    // Main Core View Management Router
    const navButtons = {
        'nav-btn-new': 'view-dashboard',
        'nav-btn-templates': 'view-templates',
        'nav-btn-projects': 'view-dashboard', // Anchored on lower section shelf
        'nav-btn-settings': 'view-settings'
    };

    Object.keys(navButtons).forEach(btnId => {
        document.getElementById(btnId).addEventListener('click', (e) => {
            Object.keys(navButtons).forEach(id => document.getElementById(id).classList.remove('active'));
            e.currentTarget.classList.add('active');
            switchWorkspaceView(navButtons[btnId]);
        });
    });

    // Secondary Interface Handlers
    document.getElementById('card-new-project').addEventListener('click', () => triggerProjectInstantiation());
    document.getElementById('card-browse-templates').addEventListener('click', () => {
        document.getElementById('nav-btn-templates').click();
    });
    
    // Studio Specific Buttons
    document.getElementById('studio-btn-close').addEventListener('click', () => {
        LauncherState.isPlaying = false;
        switchWorkspaceView('view-dashboard');
    });
    document.getElementById('studio-btn-save').addEventListener('click', () => commitProjectToStorage());
    
    // Inspector Dynamic Field Sync Hooks
    document.getElementById('prop-input-text-val').addEventListener('input', (e) => {
        updateSelectedLayerParameter('text', e.target.value);
    });
    document.getElementById('prop-input-font').addEventListener('change', (e) => {
        updateSelectedLayerParameter('font', e.target.value);
    });
    document.getElementById('prop-input-color').addEventListener('input', (e) => {
        updateSelectedLayerParameter('color', e.target.value);
    });
    document.getElementById('prop-input-size').addEventListener('input', (e) => {
        document.getElementById('lbl-val-size').textContent = e.target.value;
        updateSelectedLayerParameter('size', parseInt(e.target.value));
    });
    document.getElementById('prop-input-scale').addEventListener('input', (e) => {
        document.getElementById('lbl-val-scale').textContent = e.target.value;
        updateSelectedLayerParameter('scale', parseInt(e.target.value) / 100);
    });
    document.getElementById('prop-input-opacity').addEventListener('input', (e) => {
        document.getElementById('lbl-val-opacity').textContent = e.target.value;
        updateSelectedLayerParameter('opacity', parseInt(e.target.value) / 100);
    });
    document.getElementById('prop-input-rotation').addEventListener('input', (e) => {
        document.getElementById('lbl-val-rotation').textContent = e.target.value;
        updateSelectedLayerParameter('rotation', parseInt(e.target.value));
    });

    // Asset Instantiation Click Injections
    document.getElementById('btn-add-text-header').addEventListener('click', () => {
        injectLayerIntoActiveProject({
            id: 'layer-' + Date.now(),
            type: 'text',
            text: 'Cinematic Headline',
            font: 'Cinzel',
            size: 48,
            color: '#D4AF37',
            x: 200, y: 240, scale: 1, opacity: 1, rotation: 0,
            startTime: 0, duration: 6
        });
    });
    
    document.getElementById('btn-add-text-sub').addEventListener('click', () => {
        injectLayerIntoActiveProject({
            id: 'layer-' + Date.now(),
            type: 'text',
            text: 'Studio Synthesis Content Frame',
            font: 'Inter',
            size: 22,
            color: '#FFFFFF',
            x: 200, y: 320, scale: 1, opacity: 1, rotation: 0,
            startTime: 1, duration: 5
        });
    });

    // Playback Controller Integrations
    document.getElementById('btn-playback-toggle').addEventListener('click', () => {
        LauncherState.isPlaying = !LauncherState.isPlaying;
        document.getElementById('btn-playback-toggle').innerHTML = LauncherState.isPlaying ? 
            `<i class="fa-solid fa-pause"></i>` : `<i class="fa-solid fa-play"></i>`;
    });
    document.getElementById('btn-playback-rw').addEventListener('click', () => { LauncherState.playbackPointer = 0; syncTimelinePlayheadDOM(); });
    document.getElementById('btn-toggle-loop').addEventListener('click', (e) => {
        LauncherState.loopEnabled = !LauncherState.loopEnabled;
        e.currentTarget.classList.toggle('active', LauncherState.loopEnabled);
        e.currentTarget.style.color = LauncherState.loopEnabled ? '#D4AF37' : '#FFF';
    });

    // Media Core Import Logic Block
    document.getElementById('media-file-input').addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        files.forEach(f => {
            const trackUrl = URL.createObjectURL(f);
            const mediaId = 'media-' + Date.now() + '-' + Math.random().toString(36).substr(2,4);
            LauncherState.mediaCache.set(mediaId, trackUrl);
            
            // Build Pool Component Interface
            const thumb = document.createElement('div');
            thumb.className = 'pool-item-thumb';
            thumb.innerHTML = `<i class="fa-solid fa-photo-film"></i> <span style="font-size:8px;position:absolute;bottom:2px;left:4px;width:90%;overflow:hidden;">${f.name}</span>`;
            thumb.addEventListener('click', () => {
                injectLayerIntoActiveProject({
                    id: 'layer-' + Date.now(),
                    type: f.type.startsWith('video') ? 'video' : 'image',
                    mediaId: mediaId,
                    name: f.name,
                    x: 100, y: 100, scale: 0.5, opacity: 1, rotation: 0,
                    startTime: 0, duration: 5
                });
            });
            document.getElementById('local-media-pool').appendChild(thumb);
        });
    });

    // Left Menu Core Sub Tabs Switching Implementation
    document.querySelectorAll('.lib-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.lib-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.lib-pane').forEach(p => p.classList.remove('active'));
            e.currentTarget.classList.add('active');
            document.getElementById(e.currentTarget.getAttribute('data-target')).classList.add('active');
        });
    });

    // Global Project Exporters Setup Hooks
    document.getElementById('studio-btn-export-json').addEventListener('click', () => {
        if(!LauncherState.activeProject) return;
        const outStr = JSON.stringify(LauncherState.activeProject, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(outStr);
        const exportAnchor = document.createElement('a');
        exportAnchor.setAttribute('href', dataUri);
        exportAnchor.setAttribute('download', `${LauncherState.activeProject.name}_compositions.json`);
        exportAnchor.click();
    });

    document.getElementById('studio-btn-export-video').addEventListener('click', () => {
        alert("NA Studio Engine Status:\nClient-Side WebCodecs Framework mapping initiated locally.\nCompiling frames pipeline sequence direct to local memory filesystem storage.");
    });
}

function switchWorkspaceView(targetId) {
    document.querySelectorAll('.workspace-view').forEach(v => v.classList.add('view-hidden'));
    document.getElementById(targetId).classList.remove('view-hidden');
    LauncherState.activeView = targetId;
}

// GENERATE ARCHEPRIME ARCHETYPES TEMPLATES SHELF
function populateTemplatesMatrix() {
    const matrixContainer = document.getElementById('templates-grid-container');
    matrixContainer.innerHTML = '';
    
    TemplatesRegistry.forEach(t => {
        const card = document.createElement('div');
        card.className = 'tmpl-card';
        card.innerHTML = `
            <div class="tmpl-thumb-mock" style="background-color: ${t.bg}; color: ${t.id.includes('gold')||t.id.includes('luxury')?'#D4AF37':'#fff'}; border: 1px solid rgba(212,175,55,0.1)">
                ${t.cat} Archetype
            </div>
            <div class="tmpl-meta-box">
                <h4>${t.name}</h4>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                    <span>${t.duration} Seconds</span>
                    <button class="ctrl-btn btn-gold build-trigger" data-tid="${t.id}" style="padding:4px 10px; font-size:11px;">Deploy</button>
                </div>
            </div>
        `;
        matrixContainer.appendChild(card);
    });

    matrixContainer.querySelectorAll('.build-trigger').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tid = e.target.getAttribute('data-tid');
            instantiateProjectFromTemplate(tid);
        });
    });
}

// BUSINESS LOGIC CONTEXT SWITCHERS
function triggerProjectInstantiation() {
    const activeId = 'proj-' + Date.now();
    LauncherState.activeProject = {
        id: activeId,
        name: 'Cinematic Production Alpha X',
        resolution: '1920x1080',
        canvasGlobalFx: 'none',
        layers: [
            {
                id: 'layer-init-1',
                type: 'text',
                text: 'NA Studio Ultimate',
                font: 'Cinzel',
                size: 55,
                color: '#D4AF37',
                x: 150, y: 220, scale: 1, opacity: 1, rotation: 0,
                startTime: 0, duration: 8
            }
        ]
    };
    mountStudioWorkspace();
}

function instantiateProjectFromTemplate(templateId) {
    const schema = TemplatesRegistry.find(t => t.id === templateId);
    if(!schema) return;
    
    LauncherState.activeProject = {
        id: 'proj-' + Date.now(),
        name: `Production - ${schema.name}`,
        resolution: '1920x1080',
        canvasGlobalFx: schema.fx,
        layers: [
            {
                id: 'layer-tmpl-base',
                type: 'text',
                text: schema.text,
                font: 'Cinzel',
                size: 42,
                color: '#D4AF37',
                x: 100, y: 250, scale: 1, opacity: 1, rotation: 0,
                startTime: 0, duration: schema.duration
            }
        ]
    };
    mountStudioWorkspace();
}

function restoreActiveProjectState(projectId) {
    const matched = LauncherState.projectsRegistry.find(p => p.id === projectId);
    if(matched) {
        LauncherState.activeProject = JSON.parse(JSON.stringify(matched)); // Absolute deep clone
        mountStudioWorkspace();
    }
}

function mountStudioWorkspace() {
    switchWorkspaceView('view-studio');
    document.getElementById('studio-active-project-name').textContent = LauncherState.activeProject.name;
    LauncherState.playbackPointer = 0;
    LauncherState.selectedLayerId = null;
    
    // Select Active Effect Node Interface Element
    document.querySelectorAll('.fx-item').forEach(el => {
        el.classList.toggle('active', el.getAttribute('data-fx') === LauncherState.activeProject.canvasGlobalFx);
    });

    // Rebind Effect Adjustments 
    document.querySelectorAll('.fx-item').forEach(el => {
        el.replaceWith(el.cloneNode(true)); // Wipe ancient event handles listeners
    });
    document.querySelectorAll('.fx-item').forEach(el => {
        el.addEventListener('click', (e) => {
            const fxType = e.currentTarget.getAttribute('data-fx');
            LauncherState.activeProject.canvasGlobalFx = fxType;
            document.querySelectorAll('.fx-item').forEach(i => i.classList.remove('active'));
            e.currentTarget.classList.add('active');
        });
    });

    rebuildTimelineInterfaceDOM();
    synchronizeInspectorDisplay();
}

// PIPELINE ENGINE RENDERING LOOP
function studioCompositionLoop() {
    if (LauncherState.activeView === 'view-studio' && LauncherState.activeProject) {
        const targetCanvas = document.getElementById('main-studio-renderer');
        const ctx = targetCanvas.getContext('2d');
        
        // Dynamic Viewport Alignment Framework
        targetCanvas.width = 800;
        targetCanvas.height = 450;
        
        ctx.clearRect(0,0, targetCanvas.width, targetCanvas.height);
        ctx.fillStyle = '#050505';
        ctx.fillRect(0,0, targetCanvas.width, targetCanvas.height);
        
        // Compile Composition Frame Render Passes Layer Pipeline
        LauncherState.activeProject.layers.forEach(layer => {
            if (LauncherState.playbackPointer >= layer.startTime && LauncherState.playbackPointer <= (layer.startTime + layer.duration)) {
                ctx.save();
                ctx.globalAlpha = layer.opacity || 1;
                
                // Position Context Mapping Transformations
                ctx.translate(layer.x, layer.y);
                if(layer.rotation) ctx.rotate((layer.rotation * Math.PI) / 180);
                if(layer.scale) ctx.scale(layer.scale, layer.scale);
                
                if (layer.type === 'text') {
                    ctx.font = `${layer.size}px ${layer.font || 'Inter'}`;
                    ctx.fillStyle = layer.color || '#FFFFFF';
                    ctx.fillText(layer.text, 0, 0);
                } else if ((layer.type === 'image' || layer.type === 'video') && layer.mediaId) {
                    const cachedUrl = LauncherState.mediaCache.get(layer.mediaId);
                    if (cachedUrl) {
                        // Operational Framework Mock Image Processor Allocation
                        ctx.fillStyle = '#1A1A1A';
                        ctx.fillRect(0, 0, 200, 120);
                        ctx.strokeStyle = '#D4AF37';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(0, 0, 200, 120);
                        ctx.fillStyle = '#FFFFFF';
                        ctx.font = '10px Inter';
                        ctx.fillText(layer.name || "Media Asset Frame", 10, 30);
                    }
                }
                ctx.restore();
            }
        });

        // Apply Post-Process Shader Filters Overlays
        applyPostProcessFXPipeline(ctx, targetCanvas.width, targetCanvas.height);

        // System Clock Integration Playback Incrementor
        if (LauncherState.isPlaying) {
            LauncherState.playbackPointer += 0.016; // Map perfectly to standard ~60fps step increments
            if (LauncherState.playbackPointer >= LauncherState.maxDuration) {
                if (LauncherState.loopEnabled) {
                    LauncherState.playbackPointer = 0;
                } else {
                    LauncherState.playbackPointer = LauncherState.maxDuration;
                    LauncherState.isPlaying = false;
                    document.getElementById('btn-playback-toggle').innerHTML = `<i class="fa-solid fa-play"></i>`;
                }
            }
            syncTimelinePlayheadDOM();
        }
        
        // Update Operational Time Labels Counter Display Output
        document.getElementById('playback-time-display').textContent = 
            `${formatSecondsClock(LauncherState.playbackPointer)} / ${formatSecondsClock(LauncherState.maxDuration)}`;
    }
    requestAnimationFrame(studioCompositionLoop);
}

function applyPostProcessFXPipeline(ctx, w, h) {
    const mode = LauncherState.activeProject.canvasGlobalFx;
    if(mode === 'film-grain') {
        ctx.save();
        ctx.fillStyle = `rgba(255,255,255, ${Math.random() * 0.04})`;
        for(let i=0; i<30; i++) {
            ctx.fillRect(Math.random()*w, Math.random()*h, 2, 2);
        }
        ctx.restore();
    } else if (mode === 'lens-flare') {
        ctx.save();
        let grad = ctx.createRadialGradient(w/2, h/2, 5, w/2, h/2, w/3);
        grad.addColorStop(0, 'rgba(255, 216, 107, 0.15)');
        grad.addColorStop(0.2, 'rgba(212, 175, 55, 0.05)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0,0,w,h);
        ctx.restore();
    } else if (mode === 'cosmic-glow') {
        ctx.save();
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.08)';
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, w-8, h-8);
        ctx.restore();
    }
}

// INJECT SYSTEM TRACK MODAL OPERATIONS
function injectLayerIntoActiveProject(layerObj) {
    if(!LauncherState.activeProject) return;
    LauncherState.activeProject.layers.push(layerObj);
    rebuildTimelineInterfaceDOM();
}

// REBUILD TIMELINE SEGMENT DISPATCH UTILITIES
function rebuildTimelineInterfaceDOM() {
    const mountPoint = document.getElementById('timeline-tracks-stack');
    mountPoint.innerHTML = '';
    
    if(!LauncherState.activeProject) return;
    
    LauncherState.activeProject.layers.forEach((layer, index) => {
        const lane = document.createElement('div');
        lane.className = 'timeline-track-lane';
        lane.innerHTML = `<span class="track-lane-label">Track Layer ${index+1} (${layer.type})</span>`;
        
        const clip = document.createElement('div');
        clip.className = `timeline-clip-block ${LauncherState.selectedLayerId === layer.id ? 'active-clip' : ''}`;
        
        // Calculate Graphic Percentages Position Layout Dimensions
        const startPct = (layer.startTime / LauncherState.maxDuration) * 100;
        const widthPct = (layer.duration / LauncherState.maxDuration) * 100;
        
        clip.style.left = `${startPct}%`;
        clip.style.width = `${widthPct}%`;
        clip.textContent = layer.text || layer.name || 'Composition Clip Element';
        
        // Interaction Track Selection Hook Up Click event
        clip.addEventListener('click', (e) => {
            e.stopPropagation();
            LauncherState.selectedLayerId = layer.id;
            rebuildTimelineInterfaceDOM();
            synchronizeInspectorDisplay();
        });
        
        lane.appendChild(clip);
        mountPoint.appendChild(lane);
    });
}

function syncTimelinePlayheadDOM() {
    const rulerWidth = document.getElementById('timeline-ruler-mount').clientWidth;
    const offsetPct = (LauncherState.playbackPointer / LauncherState.maxDuration) * rulerWidth;
    document.getElementById('timeline-cursor-playhead').style.left = `${offsetPct}px`;
}

// SYNC PARAMETER CONTROL HOOK VALUES
function updateSelectedLayerParameter(key, val) {
    if(!LauncherState.activeProject || !LauncherState.selectedLayerId) return;
    const target = LauncherState.activeProject.layers.find(l => l.id === LauncherState.selectedLayerId);
    if(target) {
        target[key] = val;
    }
}

function synchronizeInspectorDisplay() {
    const emptyNotice = document.getElementById('inspector-empty-state');
    const controlsBox = document.getElementById('inspector-controls-wrapper');
    const targetLabel = document.getElementById('inspector-selected-target-lbl');
    
    if(!LauncherState.selectedLayerId || !LauncherState.activeProject) {
        emptyNotice.classList.remove('pane-hidden');
        controlsBox.classList.add('pane-hidden');
        targetLabel.textContent = 'No Layer Selected';
        return;
    }
    
    emptyNotice.classList.add('pane-hidden');
    controlsBox.classList.remove('pane-hidden');
    
    const layer = LauncherState.activeProject.layers.find(l => l.id === LauncherState.selectedLayerId);
    targetLabel.textContent = `Type: ${layer.type.toUpperCase()} | ID: ${layer.id}`;
    
    // Toggle Section Sub Panel Parameter Context Blocks
    document.getElementById('prop-group-text').classList.toggle('pane-hidden', layer.type !== 'text');
    document.getElementById('prop-group-media').classList.toggle('pane-hidden', layer.type === 'audio');
    document.getElementById('prop-group-audio').classList.toggle('pane-hidden', layer.type !== 'audio');
    
    // Assign Field Bindings Inputs Settings Data Values
    if (layer.type === 'text') {
        document.getElementById('prop-input-text-val').value = layer.text;
        document.getElementById('prop-input-font').value = layer.font || 'Inter';
        document.getElementById('prop-input-color').value = layer.color || '#FFFFFF';
        document.getElementById('prop-input-size').value = layer.size || 24;
        document.getElementById('lbl-val-size').textContent = layer.size || 24;
    }
    
    document.getElementById('prop-input-scale').value = (layer.scale || 1) * 100;
    document.getElementById('lbl-val-scale').textContent = Math.round((layer.scale || 1) * 100);
    document.getElementById('prop-input-opacity').value = (layer.opacity || 1) * 100;
    document.getElementById('lbl-val-opacity').textContent = Math.round((layer.opacity || 1) * 100);
    document.getElementById('prop-input-rotation').value = layer.rotation || 0;
    document.getElementById('lbl-val-rotation').textContent = layer.rotation || 0;
}

// STORAGE ATOMIC TRANSACTION MANAGERS
function commitProjectToStorage() {
    if (!LauncherState.database || !LauncherState.activeProject) return;
    const transaction = LauncherState.database.transaction('projects', 'readwrite');
    const store = transaction.objectStore('projects');
    
    // Build Absolute Deep Copy Clean Snapshot Data Frame To Output
    const serializedFrame = JSON.parse(JSON.stringify(LauncherState.activeProject));
    const action = store.put(serializedFrame);
    
    action.onsuccess = () => {
        syncSavedProjectsShelf();
        alert(`NA Studio Cloud Storage Sync:\nProject [${LauncherState.activeProject.name}] successfully committed to secure local IndexedDB.`);
    };
}

// STRING FORMAT TIME SYSTEM PARSERS
function formatSecondsClock(totalSecs) {
    if(isNaN(totalSecs) || totalSecs < 0) totalSecs = 0;
    const mins = Math.floor(totalSecs / 60);
    const secs = Math.floor(totalSecs % 60);
    const ms = Math.floor((totalSecs % 1) * 100);
    return `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}.${ms.toString().padStart(2,'0')}`;
}
