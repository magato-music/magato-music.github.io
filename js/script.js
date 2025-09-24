        document.addEventListener('DOMContentLoaded', function() {
            // Configuración inicial
            let audioContext;
            let isPlaying = false;
            let currentStep = 0;
            let currentMeasure = 1;
            let intervalId = null;
            let stepsPerMeasure = 16;
            let beatsPerMeasure = 4; // Compás 4/4 tiene 4 tiempos
            
            // Nodos de ganancia para control de volumen
            let masterGainNode;
            let kickGainNode, snareGainNode, closedhhGainNode, openhhGainNode, metronomeGainNode;
            
            // Elementos DOM
            const timeSignatureSelect = document.getElementById('time-signature');
            const playStopButton = document.getElementById('play-stop');
            const clearButton = document.getElementById('clear');
            const stepsHeader = document.getElementById('steps-header');
            const currentMeasureDisplay = document.getElementById('current-measure');
            const visualizer = document.getElementById('visualizer');
            
            const kickSoundSelect = document.getElementById('kick-sound');
            const snareSoundSelect = document.getElementById('snare-sound');
            const closedhhSoundSelect = document.getElementById('closedhh-sound');
            const openhhSoundSelect = document.getElementById('openhh-sound');
            
            // Controles de metrónomo
            const metronomeToggle = document.getElementById('metronome-toggle');
            
            const exportButton = document.getElementById('export-button');
            const importButton = document.getElementById('import-button');
            const importFile = document.getElementById('import-file');
            
            const instruments = {
                kick: {
                    steps: document.getElementById('kick-steps'),
                    class: 'kick',
                    volumeNode: null,
                    knob: document.getElementById('kick-volume-knob'),
                    knobValue: document.getElementById('kick-volume-value'),
                    soundSelect: kickSoundSelect,
                    soundFunc: generateKickSound,
                    volumeFunc: updateKickVolume
                },
                snare: {
                    steps: document.getElementById('snare-steps'),
                    class: 'snare',
                    volumeNode: null,
                    knob: document.getElementById('snare-volume-knob'),
                    knobValue: document.getElementById('snare-volume-value'),
                    soundSelect: snareSoundSelect,
                    soundFunc: generateSnareSound,
                    volumeFunc: updateSnareVolume
                },
                closedhh: {
                    steps: document.getElementById('closedhh-steps'),
                    class: 'closedhh',
                    volumeNode: null,
                    knob: document.getElementById('closedhh-volume-knob'),
                    knobValue: document.getElementById('closedhh-volume-value'),
                    soundSelect: closedhhSoundSelect,
                    soundFunc: generateClosedHHSound,
                    volumeFunc: updateClosedHHVolume
                },
                openhh: {
                    steps: document.getElementById('openhh-steps'),
                    class: 'openhh',
                    volumeNode: null,
                    knob: document.getElementById('openhh-volume-knob'),
                    knobValue: document.getElementById('openhh-volume-value'),
                    soundSelect: openhhSoundSelect,
                    soundFunc: generateOpenHHSound,
                    volumeFunc: updateOpenHHVolume
                },
                metronome: {
                    steps: document.getElementById('metronome-steps'),
                    class: 'metronome',
                    volumeNode: null,
                    knob: document.getElementById('metronome-volume-knob'),
                    knobValue: document.getElementById('metronome-volume-value'),
                    soundFunc: generateMetronomeSound,
                    volumeFunc: updateMetronomeVolume
                }
            };
            
            // Clase Knob para manejar las perillas
            class Knob {
                constructor(element, onChange) {
                    this.element = element;
                    this.onChange = onChange;
                    this.min = parseInt(element.dataset.min);
                    this.max = parseInt(element.dataset.max);
                    this.value = parseInt(element.dataset.value);
                    this.isDragging = false;
                    this.startY = 0;
                    this.startValue = 0;
                    
                    this.init();
                }
                
                init() {
                    this.updateDisplay();
                    this.setRotation();
                    
                    this.element.addEventListener('mousedown', this.startDrag.bind(this));
                    document.addEventListener('mousemove', this.drag.bind(this));
                    document.addEventListener('mouseup', this.stopDrag.bind(this));
                    
                    // Soporte para pantallas táctiles
                    this.element.addEventListener('touchstart', this.startDrag.bind(this));
                    document.addEventListener('touchmove', this.drag.bind(this));
                    document.addEventListener('touchend', this.stopDrag.bind(this));
                }
                
                startDrag(e) {
                    this.isDragging = true;
                    this.startY = e.clientY || e.touches[0].clientY;
                    this.startValue = this.value;
                    e.preventDefault();
                }
                
                drag(e) {
                    if (!this.isDragging) return;
                    
                    const currentY = e.clientY || (e.touches && e.touches[0].clientY);
                    if (!currentY) return;
                    
                    const deltaY = this.startY - currentY;
                    const range = this.max - this.min;
                    const sensitivity = range / 100; // Ajusta la sensibilidad
                    
                    let newValue = this.startValue + (deltaY * sensitivity);
                    newValue = Math.max(this.min, Math.min(this.max, Math.round(newValue)));
                    
                    if (newValue !== this.value) {
                        this.value = newValue;
                        this.updateDisplay();
                        this.setRotation();
                        if (this.onChange) this.onChange(this.value);
                    }
                    
                    e.preventDefault();
                }
                
                stopDrag() {
                    this.isDragging = false;
                }
                
                updateDisplay() {
                    // Actualiza el valor en el elemento de datos
                    this.element.dataset.value = this.value;
                    
                    // Actualiza el texto del valor
                    const valueElement = this.element.parentElement.querySelector('.knob-value, .instrument-knob-value');
                    if (valueElement) {
                        if (this.element.id === 'bpm-knob') {
                            valueElement.textContent = `${this.value} BPM`;
                        } else if (this.element.id === 'measures-knob') {
                            valueElement.textContent = `${this.value} compás${this.value > 1 ? 'es' : ''}`;
                        } else {
                            valueElement.textContent = `${this.value}%`;
                        }
                    }
                }
                
                setRotation() {
                    const range = this.max - this.min;
                    const percentage = (this.value - this.min) / range;
                    const rotation = percentage * 270 - 135; // -135° a 135°
                    
                    // Actualizar la rotación usando transform
                    this.element.style.setProperty('--rotation', `${rotation}deg`);
                    
                    // Actualizar el pseudo-elemento ::before
                    const style = document.createElement('style');
                    style.textContent = `
                        #${this.element.id}::before {
                            transform: translateX(-50%) rotate(${rotation}deg) !important;
                        }
                    `;
                    
                    // Eliminar estilos anteriores
                    const existingStyle = document.getElementById(`style-${this.element.id}`);
                    if (existingStyle) existingStyle.remove();
                    
                    style.id = `style-${this.element.id}`;
                    document.head.appendChild(style);
                }
                
                setValue(newValue) {
                    this.value = Math.max(this.min, Math.min(this.max, newValue));
                    this.updateDisplay();
                    this.setRotation();
                }
            }
            
            // Inicializar todas las perillas
            const bpmKnob = new Knob(document.getElementById('bpm-knob'), function(value) {
                if (isPlaying) {
                    stopPlaying();
                    togglePlaying();
                }
            });
            
            const measuresKnob = new Knob(document.getElementById('measures-knob'), function(value) {
                stopPlaying();
                setupSteps();
                createVisualizer();
            });
            
            const masterVolumeKnob = new Knob(document.getElementById('master-volume-knob'), function(value) {
                updateMasterVolume(value);
            });
            
            const metronomeVolumeKnob = new Knob(document.getElementById('metronome-volume-knob'), function(value) {
                updateMetronomeVolume(value);
            });
            
            // Inicializar perillas de instrumentos
            Object.values(instruments).forEach(inst => {
                if (inst.knob) {
                    new Knob(inst.knob, function(value) {
                        inst.volumeFunc(value);
                    });
                }
            });
            
            // Funciones de audio
            function initAudioContext() {
                if (!audioContext) {
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    masterGainNode = audioContext.createGain();
                    masterGainNode.connect(audioContext.destination);
                    
                    kickGainNode = audioContext.createGain();
                    kickGainNode.connect(masterGainNode);
                    snareGainNode = audioContext.createGain();
                    snareGainNode.connect(masterGainNode);
                    closedhhGainNode = audioContext.createGain();
                    closedhhGainNode.connect(masterGainNode);
                    openhhGainNode = audioContext.createGain();
                    openhhGainNode.connect(masterGainNode);
                    metronomeGainNode = audioContext.createGain();
                    metronomeGainNode.connect(masterGainNode);
                    
                    instruments.kick.volumeNode = kickGainNode;
                    instruments.snare.volumeNode = snareGainNode;
                    instruments.closedhh.volumeNode = closedhhGainNode;
                    instruments.openhh.volumeNode = openhhGainNode;
                    instruments.metronome.volumeNode = metronomeGainNode;
                    
                    updateMasterVolume();
                    Object.values(instruments).forEach(inst => inst.volumeFunc());
                    
                    createVisualizer();
                }
            }
            
            function updateMasterVolume(value = null) {
                if (masterGainNode) {
                    const volume = (value !== null ? value : parseInt(masterVolumeKnob.value)) / 100;
                    masterGainNode.gain.setValueAtTime(volume, audioContext.currentTime);
                }
            }
            
            function updateKickVolume(value = null) {
                if (kickGainNode) {
                    const volume = (value !== null ? value : parseInt(instruments.kick.knob.dataset.value)) / 100;
                    kickGainNode.gain.setValueAtTime(volume, audioContext.currentTime);
                }
            }
            
            function updateSnareVolume(value = null) {
                if (snareGainNode) {
                    const volume = (value !== null ? value : parseInt(instruments.snare.knob.dataset.value)) / 100;
                    snareGainNode.gain.setValueAtTime(volume, audioContext.currentTime);
                }
            }
            
            function updateClosedHHVolume(value = null) {
                if (closedhhGainNode) {
                    const volume = (value !== null ? value : parseInt(instruments.closedhh.knob.dataset.value)) / 100;
                    closedhhGainNode.gain.setValueAtTime(volume, audioContext.currentTime);
                }
            }
            
            function updateOpenHHVolume(value = null) {
                if (openhhGainNode) {
                    const volume = (value !== null ? value : parseInt(instruments.openhh.knob.dataset.value)) / 100;
                    openhhGainNode.gain.setValueAtTime(volume, audioContext.currentTime);
                }
            }
            
            function updateMetronomeVolume(value = null) {
                if (metronomeGainNode) {
                    const volume = (value !== null ? value : parseInt(instruments.metronome.knob.dataset.value)) / 100;
                    metronomeGainNode.gain.setValueAtTime(volume, audioContext.currentTime);
                }
            }
            
            function generateKickSound(type) {
                if (!audioContext) return null;
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                switch(type) {
                    case 0: osc.frequency.setValueAtTime(150, audioContext.currentTime); osc.frequency.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5); gain.gain.setValueAtTime(1, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5); break;
                    case 1: osc.frequency.setValueAtTime(120, audioContext.currentTime); osc.frequency.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4); gain.gain.setValueAtTime(0.8, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4); break;
                    case 2: osc.frequency.setValueAtTime(100, audioContext.currentTime); osc.frequency.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3); gain.gain.setValueAtTime(0.7, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3); break;
                    case 3: osc.type = 'square'; osc.frequency.setValueAtTime(80, audioContext.currentTime); osc.frequency.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2); gain.gain.setValueAtTime(0.9, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2); break;
                }
                osc.connect(gain);
                gain.connect(kickGainNode);
                return { play: function() { osc.start(); osc.stop(audioContext.currentTime + 0.5); } };
            }
            
            function generateSnareSound(type) {
                if (!audioContext) return null;
                const noise = audioContext.createBufferSource();
                const noiseFilter = audioContext.createBiquadFilter();
                const noiseGain = audioContext.createGain();
                const osc = audioContext.createOscillator();
                const oscGain = audioContext.createGain();
                const bufferSize = audioContext.sampleRate * 0.5;
                const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                noise.buffer = buffer;
                noiseFilter.type = 'highpass';
                noiseFilter.frequency.value = 1000;
                noiseGain.gain.value = 0.5;
                switch(type) {
                    case 0: osc.frequency.setValueAtTime(200, audioContext.currentTime); osc.frequency.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3); oscGain.gain.setValueAtTime(0.7, audioContext.currentTime); oscGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3); noiseGain.gain.setValueAtTime(0.5, audioContext.currentTime); noiseGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3); break;
                    case 1: osc.type = 'square'; osc.frequency.setValueAtTime(150, audioContext.currentTime); osc.frequency.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2); oscGain.gain.setValueAtTime(0.8, audioContext.currentTime); oscGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2); noiseGain.gain.setValueAtTime(0.3, audioContext.currentTime); noiseGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2); break;
                    case 2: osc.frequency.setValueAtTime(300, audioContext.currentTime); osc.frequency.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1); oscGain.gain.setValueAtTime(0.6, audioContext.currentTime); oscGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1); noiseGain.gain.value = 0.1; break;
                    case 3: noiseGain.gain.setValueAtTime(0.7, audioContext.currentTime); noiseGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2); oscGain.gain.value = 0; break;
                }
                noise.connect(noiseFilter);
                noiseFilter.connect(noiseGain);
                osc.connect(oscGain);
                noiseGain.connect(snareGainNode);
                oscGain.connect(snareGainNode);
                noise.loop = true;
                return { play: function() { noise.start(); osc.start(); noise.stop(audioContext.currentTime + 0.5); osc.stop(audioContext.currentTime + 0.5); } };
            }
            
            function generateClosedHHSound(type) {
                if (!audioContext) return null;
                const gain = audioContext.createGain();
                const noise = audioContext.createBufferSource();
                const bufferSize = audioContext.sampleRate * 0.5;
                const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                noise.buffer = buffer;
                const filter = audioContext.createBiquadFilter();
                filter.type = 'highpass';
                filter.frequency.value = 8000;
                noise.connect(filter);
                filter.connect(gain);
                gain.connect(closedhhGainNode);
                
                switch(type) {
                    case 0: gain.gain.setValueAtTime(0.5, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05); break;
                    case 1: filter.frequency.value = 6000; gain.gain.setValueAtTime(0.4, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.08); break;
                    case 2: filter.frequency.value = 9000; gain.gain.setValueAtTime(0.6, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.03); break;
                    case 3: filter.frequency.value = 7500; gain.gain.setValueAtTime(0.5, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.06); break;
                }
                
                noise.loop = true;
                return { play: function() { noise.start(); noise.stop(audioContext.currentTime + 0.1); } };
            }
            
            function generateOpenHHSound(type) {
                if (!audioContext) return null;
                const gain = audioContext.createGain();
                const noise = audioContext.createBufferSource();
                const bufferSize = audioContext.sampleRate * 0.5;
                const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                noise.buffer = buffer;
                const filter = audioContext.createBiquadFilter();
                filter.type = 'highpass';
                filter.frequency.value = 6000;
                noise.connect(filter);
                filter.connect(gain);
                gain.connect(openhhGainNode);
                
                switch(type) {
                    case 0: gain.gain.setValueAtTime(0.4, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4); break;
                    case 1: gain.gain.setValueAtTime(0.35, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5); break;
                    case 2: gain.gain.setValueAtTime(0.45, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3); break;
                    case 3: gain.gain.setValueAtTime(0.5, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2); break;
                }
                
                noise.loop = true;
                return { play: function() { noise.start(); noise.stop(audioContext.currentTime + 1); } };
            }
            
            // Función para generar sonido de metrónomo
            function generateMetronomeSound(beatIndex) {
                if (!audioContext) return null;
                
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                
                // Sonido diferente para el primer tiempo de cada compás
                if (beatIndex === 0) {
                    // Sonido más agudo para el primer tiempo (downbeat)
                    osc.frequency.setValueAtTime(1000, audioContext.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
                    gain.gain.setValueAtTime(0.5, audioContext.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
                } else {
                    // Sonido más grave para los demás tiempos
                    osc.frequency.setValueAtTime(800, audioContext.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);
                    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);
                }
                
                osc.connect(gain);
                gain.connect(metronomeGainNode);
                
                return { 
                    play: function() { 
                        osc.start(); 
                        osc.stop(audioContext.currentTime + 0.1); 
                    } 
                };
            }
            
            function playStep() {
                const totalSteps = stepsPerMeasure * parseInt(measuresKnob.value);
                const stepsPerBeat = stepsPerMeasure / beatsPerMeasure;
                const currentBeat = Math.floor((currentStep % stepsPerMeasure) / stepsPerBeat);
                
                Object.values(instruments).forEach(inst => {
                    const steps = inst.steps.querySelectorAll('.step');
                    
                    if (steps.length > 0) {
                        const previousStep = (currentStep - 1 + totalSteps) % totalSteps;
                        steps[previousStep].classList.remove('playing');
                        steps[currentStep].classList.add('playing');
                    }
                    
                    // Reproducir sonido si el paso está activo
                    if (steps[currentStep] && steps[currentStep].classList.contains('active')) {
                        // Para el metrónomo, solo reproducimos en los tiempos
                        if (inst.class === 'metronome' && metronomeToggle.checked) {
                            // Verificar si estamos en un tiempo
                            if (currentStep % stepsPerBeat === 0) {
                                const sound = inst.soundFunc(currentBeat);
                                if (sound) sound.play();
                            }
                        } 
                        // Para los instrumentos normales
                        else if (inst.class !== 'metronome') {
                            const soundType = parseInt(inst.soundSelect.value);
                            const sound = inst.soundFunc(soundType);
                            if (sound) sound.play();
                        }
                    }
                });
                
                const bars = visualizer.querySelectorAll('.bar');
                bars.forEach((bar, index) => {
                    if (index === currentStep) {
                        bar.style.height = '100%';
                    } else {
                        bar.style.height = '10%';
                    }
                });
                
                currentStep = (currentStep + 1) % totalSteps;
                currentMeasure = Math.floor(currentStep / stepsPerMeasure) + 1;
                currentMeasureDisplay.textContent = `Compás actual: ${currentMeasure} / ${measuresKnob.value}`;
            }
            
            function togglePlaying() {
                initAudioContext();
                isPlaying = !isPlaying;
                if (isPlaying) {
                    currentStep = 0;
                    const bpm = parseInt(bpmKnob.value);
                    const interval = 60000 / bpm / (stepsPerMeasure / 4);
                    intervalId = setInterval(playStep, interval);
                    playStopButton.textContent = 'Stop';
                    playStopButton.style.backgroundColor = '#ff4d7c';
                    playStep();
                } else {
                    stopPlaying();
                }
            }
            
            function stopPlaying() {
                if (intervalId) {
                    clearInterval(intervalId);
                    intervalId = null;
                }
                isPlaying = false;
                playStopButton.textContent = 'Play';
                playStopButton.style.backgroundColor = '';
                document.querySelectorAll('.step.playing').forEach(step => step.classList.remove('playing'));
                document.querySelectorAll('.bar').forEach(bar => bar.style.height = '10%');
            }
            
            function setupSteps() {
                const numMeasures = parseInt(measuresKnob.value);
                const totalSteps = stepsPerMeasure * numMeasures;
                const stepsPerBeat = stepsPerMeasure / beatsPerMeasure;
                
                Object.values(instruments).forEach(inst => {
                    const stepsContainer = inst.steps;
                    stepsContainer.innerHTML = '';
                    
                    for (let m = 0; m < numMeasures; m++) {
                        const measureRow = document.createElement('div');
                        measureRow.classList.add('steps-row');
                        
                        for (let i = 0; i < stepsPerMeasure; i++) {
                            const stepIndex = m * stepsPerMeasure + i;
                            const step = document.createElement('div');
                            step.classList.add('step', inst.class);
                            step.dataset.step = stepIndex;
                            
                            // Para el metrónomo, activamos automáticamente los tiempos
                            if (inst.class === 'metronome') {
                                if (i % stepsPerBeat === 0) {
                                    step.classList.add('active');
                                }
                                step.style.pointerEvents = 'none'; // No permitir interacción
                            } else {
                                step.addEventListener('click', () => {
                                    initAudioContext();
                                    step.classList.toggle('active');
                                });
                            }
                            
                            measureRow.appendChild(step);
                        }
                        stepsContainer.appendChild(measureRow);
                    }
                });
                
                setupStepsHeader(totalSteps, numMeasures);
            }
            
            function setupStepsHeader(totalSteps, numMeasures) {
                stepsHeader.innerHTML = '';
                
                for (let m = 0; m < numMeasures; m++) {
                    const headerRow = document.createElement('div');
                    headerRow.classList.add('steps-header-row');
                    
                    for (let i = 0; i < stepsPerMeasure; i++) {
                        const stepNumber = document.createElement('div');
                        stepNumber.classList.add('step-number');
                        stepNumber.textContent = m * stepsPerMeasure + i + 1;
                        headerRow.appendChild(stepNumber);
                    }
                    stepsHeader.appendChild(headerRow);
                }
            }
            
            function createVisualizer() {
                const numMeasures = parseInt(measuresKnob.value);
                const totalSteps = stepsPerMeasure * numMeasures;
                visualizer.innerHTML = '';
                for (let i = 0; i < totalSteps; i++) {
                    const bar = document.createElement('div');
                    bar.classList.add('bar');
                    bar.style.height = '10%';
                    bar.style.left = `${(i / totalSteps) * 100}%`;
                    visualizer.appendChild(bar);
                }
            }
            
            // Funciones de Guardar/Cargar
            function saveBeat() {
                const beatData = {
                    name: "Ritmo de Batería",
                    bpm: parseInt(bpmKnob.value),
                    timeSignature: timeSignatureSelect.value,
                    measures: parseInt(measuresKnob.value),
                    beatsPerMeasure: beatsPerMeasure,
                    metronomeEnabled: metronomeToggle.checked,
                    metronomeVolume: parseInt(instruments.metronome.knob.dataset.value),
                    instruments: {}
                };
            
                Object.keys(instruments).forEach(key => {
                    const inst = instruments[key];
                    const steps = Array.from(inst.steps.querySelectorAll('.step')).map(step => step.classList.contains('active'));
                    beatData.instruments[key] = {
                        sound: key === 'metronome' ? 0 : parseInt(inst.soundSelect.value),
                        volume: parseInt(inst.knob.dataset.value),
                        steps: steps
                    };
                });
            
                return beatData;
            }
            
            function exportBeat() {
                const beat = saveBeat();
                const name = prompt("Ingresa un nombre para el ritmo:", "Nuevo Ritmo");
                if (!name) return;
                
                beat.name = name;
                const jsonString = JSON.stringify(beat, null, 2);
                const blob = new Blob([jsonString], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${name.replace(/\s/g, '_')}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
            
            function importBeat(event) {
                const file = event.target.files[0];
                if (!file) return;
            
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const beat = JSON.parse(e.target.result);
                        loadBeat(beat);
                        alert(`Ritmo "${beat.name || 'sin nombre'}" cargado exitosamente.`);
                    } catch (error) {
                        console.error("Error al cargar el archivo:", error);
                        alert('Error al cargar el archivo. Asegúrate de que sea un archivo JSON de ritmo válido.');
                    }
                };
                reader.readAsText(file);
            }
            
            function loadBeat(beatData) {
                stopPlaying();
                
                // Actualizar controles principales
                bpmKnob.setValue(beatData.bpm);
                timeSignatureSelect.value = beatData.timeSignature;
                
                // Actualizar beatsPerMeasure si está en los datos
                if (beatData.beatsPerMeasure) {
                    beatsPerMeasure = beatData.beatsPerMeasure;
                }
                
                // Cargar configuración del metrónomo
                if (beatData.metronomeEnabled !== undefined) {
                    metronomeToggle.checked = beatData.metronomeEnabled;
                }
                if (beatData.metronomeVolume !== undefined) {
                    instruments.metronome.knob.dataset.value = beatData.metronomeVolume;
                    instruments.metronome.knobValue.textContent = `${beatData.metronomeVolume}%`;
                    updateMetronomeVolume(beatData.metronomeVolume);
                }
                
                // Si el número de compases ha cambiado, reconfigurar la interfaz
                if (parseInt(measuresKnob.value) !== beatData.measures) {
                    measuresKnob.setValue(beatData.measures);
                    setupSteps();
                    createVisualizer();
                }
                
                Object.keys(beatData.instruments).forEach(key => {
                    const inst = instruments[key];
                    const instData = beatData.instruments[key];
                    
                    if (key !== 'metronome') {
                        inst.soundSelect.value = instData.sound;
                    }
                    
                    // Actualizar perilla de volumen
                    inst.knob.dataset.value = instData.volume;
                    inst.knobValue.textContent = `${instData.volume}%`;
                    
                    if (audioContext && inst.volumeNode) {
                        inst.volumeNode.gain.setValueAtTime(instData.volume / 100, audioContext.currentTime);
                    }
                    
                    instData.steps.forEach((isActive, index) => {
                        const stepElement = inst.steps.querySelector(`[data-step="${index}"]`);
                        if (stepElement) {
                            if (isActive) {
                                stepElement.classList.add('active');
                            } else {
                                stepElement.classList.remove('active');
                            }
                        }
                    });
                });
            }
            
            // Actualizar beatsPerMeasure cuando cambie el compás
            function updateTimeSignature() {
                stopPlaying();
                if (timeSignatureSelect.value === '4/4') {
                    stepsPerMeasure = 16;
                    beatsPerMeasure = 4; // 4 tiempos por compás
                } else {
                    stepsPerMeasure = 12;
                    beatsPerMeasure = 6; // 6 tiempos por compás en 6/8
                }
                setupSteps();
                createVisualizer();
            }
            
            // Listeners de eventos
            playStopButton.addEventListener('click', togglePlaying);
            clearButton.addEventListener('click', () => {
                stopPlaying();
                document.querySelectorAll('.step.active').forEach(step => {
                    // No limpiar los pasos del metrónomo
                    if (!step.classList.contains('metronome')) {
                        step.classList.remove('active');
                    }
                });
            });
            timeSignatureSelect.addEventListener('change', updateTimeSignature);
            
            exportButton.addEventListener('click', exportBeat);
            importButton.addEventListener('click', () => importFile.click());
            importFile.addEventListener('change', importBeat);
            
            // Inicializar la interfaz
            updateTimeSignature(); // Para establecer los valores iniciales correctos
        });
