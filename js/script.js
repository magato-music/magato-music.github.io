        document.addEventListener('DOMContentLoaded', function() {
            // Configuración inicial
            let audioContext;
            let isPlaying = false;
            let currentStep = 0;
            let currentMeasure = 1;
            let intervalId = null;
            let stepsPerMeasure = 16;
            
            // Nodos de ganancia para control de volumen
            let masterGainNode;
            let kickGainNode, snareGainNode, closedhhGainNode, openhhGainNode;
            
            // Elementos DOM
            const bpmSlider = document.getElementById('bpm');
            const bpmValue = document.getElementById('bpm-value');
            const timeSignatureSelect = document.getElementById('time-signature');
            const measuresSlider = document.getElementById('measures');
            const measuresValue = document.getElementById('measures-value');
            const playStopButton = document.getElementById('play-stop');
            const clearButton = document.getElementById('clear');
            const stepsHeader = document.getElementById('steps-header');
            const currentMeasureDisplay = document.getElementById('current-measure');
            const visualizer = document.getElementById('visualizer');
            
            const masterVolumeSlider = document.getElementById('master-volume');
            const masterVolumeValue = document.getElementById('master-volume-value');
            const kickSoundSelect = document.getElementById('kick-sound');
            const kickVolumeSlider = document.getElementById('kick-volume');
            const kickVolumeValue = document.getElementById('kick-volume-value');
            const snareSoundSelect = document.getElementById('snare-sound');
            const snareVolumeSlider = document.getElementById('snare-volume');
            const snareVolumeValue = document.getElementById('snare-volume-value');
            const closedhhSoundSelect = document.getElementById('closedhh-sound');
            const closedhhVolumeSlider = document.getElementById('closedhh-volume');
            const closedhhVolumeValue = document.getElementById('closedhh-volume-value');
            const openhhSoundSelect = document.getElementById('openhh-sound');
            const openhhVolumeSlider = document.getElementById('openhh-volume');
            const openhhVolumeValue = document.getElementById('openhh-volume-value');
            
            const exportButton = document.getElementById('export-button');
            const importButton = document.getElementById('import-button');
            const importFile = document.getElementById('import-file');
            
            const instruments = {
                kick: {
                    steps: document.getElementById('kick-steps'),
                    class: 'kick',
                    volumeNode: null,
                    volumeSlider: kickVolumeSlider,
                    volumeValue: kickVolumeValue,
                    soundSelect: kickSoundSelect,
                    soundFunc: generateKickSound,
                    volumeFunc: updateKickVolume
                },
                snare: {
                    steps: document.getElementById('snare-steps'),
                    class: 'snare',
                    volumeNode: null,
                    volumeSlider: snareVolumeSlider,
                    volumeValue: snareVolumeValue,
                    soundSelect: snareSoundSelect,
                    soundFunc: generateSnareSound,
                    volumeFunc: updateSnareVolume
                },
                closedhh: {
                    steps: document.getElementById('closedhh-steps'),
                    class: 'closedhh',
                    volumeNode: null,
                    volumeSlider: closedhhVolumeSlider,
                    volumeValue: closedhhVolumeValue,
                    soundSelect: closedhhSoundSelect,
                    soundFunc: generateClosedHHSound,
                    volumeFunc: updateClosedHHVolume
                },
                openhh: {
                    steps: document.getElementById('openhh-steps'),
                    class: 'openhh',
                    volumeNode: null,
                    volumeSlider: openhhVolumeSlider,
                    volumeValue: openhhVolumeValue,
                    soundSelect: openhhSoundSelect,
                    soundFunc: generateOpenHHSound,
                    volumeFunc: updateOpenHHVolume
                }
            };
            
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
                    
                    instruments.kick.volumeNode = kickGainNode;
                    instruments.snare.volumeNode = snareGainNode;
                    instruments.closedhh.volumeNode = closedhhGainNode;
                    instruments.openhh.volumeNode = openhhGainNode;
                    
                    updateMasterVolume();
                    Object.values(instruments).forEach(inst => inst.volumeFunc());
                    
                    createVisualizer();
                }
            }
            
            function updateMasterVolume() {
                if (masterGainNode) {
                    const volume = parseInt(masterVolumeSlider.value) / 100;
                    masterGainNode.gain.setValueAtTime(volume, audioContext.currentTime);
                    masterVolumeValue.textContent = `${masterVolumeSlider.value}%`;
                }
            }
            
            function updateKickVolume() {
                if (kickGainNode) {
                    const volume = parseInt(kickVolumeSlider.value) / 100;
                    kickGainNode.gain.setValueAtTime(volume, audioContext.currentTime);
                    kickVolumeValue.textContent = `${kickVolumeSlider.value}%`;
                }
            }
            
            function updateSnareVolume() {
                if (snareGainNode) {
                    const volume = parseInt(snareVolumeSlider.value) / 100;
                    snareGainNode.gain.setValueAtTime(volume, audioContext.currentTime);
                    snareVolumeValue.textContent = `${snareVolumeSlider.value}%`;
                }
            }
            
            function updateClosedHHVolume() {
                if (closedhhGainNode) {
                    const volume = parseInt(closedhhVolumeSlider.value) / 100;
                    closedhhGainNode.gain.setValueAtTime(volume, audioContext.currentTime);
                    closedhhVolumeValue.textContent = `${closedhhVolumeSlider.value}%`;
                }
            }
            
            function updateOpenHHVolume() {
                if (openhhGainNode) {
                    const volume = parseInt(openhhVolumeSlider.value) / 100;
                    openhhGainNode.gain.setValueAtTime(volume, audioContext.currentTime);
                    openhhVolumeValue.textContent = `${openhhVolumeSlider.value}%`;
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
                    case 4: osc.frequency.setValueAtTime(130, audioContext.currentTime); osc.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.1); osc.frequency.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5); gain.gain.setValueAtTime(1, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5); break;
                    case 5: osc.frequency.setValueAtTime(60, audioContext.currentTime); osc.frequency.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.6); gain.gain.setValueAtTime(1, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.6); break;
                    case 6: osc.frequency.setValueAtTime(100, audioContext.currentTime); osc.frequency.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4); gain.gain.setValueAtTime(0.6, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4); break;
                    case 7: osc.type = 'sawtooth'; osc.frequency.setValueAtTime(80, audioContext.currentTime); osc.frequency.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3); gain.gain.setValueAtTime(0.8, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3); break;
                    case 8: osc.frequency.setValueAtTime(50, audioContext.currentTime); osc.frequency.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.7); gain.gain.setValueAtTime(0.9, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.7); break;
                    case 9: osc.type = 'sine'; osc.frequency.setValueAtTime(110, audioContext.currentTime); osc.frequency.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5); gain.gain.setValueAtTime(0.7, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5); break;
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
                    case 4: osc.frequency.setValueAtTime(500, audioContext.currentTime); osc.frequency.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1); oscGain.gain.setValueAtTime(0.8, audioContext.currentTime); oscGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1); noiseGain.gain.value = 0.2; break;
                    case 5: osc.type = 'sine'; osc.frequency.setValueAtTime(250, audioContext.currentTime); osc.frequency.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4); oscGain.gain.setValueAtTime(0.6, audioContext.currentTime); oscGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4); noiseGain.gain.value = 0.3; break;
                    case 6: osc.type = 'sawtooth'; osc.frequency.setValueAtTime(180, audioContext.currentTime); osc.frequency.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3); oscGain.gain.setValueAtTime(0.7, audioContext.currentTime); oscGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3); noiseGain.gain.setValueAtTime(0.4, audioContext.currentTime); noiseGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3); break;
                    case 7: osc.frequency.setValueAtTime(200, audioContext.currentTime); osc.frequency.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2); oscGain.gain.setValueAtTime(0.5, audioContext.currentTime); oscGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2); noiseGain.gain.setValueAtTime(0.6, audioContext.currentTime); noiseGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2); break;
                    case 8: osc.frequency.setValueAtTime(350, audioContext.currentTime); osc.frequency.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15); oscGain.gain.setValueAtTime(0.4, audioContext.currentTime); oscGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15); noiseGain.gain.setValueAtTime(0.8, audioContext.currentTime); noiseGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15); break;
                    case 9: osc.type = 'square'; osc.frequency.setValueAtTime(220, audioContext.currentTime); osc.frequency.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.25); oscGain.gain.setValueAtTime(0.7, audioContext.currentTime); oscGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.25); noiseGain.gain.setValueAtTime(0.5, audioContext.currentTime); noiseGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.25); break;
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
                    case 4: filter.frequency.value = 10000; gain.gain.setValueAtTime(0.7, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.02); break;
                    case 5: filter.frequency.value = 8500; gain.gain.setValueAtTime(0.55, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.07); break;
                    case 6: filter.frequency.value = 5000; gain.gain.setValueAtTime(0.45, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.09); break;
                    case 7: filter.frequency.value = 9500; gain.gain.setValueAtTime(0.65, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.04); break;
                    case 8: filter.frequency.value = 7000; gain.gain.setValueAtTime(0.5, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05); break;
                    case 9: filter.frequency.value = 11000; gain.gain.setValueAtTime(0.7, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.025); break;
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
                    case 4: gain.gain.setValueAtTime(0.6, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15); break;
                    case 5: gain.gain.setValueAtTime(0.4, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.6); break;
                    case 6: gain.gain.setValueAtTime(0.3, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.7); break;
                    case 7: gain.gain.setValueAtTime(0.55, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4); break;
                    case 8: gain.gain.setValueAtTime(0.65, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3); break;
                    case 9: gain.gain.setValueAtTime(0.7, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.25); break;
                }
                
                noise.loop = true;
                return { play: function() { noise.start(); noise.stop(audioContext.currentTime + 1); } };
            }
            
            function playStep() {
                const totalSteps = stepsPerMeasure * parseInt(measuresSlider.value);
                
                Object.values(instruments).forEach(inst => {
                    const steps = inst.steps.querySelectorAll('.step');
                    
                    if (steps.length > 0) {
                        const previousStep = (currentStep - 1 + totalSteps) % totalSteps;
                        steps[previousStep].classList.remove('playing');
                        steps[currentStep].classList.add('playing');
                    }
                    
                    if (steps[currentStep] && steps[currentStep].classList.contains('active')) {
                        const soundType = parseInt(inst.soundSelect.value);
                        const sound = inst.soundFunc(soundType);
                        if (sound) {
                            sound.play();
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
                currentMeasureDisplay.textContent = `Compás actual: ${currentMeasure} / ${measuresSlider.value}`;
            }
            
            function togglePlaying() {
                initAudioContext();
                isPlaying = !isPlaying;
                if (isPlaying) {
                    currentStep = 0;
                    const bpm = parseInt(bpmSlider.value);
                    const interval = 60000 / bpm / (stepsPerMeasure / 4);
                    intervalId = setInterval(playStep, interval);
                    playStopButton.textContent = 'Stop';
                    playStopButton.style.backgroundColor = 'var(--accent)';
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
                playStopButton.style.backgroundColor = 'var(--playing)';
                document.querySelectorAll('.step.playing').forEach(step => step.classList.remove('playing'));
                document.querySelectorAll('.bar').forEach(bar => bar.style.height = '10%');
            }
            
            function setupSteps() {
                const numMeasures = parseInt(measuresSlider.value);
                const totalSteps = stepsPerMeasure * numMeasures;
                
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
                            step.addEventListener('click', () => {
                                initAudioContext();
                                step.classList.toggle('active');
                            });
                            measureRow.appendChild(step);
                        }
                        stepsContainer.appendChild(measureRow);
                    }
                });
                
                setupStepsHeader(totalSteps);
            }
            
            function setupStepsHeader(totalSteps) {
                stepsHeader.innerHTML = '';
                const numMeasures = parseInt(measuresSlider.value);
                
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
                const numMeasures = parseInt(measuresSlider.value);
                const totalSteps = stepsPerMeasure * numMeasures;
                visualizer.innerHTML = '';
                for (let i = 0; i < totalSteps; i++) {
                    const bar = document.createElement('div');
                    bar.classList.add('bar');
                    visualizer.appendChild(bar);
                }
            }
            
            // Funciones de Guardar/Cargar
            function saveBeat() {
                const beatData = {
                    name: "Ritmo de Batería",
                    bpm: parseInt(bpmSlider.value),
                    timeSignature: timeSignatureSelect.value,
                    measures: parseInt(measuresSlider.value),
                    instruments: {}
                };
            
                Object.keys(instruments).forEach(key => {
                    const inst = instruments[key];
                    const steps = Array.from(inst.steps.querySelectorAll('.step')).map(step => step.classList.contains('active'));
                    beatData.instruments[key] = {
                        sound: parseInt(inst.soundSelect.value),
                        volume: parseInt(inst.volumeSlider.value),
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
                bpmSlider.value = beatData.bpm;
                bpmValue.textContent = `${beatData.bpm} BPM`;
                timeSignatureSelect.value = beatData.timeSignature;
                
                // Si el número de compases ha cambiado, reconfigurar la interfaz
                if (parseInt(measuresSlider.value) !== beatData.measures) {
                    measuresSlider.value = beatData.measures;
                    measuresValue.textContent = `${beatData.measures} compás${beatData.measures > 1 ? 'es' : ''}`;
                    setupSteps();
                    createVisualizer();
                }
                
                Object.keys(beatData.instruments).forEach(key => {
                    const inst = instruments[key];
                    const instData = beatData.instruments[key];
                    
                    inst.soundSelect.value = instData.sound;
                    inst.volumeSlider.value = instData.volume;
                    inst.volumeValue.textContent = `${instData.volume}%`;
                    
                    if (audioContext) {
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
            
            // Listeners de eventos
            playStopButton.addEventListener('click', togglePlaying);
            clearButton.addEventListener('click', () => {
                stopPlaying();
                document.querySelectorAll('.step.active').forEach(step => step.classList.remove('active'));
            });
            bpmSlider.addEventListener('input', () => {
                bpmValue.textContent = `${bpmSlider.value} BPM`;
                if (isPlaying) {
                    stopPlaying();
                    togglePlaying();
                }
            });
            timeSignatureSelect.addEventListener('change', () => {
                stopPlaying();
                if (timeSignatureSelect.value === '4/4') {
                    stepsPerMeasure = 16;
                } else {
                    stepsPerMeasure = 12;
                }
                setupSteps();
                createVisualizer();
            });
            measuresSlider.addEventListener('input', () => {
                measuresValue.textContent = `${measuresSlider.value} compás${measuresSlider.value > 1 ? 'es' : ''}`;
                stopPlaying();
                setupSteps();
                createVisualizer();
            });
            masterVolumeSlider.addEventListener('input', updateMasterVolume);
            kickVolumeSlider.addEventListener('input', updateKickVolume);
            snareVolumeSlider.addEventListener('input', updateSnareVolume);
            closedhhVolumeSlider.addEventListener('input', updateClosedHHVolume);
            openhhVolumeSlider.addEventListener('input', updateOpenHHVolume);
            
            exportButton.addEventListener('click', exportBeat);
            importButton.addEventListener('click', () => importFile.click());
            importFile.addEventListener('change', importBeat);
            
            setupSteps();
            createVisualizer();
        });