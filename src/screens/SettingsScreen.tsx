import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, List, Switch, Button, useTheme, Divider, Portal, Modal, IconButton } from 'react-native-paper';
import { useThemeStore } from '../hooks/useTheme';
import { useAuthStore } from '../store/authStore';
import { spacing, typography } from '../theme';
import * as Clipboard from 'expo-clipboard';
import { db } from '../services/database';

export const SettingsScreen = ({ navigation }: any) => {
    const theme = useTheme();
    const { isDarkMode, toggleTheme } = useThemeStore();
    const { logout, user } = useAuthStore();

    const [integrationModalVisible, setIntegrationModalVisible] = useState(false);
    const [integrationKey, setIntegrationKey] = useState<string | null>(null);
    const [isGeneratingKey, setIsGeneratingKey] = useState(false);

    const handleGenerateKey = async () => {
        setIsGeneratingKey(true);
        try {
            const { key } = await db.generateIntegrationKey();
            setIntegrationKey(key);
            setIntegrationModalVisible(true);
        } catch (error) {
            console.error('Error generating key:', error);
        } finally {
            setIsGeneratingKey(false);
        }
    };

    const copyToClipboard = async () => {
        if (integrationKey) {
            await Clipboard.setStringAsync(integrationKey);
        }
    };

    const styles = createStyles(theme);

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Geral</Text>
                </View>

                <List.Section>
                    <List.Item
                        title="Modo Escuro"
                        description="Alternar entre tema claro e escuro"
                        left={props => <List.Icon {...props} icon={isDarkMode ? "weather-night" : "weather-sunny"} />}
                        right={() => (
                            <Switch value={isDarkMode} onValueChange={toggleTheme} color={theme.colors.primary} />
                        )}
                        style={styles.listItem}
                    />
                </List.Section>

                <Divider style={styles.divider} />

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Integrações</Text>
                </View>

                <List.Section>
                    <List.Item
                        title="Vincular WhatsApp"
                        description="Gerar chave para o bot do WhatsApp"
                        left={props => <List.Icon {...props} icon="whatsapp" />}
                        onPress={handleGenerateKey}
                        right={props => <List.Icon {...props} icon="chevron-right" />}
                        style={styles.listItem}
                    />
                </List.Section>

                <Divider style={styles.divider} />

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Conta</Text>
                </View>

                <List.Section>
                    <View style={styles.userInfo}>
                        <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primaryContainer }]}>
                            <Text style={{ ...typography.h3, color: theme.colors.onPrimaryContainer }}>
                                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </Text>
                        </View>
                        <View>
                            <Text style={{ ...typography.body, fontWeight: 'bold', color: theme.colors.onSurface }}>{user?.name || 'Usuário'}</Text>
                            <Text style={{ ...typography.caption, color: theme.colors.onSurfaceVariant }}>{user?.email || 'email@exemplo.com'}</Text>
                        </View>
                    </View>

                    <Button
                        mode="outlined"
                        onPress={logout}
                        icon="logout"
                        textColor={theme.colors.error}
                        style={styles.logoutButton}
                    >
                        Sair da Conta
                    </Button>
                </List.Section>


                <View style={styles.footer}>
                    <Text style={styles.versionText}>Versão 1.0.0</Text>
                </View>

            </ScrollView>

            <Portal>
                <Modal visible={integrationModalVisible} onDismiss={() => setIntegrationModalVisible(false)} contentContainerStyle={styles.modalContent}>
                    <Text style={styles.modalTitle}>Integração WhatsApp</Text>
                    <Text style={styles.modalDescription}>
                        Use a chave abaixo para vincular seu WhatsApp ao FinanceMobile. Envie esta chave para o nosso bot no WhatsApp.
                    </Text>

                    <View style={styles.keyContainer}>
                        <Text style={styles.keyValue}>
                            {integrationKey}
                        </Text>
                        <Text style={styles.keyExpiration}>
                            Expira em 10 minutos
                        </Text>
                    </View>

                    <Button mode="contained" onPress={copyToClipboard} icon="content-copy" style={{ marginBottom: 10 }}>
                        Copiar Chave
                    </Button>

                    <Button mode="outlined" onPress={() => setIntegrationModalVisible(false)}>
                        Fechar
                    </Button>
                </Modal>
            </Portal>
        </View>
    );
};

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        paddingBottom: spacing.xl,
    },
    sectionHeader: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.lg,
        paddingBottom: spacing.xs,
    },
    sectionTitle: {
        ...typography.label,
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
    listItem: {
        paddingVertical: 8,
    },
    divider: {
        backgroundColor: theme.colors.outlineVariant,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        gap: spacing.md,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutButton: {
        margin: spacing.md,
        borderColor: theme.colors.error,
    },
    footer: {
        alignItems: 'center',
        padding: spacing.md,
        marginTop: spacing.md,
    },
    versionText: {
        ...typography.caption,
        color: theme.colors.onSurfaceVariant,
    },
    modalContent: {
        backgroundColor: theme.colors.surface,
        padding: 24,
        margin: 20,
        borderRadius: 16,
    },
    modalTitle: {
        ...typography.h3,
        color: theme.colors.onSurface,
        marginBottom: 10,
        textAlign: 'center',
    },
    modalDescription: {
        ...typography.body,
        color: theme.colors.onSurfaceVariant,
        marginBottom: 20,
        textAlign: 'center',
    },
    keyContainer: {
        backgroundColor: theme.colors.surfaceVariant,
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 24,
    },
    keyValue: {
        ...typography.h1,
        color: theme.colors.primary,
        letterSpacing: 4,
        textAlign: 'center',
    },
    keyExpiration: {
        ...typography.caption,
        color: theme.colors.onSurfaceVariant,
        marginTop: 8,
    },
});
