import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Switch, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useThemeColor } from 'heroui-native';
import { orpc } from '@/utils/orpc';

interface EventFormProps {
  visible: boolean;
  onClose: () => void;
  event?: any;
  date?: Date;
}

interface EventFormData {
  type: 'task' | 'event';
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  location: string;
  allDay: boolean;
  category: 'urgent' | 'running' | 'ongoing' | null;
}

export default function EventForm({ visible, onClose, event, date }: EventFormProps) {
  const [formData, setFormData] = useState<EventFormData>({
    type: 'task',
    title: '',
    description: '',
    startTime: date || new Date(),
    endTime: date ? new Date(date.getTime() + 60 * 60 * 1000) : new Date(),
    location: '',
    allDay: false,
    category: null,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const queryClient = useQueryClient();
  
  const themeColorBackground = useThemeColor('background');
  const themeColorForeground = useThemeColor('foreground');
  const themeColorSurface = useThemeColor('surface');

  useEffect(() => {
    if (event) {
      setFormData({
        type: event.type || 'event',
        title: event.title || '',
        description: event.description || '',
        startTime: new Date(event.startTime),
        endTime: new Date(event.endTime),
        location: event.location || '',
        allDay: event.allDay || false,
        category: event.category || null,
      });
    } else if (date) {
      setFormData(prev => ({
        ...prev,
        startTime: date,
        endTime: new Date(date.getTime() + 60 * 60 * 1000),
      }));
    }
  }, [event, date]);

  const createEventMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      // Map local form data to API structure
      // Note: API might not support 'type' or 'category' yet, so we might store them in description or metadata if possible
      // For now, we just send standard fields
      const result = await orpc.calendar.createEvent.call({
        title: data.title,
        description: data.description, // We could append category here if needed
        startTime: data.startTime.toISOString(),
        endTime: data.endTime.toISOString(),
        location: data.location,
        allDay: data.allDay,
      });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      onClose();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to create event');
    },
  });

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    createEventMutation.mutate(formData);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      // Update both start and end time date part, keep time part
      const newStart = new Date(formData.startTime);
      newStart.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

      const newEnd = new Date(formData.endTime);
      newEnd.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

      setFormData(prev => ({ ...prev, startTime: newStart, endTime: newEnd }));
    }
  };

  const handleStartTimeChange = (event: any, selectedDate?: Date) => {
    setShowStartTimePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, startTime: selectedDate }));
    }
  };

  const handleEndTimeChange = (event: any, selectedDate?: Date) => {
    setShowEndTimePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, endTime: selectedDate }));
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: themeColorSurface }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={themeColorForeground} />
            </TouchableOpacity>
            <View style={styles.headerIcons}>
              <TouchableOpacity>
                <Ionicons name="search-outline" size={24} color={themeColorForeground} style={{ marginRight: 16 }} />
              </TouchableOpacity>
              <View style={[styles.avatarSmall, { backgroundColor: themeColorForeground }]}>
                <Text style={styles.avatarText}>U</Text>
              </View>
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Type Toggle */}
            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[styles.typeButton, formData.type === 'task' && styles.typeButtonActive]}
                onPress={() => setFormData(prev => ({ ...prev, type: 'task' }))}
              >
                <Text style={[styles.typeText, formData.type === 'task' && styles.typeTextActive]}>Task</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, formData.type === 'event' && styles.typeButtonActive]}
                onPress={() => setFormData(prev => ({ ...prev, type: 'event' }))}
              >
                <Text style={[styles.typeText, formData.type === 'event' && styles.typeTextActive]}>Event</Text>
              </TouchableOpacity>
            </View>

            {/* Title Input */}
            <TextInput
              style={[styles.titleInput, { color: themeColorForeground }]}
              placeholder="Task name"
              placeholderTextColor="#A0AEC0"
              value={formData.title}
              onChangeText={text => setFormData(prev => ({ ...prev, title: text }))}
            />

            {/* All Day Toggle */}
            <View style={styles.row}>
              <Text style={[styles.label, { color: themeColorForeground }]}>All day</Text>
              <Switch
                value={formData.allDay}
                onValueChange={val => setFormData(prev => ({ ...prev, allDay: val }))}
                trackColor={{ false: '#E2E8F0', true: '#FF6B6B' }}
              />
            </View>

            {/* Date Picker */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: themeColorForeground }]}>Date</Text>
              <TouchableOpacity style={[styles.dateInput, { borderBottomColor: themeColorForeground }]} onPress={() => setShowDatePicker(true)}>
                <Text style={[styles.dateText, { color: themeColorForeground }]}>{formatDate(formData.startTime)}</Text>
                <Ionicons name="calendar-outline" size={20} color={themeColorForeground} />
              </TouchableOpacity>
            </View>

            {/* Time Pickers */}
            {!formData.allDay && (
              <View style={styles.timeRow}>
                <View style={styles.timeInputContainer}>
                  <Text style={[styles.label, { color: themeColorForeground }]}>Start time</Text>
                  <TouchableOpacity style={[styles.timeInput, { borderBottomColor: themeColorForeground }]} onPress={() => setShowStartTimePicker(true)}>
                    <Text style={[styles.timeText, { color: themeColorForeground }]}>{formatTime(formData.startTime)}</Text>
                    <Ionicons name="chevron-down" size={16} color={themeColorForeground} />
                  </TouchableOpacity>
                </View>
                <View style={styles.timeInputContainer}>
                  <Text style={[styles.label, { color: themeColorForeground }]}>End time</Text>
                  <TouchableOpacity style={[styles.timeInput, { borderBottomColor: themeColorForeground }]} onPress={() => setShowEndTimePicker(true)}>
                    <Text style={[styles.timeText, { color: themeColorForeground }]}>{formatTime(formData.endTime)}</Text>
                    <Ionicons name="chevron-down" size={16} color={themeColorForeground} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Description */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: themeColorForeground }]}>Description</Text>
              <TextInput
                style={[styles.descriptionInput, { color: themeColorForeground }]}
                placeholder="Add description"
                placeholderTextColor="#A0AEC0"
                multiline
                value={formData.description}
                onChangeText={text => setFormData(prev => ({ ...prev, description: text }))}
              />
            </View>

            {/* Categories */}
            <View style={styles.section}>
              <View style={styles.categoriesRow}>
                <TouchableOpacity
                  style={[styles.categoryChip, { backgroundColor: '#FFF5F5' }, formData.category === 'urgent' && styles.categoryActive]}
                  onPress={() => setFormData(prev => ({ ...prev, category: 'urgent' }))}
                >
                  <Text style={[styles.categoryText, { color: '#FF6B6B' }]}>Urgent</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.categoryChip, { backgroundColor: '#E6FFFA' }, formData.category === 'running' && styles.categoryActive]}
                  onPress={() => setFormData(prev => ({ ...prev, category: 'running' }))}
                >
                  <Text style={[styles.categoryText, { color: '#38B2AC' }]}>Running</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.categoryChip, { backgroundColor: '#E9D8FD' }, formData.category === 'ongoing' && styles.categoryActive]}
                  onPress={() => setFormData(prev => ({ ...prev, category: 'ongoing' }))}
                >
                  <Text style={[styles.categoryText, { color: '#805AD5' }]}>Ongoing</Text>
                  {formData.category === 'ongoing' && (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={10} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.addCategoryButton}>
                  <Ionicons name="add" size={20} color="#718096" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Create Button */}
            <TouchableOpacity style={styles.createButton} onPress={handleSubmit}>
              <Text style={styles.createButtonText}>Create new {formData.type === 'task' ? 'Task' : 'Event'}</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>

          {/* Hidden Date Pickers */}
          {showDatePicker && (
            <DateTimePicker
              value={formData.startTime}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
            />
          )}
          {showStartTimePicker && (
            <DateTimePicker
              value={formData.startTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleStartTimeChange}
            />
          )}
          {showEndTimePicker && (
            <DateTimePicker
              value={formData.endTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleEndTimeChange}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: '90%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  typeToggle: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  typeButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#F7FAFC',
  },
  typeButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  typeText: {
    fontSize: 16,
    color: '#718096',
    fontWeight: '500',
  },
  typeTextActive: {
    color: '#fff',
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  section: {
    marginBottom: 24,
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
    marginBottom: 24,
  },
  timeInputContainer: {
    flex: 1,
  },
  timeInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  descriptionInput: {
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    position: 'relative',
  },
  categoryActive: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  checkBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#805AD5',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  addCategoryButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#CBD5E0',
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  createButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});