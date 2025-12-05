import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from 'heroui-native';

interface GoalCardProps {
    title: string;
    category: string;
    progress: number; // 0 to 100
    status: 'on-track' | 'behind' | 'at-risk';
    onPress?: () => void;
}

export default function GoalCard({ title, category, progress, status, onPress }: GoalCardProps) {
    const themeColorSurface = useThemeColor('surface');
    const themeColorForeground = useThemeColor('foreground');

    const getStatusColor = () => {
        switch (status) {
            case 'on-track': return '#48BB78'; // Green
            case 'behind': return '#ED8936'; // Orange
            case 'at-risk': return '#F56565'; // Red
            default: return '#A0AEC0';
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'on-track': return 'On Track';
            case 'behind': return 'Behind';
            case 'at-risk': return 'At Risk';
            default: return 'Unknown';
        }
    };

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: themeColorSurface }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Ionicons name="trophy-outline" size={20} color={themeColorForeground} />
                </View>
                <View style={styles.badgeContainer}>
                    <View style={[styles.badgeDot, { backgroundColor: getStatusColor() }]} />
                    <Text style={[styles.badgeText, { color: getStatusColor() }]}>{getStatusText()}</Text>
                </View>
            </View>

            <Text style={[styles.title, { color: themeColorForeground }]}>{title}</Text>
            <Text style={styles.category}>{category}</Text>

            <View style={styles.progressContainer}>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: getStatusColor() }]} />
                </View>
                <Text style={styles.progressText}>{progress}%</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.03)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    category: {
        fontSize: 14,
        color: '#A0AEC0',
        marginBottom: 16,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    progressBarBg: {
        flex: 1,
        height: 6,
        backgroundColor: '#EDF2F7',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#718096',
        width: 32,
        textAlign: 'right',
    },
});
