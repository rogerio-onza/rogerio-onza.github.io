/**
 * Paw Trail Effect - Pegadas de onça seguindo o mouse
 * Cria pegadas que aparecem ao mover o mouse, alternando entre esquerda/direita
 */

(function() {
  'use strict';

  // Configurações
  const CONFIG = {
    pawImagePath: 'images/paw.svg',
    pawSize: 20,                    // Tamanho da pegada em pixels
    minDistance: 80,                 // Distância mínima entre pegadas
    fadeOutDelay: 2500,             // Tempo até começar a desaparecer (ms)
    fadeOutDuration: 1000,          // Duração do fade out (ms)
    maxPaws: 30,                    // Número máximo de pegadas na tela
    pawVariation: 2,                // Variação de rotação entre patas esquerda/direita (graus)
    randomVariation: 3,             // Variação aleatória máxima (graus)
    directionSmoothing: 0.3,        // Suavização da mudança de direção (0-1, maior = mais suave)
    excludeSelectors: [             // Elementos onde pegadas não aparecem
      '.navbar',
      'a',
      'button',
      '.btn',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p',
      'input',
      'textarea'
    ]
  };

  // Estado
  let lastX = -1000;
  let lastY = -1000;
  let isLeftPaw = true;
  let pawCount = 0;
  let isMouseOverExcluded = false;
  let currentDirection = 0;  // Direção atual da caminhada

  // Container para as pegadas
  let pawContainer;

  /**
   * Inicializa o container de pegadas
   */
  function initPawContainer() {
    pawContainer = document.createElement('div');
    pawContainer.id = 'paw-trail-container';
    pawContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
      overflow: hidden;
    `;
    document.body.appendChild(pawContainer);
  }

  /**
   * Verifica se o mouse está sobre um elemento excluído
   */
  function isOverExcludedElement(x, y) {
    const elements = document.elementsFromPoint(x, y);
    return elements.some(el => {
      // Verifica se corresponde a algum seletor excluído
      return CONFIG.excludeSelectors.some(selector => {
        try {
          return el.matches(selector) || el.closest(selector);
        } catch (e) {
          return false;
        }
      });
    });
  }

  /**
   * Calcula a distância entre dois pontos
   */
  function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  /**
   * Calcula o ângulo entre dois pontos
   */
  function angle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
  }

  /**
   * Cria uma pegada no container
   */
  function createPaw(x, y, rotation, isLeft) {
    // Remove pegadas antigas se exceder o máximo
    if (pawCount >= CONFIG.maxPaws) {
      const oldestPaw = pawContainer.querySelector('.paw-print');
      if (oldestPaw) {
        oldestPaw.remove();
        pawCount--;
      }
    }

    const paw = document.createElement('div');
    paw.className = 'paw-print';
    
    // Estilos da pegada
    paw.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: ${CONFIG.pawSize}px;
      height: ${CONFIG.pawSize}px;
      background-image: url('${CONFIG.pawImagePath}');
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      transform: translate(-50%, -50%) rotate(${rotation}deg) ${isLeft ? '' : 'scaleX(-1)'};
      opacity: 0;
      transition: opacity 0.3s ease-in;
      pointer-events: none;
    `;

    pawContainer.appendChild(paw);
    pawCount++;

    // Anima a entrada
    requestAnimationFrame(() => {
      paw.style.opacity = '0.7';
    });

    // Remove após o tempo configurado
    setTimeout(() => {
      paw.style.transition = `opacity ${CONFIG.fadeOutDuration}ms ease-out`;
      paw.style.opacity = '0';
      
      setTimeout(() => {
        if (paw.parentNode) {
          paw.remove();
          pawCount--;
        }
      }, CONFIG.fadeOutDuration);
    }, CONFIG.fadeOutDelay);
  }

  /**
   * Handler do movimento do mouse
   */
  function handleMouseMove(e) {
    const x = e.clientX;
    const y = e.clientY;

    // Verifica se está sobre elemento excluído
    const overExcluded = isOverExcludedElement(x, y);
    
    if (overExcluded) {
      isMouseOverExcluded = true;
      return;
    }

    isMouseOverExcluded = false;

    // Calcula distância desde última pegada
    const dist = distance(lastX, lastY, x, y);

    // Só cria pegada se moveu distância mínima
    if (dist >= CONFIG.minDistance) {
      // Calcula ângulo do movimento para direção geral
      const moveAngle = angle(lastX, lastY, x, y);
      
      // Atualiza direção suavemente (interpolação)
      if (lastX === -1000) {
        currentDirection = moveAngle;
      } else {
        // Interpola suavemente entre direção atual e nova
        let angleDiff = moveAngle - currentDirection;
        // Normaliza diferença para -180 a 180
        while (angleDiff > 180) angleDiff -= 360;
        while (angleDiff < -180) angleDiff += 360;
        currentDirection += angleDiff * CONFIG.directionSmoothing;
      }

      // Pequena variação natural entre patas esquerda/direita
      const pawVariation = isLeftPaw ? -CONFIG.pawVariation : CONFIG.pawVariation;
      const randomVariation = (Math.random() - 0.5) * CONFIG.randomVariation;
      const totalRotation = currentDirection + pawVariation + randomVariation;

      // Offset para alternar lado (simula patas esquerda/direita)
      const offsetAngle = (currentDirection + 90) * (Math.PI / 180); // Perpendicular à direção
      const offsetDistance = isLeftPaw ? -10 : 10;
      const offsetX = Math.cos(offsetAngle) * offsetDistance;
      const offsetY = Math.sin(offsetAngle) * offsetDistance;

      // Cria a pegada
      createPaw(x + offsetX, y + offsetY, totalRotation, isLeftPaw);

      // Alterna o lado
      isLeftPaw = !isLeftPaw;

      // Atualiza posição
      lastX = x;
      lastY = y;
    }
  }

  /**
   * Limpa todas as pegadas ao sair da página
   */
  function handleMouseLeave() {
    const paws = pawContainer.querySelectorAll('.paw-print');
    paws.forEach(paw => {
      paw.style.transition = 'opacity 0.5s ease-out';
      paw.style.opacity = '0';
      setTimeout(() => {
        if (paw.parentNode) {
          paw.remove();
          pawCount--;
        }
      }, 500);
    });
  }

  /**
   * Inicializa o efeito
   */
  function init() {
    // Aguarda o DOM estar pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    // Cria o container
    initPawContainer();

    // Adiciona event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    console.log('🐆 Paw trail effect initialized');
  }

  // Inicializa
  init();
})();