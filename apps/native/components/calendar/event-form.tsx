import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useThemeColor } from 'heroui-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orpc } from '@/utils/orpc';

interface EventFormProps {
  visible: boolean;
  onClose: () => void;
  event?: any; // For editing existing events
  date?: Date; // Pre-selected date
}

interface EventFormData {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  location: string;
  allDay: boolean;
}

export default function EventForm({ visible, onClose, event, date }: EventFormProps) {
  const themeColorBackground = useThemeColor('background');
  const themeColorForeground = useThemeColor('foreground');
  const themeColorPrimary = useThemeColor('foreground');
  const themeColorSurface = useThemeColor('surface');

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    startTime: date || new Date(),
    endTime: date || new Date(),
    location: '',
    allDay: false,
  });

  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const queryClient = useQueryClient();

  // Initialize form data when event prop changes
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        startTime: new Date(event.startTime),
        endTime: new Date(event.endTime),
        location: event.location || '',
        allDay: event.allDay || false,
      });
    } else if (date) {
      setFormData(prev => ({
        ...prev,
        startTime: date,
        endTime: new Date(date.getTime() + 60 * 60 * 1000), // +1 hour
      }));
    }
  }, [event, date]);

  const createEventMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      const result = await orpc.calendar.createEvent.call({
        title: data.title,
        description: data.description,
        startTime: data.startTime.toISOString(),
        endTime: data.endTime.toISOString(),
        location: data.location,
        allDay: data.allDay,
      });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      Alert.alert('Success', 'Event created successfully');
      onClose();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to create event');
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async (data: { id: string; eventData: EventFormData }) => {
      const result = await orpc.calendar.updateEvent.call({
        id: data.id,
        title: data.eventData.title,
        description: data.eventData.description,
        startTime: data.eventData.startTime.toISOString(),
        endTime: data.eventData.endTime.toISOString(),
        location: data.eventData.location,
        allDay: data.eventData.allDay,
      });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      Alert.alert('Success', 'Event updated successfully');
      onClose();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update event');
    },
  });

  const handleSubmit = () => {
    // Validation
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    if (event) {
      updateEventMutation.mutate({ id: event.id, eventData: formData });
    } else {
      createEventMutation.mutate(formData);
    }
  };

  const handleStartTimeChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setFormData(prev => ({ ...prev, startTime: selectedDate }));
    }
    setShowStartTimePicker(false);
  };

  const handleEndTimeChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setFormData(prev => ({ ...prev, endTime: selectedDate }));
    }
    setShowEndTimePicker(false);
  };

  const isLoading = createEventMutation.isPending || updateEventMutation.isPending;

  if (!visible) return null;

  return (
    <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
      <View style={[styles.container, { backgroundColor: themeColorBackground }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: themeColorSurface }]}>
          <Text style={[styles.headerTitle, { color: themeColorForeground }]}>
            {event ? 'Edit Event' : 'New Event'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={themeColorForeground} />
          </TouchableOpacity>
        </View>

        {/* Form */}
        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {/* Title */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: themeColorForeground }]}>Title *</Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: themeColorSurface,
                  color: themeColorForeground,
                  borderColor: themeColorForeground
                }
              ]}
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              placeholder="Event title"
              placeholderTextColor="#999"
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: themeColorForeground }]}>Description</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { 
                  backgroundColor: themeColorSurface,
                  color: themeColorForeground,
                  borderColor: themeColorForeground
                }
              ]}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Event description (optional)"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Location */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: themeColorForeground }]}>Location</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="location" size={20} color={themeColorForeground} style={styles.inputIcon} />
              <TextInput
                style={[
                  styles.input,
                  styles.inputWithIconText,
                  { 
                    backgroundColor: themeColorSurface,
                    color: themeColorForeground,
                    borderColor: themeColorForeground
                  }
                ]}
                value={formData.location}
                onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                placeholder="Add location"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* All Day Switch */}
          <View style={[styles.field, styles.switchField]}>
            <Text style={[styles.label, { color: themeColorForeground }]}>All Day</Text>
            <Switch
              value={formData.allDay}
              onValueChange={(value) => setFormData(prev => ({ ...prev, allDay: value }))}
              trackColor={{ false: themeColorSurface, true: themeColorPrimary }}
              thumbColor={themeColorForeground}
            />
          </View>

          {/* Time Pickers */}
          {!formData.allDay && (
            <>
              <View style={styles.field}>
                <Text style={[styles.label, { color: themeColorForeground }]}>Start Time</Text>
                <TouchableOpacity
                  style={[
                    styles.timeInput,
                    { 
                      backgroundColor: themeColorSurface,
                      borderColor: themeColorForeground
                    }
                  ]}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <Text style={{ color: themeColorForeground }}>
                    {formData.startTime.toLocaleString()}
                  </Text>
                  <Ionicons name="time" size={20} color={themeColorForeground} />
                </TouchableOpacity>
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: themeColorForeground }]}>End Time</Text>
                <TouchableOpacity
                  style={[
                    styles.timeInput,
                    { 
                      backgroundColor: themeColorSurface,
                      borderColor: themeColorForeground
                    }
                  ]}
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <Text style={{ color: themeColorForeground }}>
                    {formData.endTime.toLocaleString()}
                  </Text>
                  <Ionicons name="time" size={20} color={themeColorForeground} />
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.saveButton,
                { backgroundColor: themeColorPrimary, opacity: isLoading ? 0.6 : 1 }
              ]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? 'Saving...' : (event ? 'Update' : 'Create')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Date Time Pickers */}
        {showStartTimePicker && (
          <DateTimePicker
            value={formData.startTime}
            mode="datetime"
            display="default"
            onChange={handleStartTimeChange}
            minimumDate={new Date()}
          />
        )}

        {showEndTimePicker && (
          <DateTimePicker
            value={formData.endTime}
            mode="datetime"
            display="default"
            onChange={handleEndTimeChange}
            minimumDate={formData.startTime}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  form: {
    padding: 16,
  },
  field: {
    marginBottom: 20,
  },
  switchField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputWithIconText: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 0,
  },
  timeInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});