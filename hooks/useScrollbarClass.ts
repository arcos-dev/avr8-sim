/**
 * Hook para obter a classe CSS correta de scrollbar baseado no tema atual
 * Retorna 'auto-scrollbar' que se adapta automaticamente ao tema via CSS
 */
export const useScrollbarClass = (): string => {
  return 'auto-scrollbar';
};

/**
 * Constante para a classe de scrollbar que se adapta ao tema
 */
export const SCROLLBAR_CLASS = 'auto-scrollbar';
