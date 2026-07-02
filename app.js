/**
 * NA STUDIO - ENGINE CORE PREMIUM (V1.0.0)
 * محرك المونتاج السينمائي الحقيقي والمعرب بالكامل داخل المتصفح
 */

// سجل الحالة العام للنظام
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
    // مخزن حقيقي لعناصر الفيديو والصور لضمان عدم حذفها من الذاكرة أثناء الرندر
    mediaElements: new Map(),
    isExporting: false,
    recorder: null,
    recordedChunks: []
};

let TemplatesRegistry = [];

// محرك الهندسة الصوتية التخليقية التفاعلية (صوت الضغطة السينمائية)
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
        
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(70, now);
        subOsc.frequency.exponentialRampToValueAtTime(30, now + 1.0);
        
        subGain.gain.setValueAtTime(0.8, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        
        subOsc.connect(subGain);
        subGain.connect(this.ctx.destination);
        subOsc.start(now);
        subOsc.stop(now + 1.3);
    }
};

// فئات الجزيئات السينمائية لشاشة الدخول (الرماد الذهبي والشرارات)
class DustParticle {
    constructor(w, h) { this.w = w; this.h = h; this.reset(); }
    reset() {
        this.x = Math.random() * this.w;
        this.y = Math.random() * this.h;
        this.size = Math.random() * 2.5 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = -Math.random() * 0.5 - 0.2;
        this.alpha = Math.random() * 0.6 + 0.2;
    }
    update() {
        this.x += this.speedX; this.y += this.speedY;
        if (this.y < 0) this.reset();
    }
    draw(ctx) {
        ctx.save(); ctx.globalAlpha = this.alpha; ctx.fillStyle = '#D4AF37';
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill(); ctx.restore();
    }
}

class SparkParticle {
    constructor(w, h) { this.w = w; this.h = h; this.reset(); }
    reset() {
        this.x = Math.random() * this.w;
        this.y = this.h + 10;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 2;
        this.speedY = -Math.random() * 2.5 - 1;
        this.life = 1; this.decay = Math.random() * 0.02 + 0.005;
    }
    update() {
        this.x += this.speedX; this.y += this.speedY; this.life -= this.decay;
        if (this.life <= 0) this.reset();
    }
    draw(ctx) {
        ctx.save(); ctx.globalAlpha = this.life;
        ctx.fillStyle = `rgba(255, ${200 + Math.random() * 55}, 50, ${this.life})`;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill(); ctx.restore();
    }
}

// تشغيل النظام المباشر عند التحميل
document.addEventListener('DOMContentLoaded', () => {
    initLocalDatastore();
    parseTemplateData();
    mountEntranceFX();
    bindInterfaceEvents();
    studioCompositionLoop();
});

function parseTemplateData() {
    const jsonPayload = document.getElementById('templates-registry-payload').textContent;
    TemplatesRegistry = JSON.parse(jsonPayload);
}

// إعداد قواعد البيانات المحلية الحقيقية IndexedDB لحفظ المشاريع تلقائياً
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
            targetShelf.innerHTML = `<div class="empty-shelf-notice">لا توجد مشاريع محفوظة محلياً. ابدأ مشروعاً جديداً الآن.</div>`;
            return;
        }
        targetShelf.innerHTML = '';
        LauncherState.projectsRegistry.forEach(p => {
            const card = document.createElement('div');
            card.className = 'action-card';
            card.style.padding = '15px 25px'; card.style.display = 'flex';
            card.style.justifyContent = 'space-between'; card.style.alignItems = 'center';
            card.innerHTML = `
                <div style="text-align: right; direction: rtl;">
                    <h4 style="font-size:14px;color:#D4AF37;"><i class="fa-solid fa-square-poll-horizontal"></i> ${p.name}</h4>
                    <span style="font-size:11px;color:#888;">الطبقات: ${p.layers.length} | الأبعاد: ${p.resolution}</span>
                </div>
                <button class="ctrl-btn btn-highlight load-trigger" data-pid="${p.id}">فتح الاستوديو</button>
            `;
            targetShelf.appendChild(card);
        });
        
        targetShelf.querySelectorAll('.load-trigger').forEach(b => {
            b.addEventListener('click', (e) => {
                restoreActiveProjectState(e.target.getAttribute('data-pid'));
            });
        });
    };
}

