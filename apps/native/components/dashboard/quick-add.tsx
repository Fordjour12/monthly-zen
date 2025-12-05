import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from 'heroui-native';

interface QuickAddProps {
    onAdd: (text: string) => Promise<void>;
}

export default function QuickAdd({ onAdd }: QuickAddProps) {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);

    const themeColorSurface = useThemeColor('surface');
    const themeColorForeground = useThemeColor('foreground');
    const themeColorPrimary = '#FF6B6B';

    const handleAdd = async () => {
        if (!text.trim()) return;

        setLoading(true);
        try {
            await onAdd(text);
            setText('');
        } catch (error) {
            console.error('Failed to add task', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: themeColorSurface }]}>
            <View style={styles.inputContainer}>
                <TextInput
                    style={[styles.input, { color: themeColorForeground }]}
                    placeholder="Quick add task (e.g. 'Gym tomorrow at 5pm')"
                    placeholderTextColor="#A0AEC0"
                    value={text}
                    onChangeText={setText}
                    onSubmitEditing={handleAdd}
                />
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: themeColorPrimary }]}
                    onPress={handleAdd}
                    disabled={loading || !text.trim()}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Ionicons name="arrow-up" size={20} color="#fff" />
                    )}
                </TouchableOpacity>
            </View>
            <Text style={styles.hint}>AI will categorize and schedule this automatically</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 8,
        marginRight: 8,
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    hint: {
        fontSize: 12,
        color: '#A0AEC0',
        marginLeft: 4,
    },
});
