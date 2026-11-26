import { Platform, StyleSheet } from 'react-native';
import { BusTheme } from '@/constants/theme';

const { colors, radius } = BusTheme;
const isWeb = Platform.OS === 'web';

export const SharedStyles = StyleSheet.create({
  // Moldura externa: no navegador centraliza simulando celular; no Android/iOS ocupa 100% da tela
  screenWrapper: {
    flex: 1,
    backgroundColor: isWeb ? '#1E293B' : colors.surface,
    ...(isWeb
      ? {
          justifyContent: 'center',
          alignItems: 'center',
        }
      : {}),
  },
  appFrame: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.background,
    ...(isWeb
      ? {
          maxWidth: 420,
          maxHeight: 850,
          overflow: 'hidden',
          borderRadius: radius.xl,
        }
      : {}),
  },
  // SafeAreaView usa surface (#FFFFFF) para manter a barra de status clara combinando com o header
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  bodyContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Cabeçalho padrão das telas principais
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },

  // Cards reutilizáveis (Favoritos, Busca, Sobre, Paradas)
  card: {
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  cardPressed: {
    backgroundColor: colors.brandSoft,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Badge laranja padrão do número da linha
  routeBadge: {
    backgroundColor: colors.brand,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  routeBadgeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.brandText,
  },

  // Botão flutuante de voltar (telas de Mapa e Parada)
  floatingBackButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  // Botão primário padrão
  primaryButton: {
    height: 46,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: colors.brandText,
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Estados vazios
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 48,
    paddingHorizontal: 20,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

