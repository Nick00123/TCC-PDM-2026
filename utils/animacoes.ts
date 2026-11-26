import { useEffect, useMemo, useState } from 'react';
import { Animated } from 'react-native';

// Anima a entrada do conteúdo e de cada item, reiniciando quando a lista muda de tamanho.
export function useAnimacaoCascata(
  quantidadeItens: number,
  delayInicial = 200,
  intervalo = 120,
  chaveReanimacao?: string | number | boolean
) {
  const [fadeAnimTop] = useState(() => new Animated.Value(0));
  const animacoes = useMemo(
    () => Array.from({ length: quantidadeItens }, () => new Animated.Value(0)),
    [quantidadeItens]
  );

  useEffect(() => {
    fadeAnimTop.setValue(0);
    const animacaoTopo = Animated.timing(fadeAnimTop, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    });

    const animacoesItens = animacoes.map((anim, index) => {
      anim.setValue(0);
      return Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: delayInicial + index * intervalo,
        useNativeDriver: true,
      });
    });

    animacaoTopo.start();
    if (animacoesItens.length > 0) {
      Animated.parallel(animacoesItens).start();
    }

    return () => {
      animacaoTopo.stop();
      animacoesItens.forEach((animacao) => animacao.stop());
    };
  }, [animacoes, fadeAnimTop, delayInicial, intervalo, chaveReanimacao]);

  return { fadeAnimTop, animacoes };
}

// Compartilha o movimento vertical usado na entrada em cascata dos cards.
export function estiloEntradaCascata(animacao: Animated.Value) {
  return {
    opacity: animacao,
    transform: [{ translateY: animacao.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  };
}

// Reproduz a mesma entrada suave sempre que um modal fica visível.
export function useAnimacaoModal(visivel: boolean) {
  const [animModal] = useState(() => new Animated.Value(0));

  useEffect(() => {
    animModal.stopAnimation();
    if (!visivel) {
      animModal.setValue(0);
      return;
    }

    const animacao = Animated.spring(animModal, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    });
    animacao.start();

    return () => animacao.stop();
  }, [animModal, visivel]);

  const estiloAnimado = {
    opacity: animModal,
    transform: [
      {
        scale: animModal.interpolate({
          inputRange: [0, 1],
          outputRange: [0.94, 1],
        }),
      },
      {
        translateY: animModal.interpolate({
          inputRange: [0, 1],
          outputRange: [16, 0],
        }),
      },
    ],
  };

  return { animModal, estiloAnimado };
}