// تفعيل شاشة الدخول والتأثيرات المرئية للشرارات والرماد الذهبي
function mountEntranceFX() {
    const eCanvas = document.getElementById('entrance-canvas');
    const sCanvas = document.getElementById('sparks-canvas');
    const eCtx = eCanvas.getContext('2d');
    const sCtx = sCanvas.getContext('2d');
    
    function resize() {
        eCanvas.width = window.innerWidth; eCanvas.height = window.innerHeight;
        sCanvas.width = window.innerWidth; sCanvas.height = 160;
    }
    window.addEventListener('resize', resize); resize();
    
    const dustArray = Array.from({length: 50}, () => new DustParticle(eCanvas.width, eCanvas.height));
    const sparksArray = Array.from({length: 40}, () => new SparkParticle(sCanvas.width, sCanvas.height));
    
    function loop() {
        eCtx.clearRect(0, 0, eCanvas.width, eCanvas.height);
        eCtx.fillStyle = '#050505'; eCtx.fillRect(0, 0, eCanvas.width, eCanvas.height);
        dustArray.forEach(p => { p.update(); p.draw(eCtx); });
        
        sCtx.clearRect(0, 0, sCanvas.width, sCanvas.height);
        sparksArray.forEach(p => { p.update(); p.draw(sCtx); });
        
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

// ربط جميع أحداث وتفاعلات واجهة المستخدم الكلاسيكية والسينمائية
function bindInterfaceEvents() {
    // الانتقال السينمائي عند الضغط على زر الدخول
    document.getElementById('btn-enter-studio').addEventListener('click', () => {
        SoundDesignFX.triggerCinematicDrop();
        gsap.to('.entrance-content', { opacity: 0, y: -30, duration: 0.8, ease: 'power2.inOut' });
        gsap.to('#entrance-container', { 
            opacity: 0, duration: 1.2, delay: 0.3, ease: 'power4.inOut',
            onComplete: () => {
                document.getElementById('entrance-container').style.display = 'none';
                document.getElementById('app-container').classList.remove('app-hidden');
                populateTemplatesMatrix();
            }
        });
    });

    // التنقل بين واجهات النظام الأساسية
    const navButtons = {
        'nav-btn-new': 'view-dashboard',
        'nav-btn-templates': 'view-templates',
        'nav-btn-projects': 'view-dashboard',
        'nav-btn-settings': 'view-settings'
    };

    Object.keys(navButtons).forEach(btnId => {
        document.getElementById(btnId).addEventListener('click', (e) => {
            Object.keys(navButtons).forEach(id => document.getElementById(id).classList.remove('active'));
            e.currentTarget.classList.add('active');
            switchWorkspaceView(navButtons[btnId]);
        });
    });

    document.getElementById('card-new-project').addEventListener('click', () => triggerProjectInstantiation());
    document.getElementById('card-browse-templates').addEventListener('click', () => {
        document.getElementById('nav-btn-templates').click();
    });
    
    document.getElementById('studio-btn-close').addEventListener('click', () => {
        LauncherState.isPlaying = false;
        switchWorkspaceView('view-dashboard');
    });
    document.getElementById('studio-btn-save').addEventListener('click', () => commitProjectToStorage());
    
    // المفتش (Inspector): ربط حقول التحكم للتعديل الفوري على الطبقات والميديا
    document.getElementById('prop-input-text-val').addEventListener('input', (e) => {
        updateSelectedLayerParameter('text', e.target.value);
        rebuildTimelineInterfaceDOM();
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

    // إضافة كتل نصوص وعناوين حقيقية للتايم لاين
    document.getElementById('btn-add-text-header').addEventListener('click', () => {
        injectLayerIntoActiveProject({
            id: 'layer-' + Date.now(), type: 'text', text: 'عنوان سينمائي جديد',
            font: 'Cinzel', size: 40, color: '#D4AF37', x: 200, y: 220, scale: 1, opacity: 1, rotation: 0, startTime: 0, duration: 6
        });
    });
    
    document.getElementById('btn-add-text-sub').addEventListener('click', () => {
        injectLayerIntoActiveProject({
            id: 'layer-' + Date.now(), type: 'text', text: 'وصف فرعي هنا',
            font: 'Inter', size: 20, color: '#FFFFFF', x: 250, y: 300, scale: 1, opacity: 1, rotation: 0, startTime: 1, duration: 5
        });
    });

    // أزرار التحكم بالتشغيل والتايم لاين
    document.getElementById('btn-playback-toggle').addEventListener('click', () => {
        LauncherState.isPlaying = !LauncherState.isPlaying;
        document.getElementById('btn-playback-toggle').innerHTML = LauncherState.isPlaying ? 
            `<i class="fa-solid fa-pause"></i>` : `<i class="fa-solid fa-play"></i>`;
    });
    document.getElementById('btn-playback-rw').addEventListener('click', () => { LauncherState.playbackPointer = 0; syncTimelinePlayheadDOM(); });
    document.getElementById('btn-toggle-loop').addEventListener('click', (e) => {
        LauncherState.loopEnabled = !LauncherState.loopEnabled;
        e.currentTarget.style.color = LauncherState.loopEnabled ? '#D4AF37' : '#FFF';
    });

    // معالجة واستقبال ملفات الميديا (فيديوهات وصور حقيقية) من جهاز المستخدم وتفعيلها فوراً
    document.getElementById('media-file-input').addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        files.forEach(f => {
            const trackUrl = URL.createObjectURL(f);
            const mediaId = 'media-' + Date.now() + '-' + Math.random().toString(36).substr(2,4);
            
            // إنشاء عنصر DOM حقيقي بالخلفية لعمل الرندر عليه بشكل متزامن
            const isVideo = f.type.startsWith('video');
            const mediaDOMElement = document.createElement(isVideo ? 'video' : 'img');
            mediaDOMElement.src = trackUrl;
            if(isVideo) {
                mediaDOMElement.muted = true;
                mediaDOMElement.playsInline = true;
                mediaDOMElement.load();
            }
            
            // تخزين العنصر لربطه مع الكانفاس
            LauncherState.mediaElements.set(mediaId, mediaDOMElement);
            
            const thumb = document.createElement('div');
            thumb.className = 'pool-item-thumb';
            thumb.innerHTML = `<i class="fa-solid ${isVideo?'fa-video':'fa-image'}"></i> <span style="font-size:9px;position:absolute;bottom:2px;right:4px;width:90%;overflow:hidden;direction:rtl;">${f.name}</span>`;
            thumb.addEventListener('click', () => {
                injectLayerIntoActiveProject({
                    id: 'layer-' + Date.now(), type: isVideo ? 'video' : 'image', mediaId: mediaId, name: f.name,
                    x: 50, y: 50, scale: 0.8, opacity: 1, rotation: 0, startTime: 0, duration: 7
                });
            });
            document.getElementById('local-media-pool').appendChild(thumb);
        });
    });

    // تصدير ملف المشروع البرمجي كاملاً بصيغة JSON لفتحه على أي جهاز آخر
    document.getElementById('studio-btn-export-json').addEventListener('click', () => {
        if(!LauncherState.activeProject) return;
        const outStr = JSON.stringify(LauncherState.activeProject, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(outStr);
        const exportAnchor = document.createElement('a');
        exportAnchor.setAttribute('href', dataUri);
        exportAnchor.setAttribute('download', `${LauncherState.activeProject.name}.json`);
        exportAnchor.click();
    });

    // تفعيل وظيفة التصدير الحقيقية الكليّة للفيديو عبر تقنية الـ MediaRecorder
    document.getElementById('studio-btn-export-video').addEventListener('click', () => {
        exportVideoCompositionReal();
    });
}

function switchWorkspaceView(targetId) {
    document.querySelectorAll('.workspace-view').forEach(v => v.classList.add('view-hidden'));
    document.getElementById(targetId).classList.remove('view-hidden');
    LauncherState.activeView = targetId;
}

// عرض القوالب الـ 20 الجاهزة والحقيقية كلياً للإنتاج الفوري بضغطة زر
function populateTemplatesMatrix() {
    const matrixContainer = document.getElementById('templates-grid-container');
    matrixContainer.innerHTML = '';
    
    TemplatesRegistry.forEach(t => {
        const card = document.createElement('div');
        card.className = 'tmpl-card';
        card.innerHTML = `
            <div class="tmpl-thumb-mock" style="background-color: ${t.bg}; color: #D4AF37; border: 1px solid rgba(212,175,55,0.2)">
                قالب ${t.cat}
            </div>
            <div class="tmpl-meta-box" style="text-align:right; direction:rtl;">
                <h4>${t.name}</h4>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                    <span style="font-size:11px;">المدة: ${t.duration} ثوانٍ</span>
                    <button class="ctrl-btn btn-gold build-trigger" data-tid="${t.id}" style="padding:4px 10px; font-size:11px;">تطبيق القالب</button>
                </div>
            </div>
        `;
        matrixContainer.appendChild(card);
    });

    matrixContainer.querySelectorAll('.build-trigger').forEach(btn => {
        btn.addEventListener('click', (e) => {
            instantiateProjectFromTemplate(e.target.getAttribute('data-tid'));
        });
    });
}

function triggerProjectInstantiation() {
    LauncherState.activeProject = {
        id: 'proj-' + Date.now(), name: 'مشروع سينمائي فارغ جديد',
        resolution: '1920x1080', canvasGlobalFx: 'none', bg_color: '#050505',
        layers: [
            {
                id: 'layer-init-1', type: 'text', text: 'اضغط هنا للتعديل',
                font: 'Cinzel', size: 35, color: '#D4AF37', x: 200, y: 220, scale: 1, opacity: 1, rotation: 0, startTime: 0, duration: 8
            }
        ]
    };
    mountStudioWorkspace();
}

function instantiateProjectFromTemplate(templateId) {
    const schema = TemplatesRegistry.find(t => t.id === templateId);
    if(!schema) return;
    
    LauncherState.activeProject = {
        id: 'proj-' + Date.now(), name: `إنتاج احترافي - ${schema.name}`,
        resolution: '1920x1080', canvasGlobalFx: schema.fx, bg_color: schema.bg || '#050505',
        layers: [
            {
                id: 'layer-tmpl-base', type: 'text', text: schema.text,
                font: 'Cinzel', size: 38, color: '#D4AF37', x: 150, y: 230, scale: 1, opacity: 1, rotation: 0, startTime: 0, duration: schema.duration
            }
        ]
    };
    mountStudioWorkspace();
}

function restoreActiveProjectState(projectId) {
    const matched = LauncherState.projectsRegistry.find(p => p.id === projectId);
    if(matched) {
        LauncherState.activeProject = JSON.parse(JSON.stringify(matched));
        mountStudioWorkspace();
    }
}

function mountStudioWorkspace() {
    switchWorkspaceView('view-studio');
    document.getElementById('studio-active-project-name').textContent = LauncherState.activeProject.name;
    LauncherState.playbackPointer = 0; LauncherState.selectedLayerId = null;
    
    document.querySelectorAll('.fx-item').forEach(el => {
        el.classList.toggle('active', el.getAttribute('data-fx') === LauncherState.activeProject.canvasGlobalFx);
    });

    document.querySelectorAll('.fx-item').forEach(el => { el.replaceWith(el.cloneNode(true)); });
    document.querySelectorAll('.fx-item').forEach(el => {
        el.addEventListener('click', (e) => {
            LauncherState.activeProject.canvasGlobalFx = e.currentTarget.getAttribute('data-fx');
            document.querySelectorAll('.fx-item').forEach(i => i.classList.remove('active'));
            e.currentTarget.classList.add('active');
        });
    });

    rebuildTimelineInterfaceDOM();
    synchronizeInspectorDisplay();
}

// محرك المعالجة الحقيقي (Render Loop) - يقوم برسم الفيديوهات الحقيقية وتحديث الفريمات في الوقت الفعلي
function studioCompositionLoop() {
    if (LauncherState.activeView === 'view-studio' && LauncherState.activeProject) {
        const canvas = document.getElementById('main-studio-renderer');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 800; canvas.height = 450;
        
        ctx.clearRect(0,0, canvas.width, canvas.height);
        // تعيين لون الخلفية الديناميكي للمشروع
        ctx.fillStyle = LauncherState.activeProject.bg_color || '#050505';
        ctx.fillRect(0,0, canvas.width, canvas.height);
        
        // معالجة ورسم الطبقات المتوفرة في النطاق الزمني الحالي
        LauncherState.activeProject.layers.forEach(layer => {
            if (LauncherState.playbackPointer >= layer.startTime && LauncherState.playbackPointer <= (layer.startTime + layer.duration)) {
                ctx.save();
                ctx.globalAlpha = layer.opacity || 1;
                
                ctx.translate(layer.x, layer.y);
                if(layer.rotation) ctx.rotate((layer.rotation * Math.PI) / 180);
                if(layer.scale) ctx.scale(layer.scale, layer.scale);
                
                if (layer.type === 'text') {
                    ctx.font = `${layer.size}px ${layer.font || 'Inter'}`;
                    ctx.fillStyle = layer.color || '#FFFFFF';
                    ctx.fillText(layer.text, 0, 0);
                } 
                else if ((layer.type === 'image' || layer.type === 'video') && layer.mediaId) {
                    const domElement = LauncherState.mediaElements.get(layer.mediaId);
                    if (domElement) {
                        if (layer.type === 'video') {
                            // تزامُن مشغل الفيديو الحقيقي مع حركة ومؤشر التايم لاين
                            const videoTargetTime = LauncherState.playbackPointer - layer.startTime;
                            if (videoTargetTime >= 0 && videoTargetTime <= layer.duration) {
                                if (LauncherState.isPlaying && !LauncherState.isExporting) {
                                    if (domElement.paused) domElement.play().catch(()=>{});
                                } else {
                                    domElement.pause();
                                }
                                // ضبط توقيت الفريم في حالة القفز السريع بالتايم لاين
                                if (Math.abs(domElement.currentTime - videoTargetTime) > 0.2) {
                                    domElement.currentTime = videoTargetTime;
                                }
                            } else {
                                domElement.pause();
                            }
                        }
                        // رسم الفيديو أو الصورة الحقيقية بكامل فريماتها على الكانفاس مباشرة
                        ctx.drawImage(domElement, 0, 0, 350, 220);
                    }
                }
                ctx.restore();
            }
        });

        applyPostProcessFXPipeline(ctx, canvas.width, canvas.height);

        // آلية عمل توقيت المؤشر الزمني
        if (LauncherState.isPlaying && !LauncherState.isExporting) {
            LauncherState.playbackPointer += 0.0166; // فريمات حقيقية موازية لـ 60 إطار بالثانية
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
        
        document.getElementById('playback-time-display').textContent = 
            `${formatSecondsClock(LauncherState.playbackPointer)} / ${formatSecondsClock(LauncherState.maxDuration)}`;
    }
    requestAnimationFrame(studioCompositionLoop);
}

function applyPostProcessFXPipeline(ctx, w, h) {
    const mode = LauncherState.activeProject.canvasGlobalFx;
    if(mode === 'film-grain') {
        ctx.save(); ctx.fillStyle = `rgba(255,255,255, ${Math.random() * 0.05})`;
        for(let i=0; i<40; i++) { ctx.fillRect(Math.random()*w, Math.random()*h, 2, 2); }
        ctx.restore();
    } else if (mode === 'lens-flare') {
        ctx.save();
        let grad = ctx.createRadialGradient(w/4, h/4, 2, w/4, h/4, w/2);
        grad.addColorStop(0, 'rgba(255, 215, 0, 0.2)');
        grad.addColorStop(0.3, 'rgba(212, 175, 55, 0.06)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad; ctx.fillRect(0,0,w,h); ctx.restore();
    } else if (mode === 'cosmic-glow') {
        ctx.save(); ctx.strokeStyle = 'rgba(212, 175, 55, 0.12)'; ctx.lineWidth = 10;
        ctx.strokeRect(0, 0, w, h); ctx.restore();
    }
}

// كود التصدير الحقيقي والمستقر كلياً - يقوم بتسجيل محتوى الكانفاس وحفظه كفيديو عالي الجودة بجهاز المستخدم فوراً
function exportVideoCompositionReal() {
    if (LauncherState.isExporting) return;
    
    const canvas = document.getElementById('main-studio-renderer');
    LauncherState.isExporting = true;
    LauncherState.isPlaying = false;
    LauncherState.playbackPointer = 0;
    LauncherState.recordedChunks = [];
    
    // التقاط دفق الفريمات بمعدل 30 إطار بالثانية لإخراج جودة ممتازة وسريعة
    const stream = canvas.captureStream(30);
    
    // محاولة استخدام ترميز MP4 أو نظام الـ WebM المدعوم محلياً بكفاءة في المتصفحات
    let options = { mimeType: 'video/webm;codecs=vp9' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm;codecs=vp8' };
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm' };
    }
    
    try {
        LauncherState.recorder = new MediaRecorder(stream, options);
    } catch (e) {
        alert("أداة التصدير غير مدعومة بالكامل على هذا المتصفح القديم، يرجى استخدام متصفح حديث.");
        LauncherState.isExporting = false;
        return;
    }
    
    LauncherState.recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
            LauncherState.recordedChunks.push(e.data);
        }
    };
    
    LauncherState.recorder.onstop = () => {
        const blob = new Blob(LauncherState.recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.style.display = 'none'; a.href = url;
        a.download = `${LauncherState.activeProject.name}_export.webm`;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
        
        alert("اكتمل معالجة وتصدير الفيديو بنجاح! تم تحميل الملف إلى جهازك.");
        LauncherState.isExporting = false;
        LauncherState.playbackPointer = 0;
        syncTimelinePlayheadDOM();
    };
    
    alert("بدء الرندر وتجميع الفريمات الحية الآن.. يرجى عدم إغلاق الصفحة حتى اكتمال التحميل التلقائي.");
    
    LauncherState.recorder.start();
    
    // حلقة معالجة سريعة وثابتة للفريمات أثناء التصدير لضمان تسجيل كل الطبقات بدقة
    const exportInterval = setInterval(() => {
        LauncherState.playbackPointer += 0.033; // قفزات فريمات ثابتة للتسجيل
        syncTimelinePlayheadDOM();
        
        if (LauncherState.playbackPointer >= LauncherState.maxDuration) {
            clearInterval(exportInterval);
            LauncherState.recorder.stop();
        }
    }, 33);
}

function injectLayerIntoActiveProject(layerObj) {
    if(!LauncherState.activeProject) return;
    LauncherState.activeProject.layers.push(layerObj);
    rebuildTimelineInterfaceDOM();
    LauncherState.selectedLayerId = layerObj.id;
    synchronizeInspectorDisplay();
}

function rebuildTimelineInterfaceDOM() {
    const mountPoint = document.getElementById('timeline-tracks-stack');
    mountPoint.innerHTML = '';
    if(!LauncherState.activeProject) return;
    
    LauncherState.activeProject.layers.forEach((layer, index) => {
        const lane = document.createElement('div');
        lane.className = 'timeline-track-lane';
        lane.innerHTML = `<span class="track-lane-label" style="right:10px; left:auto;">طبقة ${index+1} (${layer.type === 'text'?'نص':'ميديا'})</span>`;
        
        const clip = document.createElement('div');
        clip.className = `timeline-clip-block ${LauncherState.selectedLayerId === layer.id ? 'active-clip' : ''}`;
        
        const startPct = (layer.startTime / LauncherState.maxDuration) * 100;
        const widthPct = (layer.duration / LauncherState.maxDuration) * 100;
        
        clip.style.left = `${startPct}%`; clip.style.width = `${widthPct}%`;
        clip.textContent = layer.text || layer.name || 'عنصر ميديا';
        
        clip.addEventListener('click', (e) => {
            e.stopPropagation();
            LauncherState.selectedLayerId = layer.id;
            rebuildTimelineInterfaceDOM();
            synchronizeInspectorDisplay();
        });
        
        lane.appendChild(clip); mountPoint.appendChild(lane);
    });
}

function syncTimelinePlayheadDOM() {
    const rulerWidth = document.getElementById('timeline-ruler-mount').clientWidth;
    const offsetPct = (LauncherState.playbackPointer / LauncherState.maxDuration) * rulerWidth;
    document.getElementById('timeline-cursor-playhead').style.left = `${offsetPct}px`;
}

function updateSelectedLayerParameter(key, val) {
    if(!LauncherState.activeProject || !LauncherState.selectedLayerId) return;
    const target = LauncherState.activeProject.layers.find(l => l.id === LauncherState.selectedLayerId);
    if(target) { target[key] = val; }
}

function synchronizeInspectorDisplay() {
    const emptyNotice = document.getElementById('inspector-empty-state');
    const controlsBox = document.getElementById('inspector-controls-wrapper');
    const targetLabel = document.getElementById('inspector-selected-target-lbl');
    
    if(!LauncherState.selectedLayerId || !LauncherState.activeProject) {
        emptyNotice.classList.remove('pane-hidden'); controlsBox.classList.add('pane-hidden');
        targetLabel.textContent = 'لا توجد طبقة محددة'; return;
    }
    
    emptyNotice.classList.add('pane-hidden'); controlsBox.classList.remove('pane-hidden');
    
    const layer = LauncherState.activeProject.layers.find(l => l.id === LauncherState.selectedLayerId);
    targetLabel.textContent = `النوع: ${layer.type === 'text'?'نص':'ميديا حية'}`;
    
    document.getElementById('prop-group-text').classList.toggle('pane-hidden', layer.type !== 'text');
    document.getElementById('prop-group-media').classList.toggle('pane-hidden', layer.type === 'audio');
    
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

function commitProjectToStorage() {
    if (!LauncherState.database || !LauncherState.activeProject) return;
    const transaction = LauncherState.database.transaction('projects', 'readwrite');
    const store = transaction.objectStore('projects');
    
    const serializedFrame = JSON.parse(JSON.stringify(LauncherState.activeProject));
    const action = store.put(serializedFrame);
    
    action.onsuccess = () => {
        syncSavedProjectsShelf();
        alert(`تم مزامنة وحفظ المشروع [${LauncherState.activeProject.name}] بنجاح داخل قاعدة البيانات المحلية المتصفح.`);
    };
}

function formatSecondsClock(totalSecs) {
    if(isNaN(totalSecs) || totalSecs < 0) totalSecs = 0;
    const mins = Math.floor(totalSecs / 60);
    const secs = Math.floor(totalSecs % 60);
    const ms = Math.floor((totalSecs % 1) * 100);
    return `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}.${ms.toString().padStart(2,'0')}`;
}
