document.addEventListener('DOMContentLoaded', () => {
  const btnUp = document.getElementById('btn-up');
  const btnDown = document.getElementById('btn-down');
  const stickmanContainer = document.getElementById('stickman-container');
  const volumeText = document.getElementById('volume-text');
  const progressFill = document.getElementById('progress-fill');

  const normalEyes = document.getElementById('normal-eyes');
  const smile = document.getElementById('smile');
  const screamFace = document.getElementById('scream-face');
  const relievedFace = document.getElementById('relieved-face');

  let volume = 0;
  let pressInterval = null;
  let currentAction = null;

  function updateVisuals() {
    volumeText.innerText = Math.floor(volume);
    progressFill.style.width = `${volume}%`;

    let currentColor = '#1a1a1a';

    if (currentAction === 'up') {
      const red = Math.floor(26 + volume * 2.29);
      const gb = Math.floor(26 - volume * 0.26);
      currentColor = `rgb(${red}, ${gb}, ${gb})`;
    } else if (currentAction === 'down') {
      const blue = Math.floor(100 + (100 - volume) * 1.55);
      currentColor = `rgb(30, 144, ${blue})`;
    } else {
      const red = Math.floor(26 + volume * 2.29);
      const gb = Math.floor(26 - volume * 0.26);
      currentColor = `rgb(${red}, ${gb}, ${gb})`;
    }

    document.documentElement.style.setProperty(
      '--stickman-color',
      currentColor,
    );

    if (currentAction === 'up' && volume > 0) {
      const shakeIntensity = (volume / 100) * 12;
      document.documentElement.style.setProperty(
        '--shake-intensity',
        `${shakeIntensity}px`,
      );
      stickmanContainer.classList.add('shaking');
    } else {
      document.documentElement.style.setProperty('--shake-intensity', '0px');
      stickmanContainer.classList.remove('shaking');
    }

    if (currentAction === 'up') {
      normalEyes.style.display = 'block';
      smile.style.display = 'none';
      screamFace.style.display = 'block';
      relievedFace.style.display = 'none';
    } else if (currentAction === 'down') {
      normalEyes.style.display = 'none';
      smile.style.display = 'none';
      screamFace.style.display = 'none';
      relievedFace.style.display = 'block';
    } else {
      normalEyes.style.display = 'block';
      smile.style.display = 'block';
      screamFace.style.display = 'none';
      relievedFace.style.display = 'none';
    }
  }

  function step() {
    if (currentAction === 'up') {
      if (volume < 100) {
        volume = Math.min(100, volume + 1);
      }
    } else if (currentAction === 'down') {
      if (volume > 0) {
        volume = Math.max(0, volume - 1);
      }
    }
    updateVisuals();
  }

  function startAction(action, e) {
    if (e && e.cancelable) e.preventDefault();

    currentAction = action;
    updateVisuals();

    clearInterval(pressInterval);
    pressInterval = setInterval(step, 40);
  }

  function stopAction() {
    currentAction = null;
    clearInterval(pressInterval);
    updateVisuals();
  }

  btnUp.addEventListener('mousedown', (e) => startAction('up', e));
  btnUp.addEventListener('touchstart', (e) => startAction('up', e), {
    passive: false,
  });

  btnDown.addEventListener('mousedown', (e) => startAction('down', e));
  btnDown.addEventListener('touchstart', (e) => startAction('down', e), {
    passive: false,
  });

  window.addEventListener('mouseup', stopAction);
  window.addEventListener('touchend', stopAction);

  stickmanContainer.addEventListener('contextmenu', (e) => e.preventDefault());
});
