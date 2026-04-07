import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Modal, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';

// Import Custom Hooks
import { 
  useNotificationSettings, 
  usePrayerSection, 
  useReminderForm, 
  useGeneralToggle 
} from './logic'; 

// Import Animations
import { AppAnimations } from './animation';

// Enable smooth animations for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function NotificationsView() {
  const logic = useNotificationSettings();

  if (!logic.dbSettings) return null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* --- SECTION: GENERAL --- */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>General</Text>
          <GeneralToggle label="Enable All Notifications" />
          <GeneralToggle label="Silent Mode (Vibrate Only)" />
        </View>

        {/* --- SECTION: PRAYERS --- */}
        <PrayerSection name="Fajr" initialValue={logic.dbSettings.fajrConfig} activeMosque={logic.dbSettings.activeMosque} />
        <PrayerSection name="Sunrise" initialValue={logic.dbSettings.sunriseConfig} activeMosque={logic.dbSettings.activeMosque} isSunrise />
        <PrayerSection name="Dhuhr" initialValue={logic.dbSettings.dhuhrConfig} activeMosque={logic.dbSettings.activeMosque} />
        <PrayerSection name="Asr" initialValue={logic.dbSettings.asrConfig} activeMosque={logic.dbSettings.activeMosque} />
        <PrayerSection name="Maghrib" initialValue={logic.dbSettings.maghribConfig} activeMosque={logic.dbSettings.activeMosque} />
        <PrayerSection name="Isha" initialValue={logic.dbSettings.ishaConfig} activeMosque={logic.dbSettings.activeMosque} />

        {/* Bottom Padding */}
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

// ==========================================
// PRAYER SECTION COMPONENT
// ==========================================
function PrayerSection({ name, initialValue, isSunrise, activeMosque }: { name: string, initialValue: string, isSunrise?: boolean, activeMosque: string }) {
  const logic = usePrayerSection(name, initialValue, activeMosque);

  const getIconName = () => logic.notifyState === 2 ? "notifications" : logic.notifyState === 1 ? "phone-portrait" : "notifications-off";
  const getStatusText = () => logic.notifyState === 2 ? "Sound" : logic.notifyState === 1 ? "Vib." : "Off";

  return (
    <Animated.View style={styles.section} layout={AppAnimations.accordionLayout}>
      
      <TouchableOpacity style={styles.prayerHeaderRow} activeOpacity={0.7} onPress={logic.toggleExpand}>
        <Text style={styles.prayerHeader}>{name}</Text>
        <View style={styles.headerControls}>
            <TouchableOpacity style={styles.iconButton} onPress={(e) => { e.stopPropagation(); logic.cycleState(); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.statusText}>{getStatusText()}</Text>
              <Ionicons name={getIconName() as any} size={20} color={logic.notifyState === 0 ? "gray" : "#4db6ac"} />
            </TouchableOpacity>
            <Ionicons name={logic.expanded ? "chevron-up" : "chevron-down"} size={20} color="#4db6ac" />
        </View>
      </TouchableOpacity>

      {logic.expanded && (
        <Animated.View style={styles.expandedContent} entering={AppAnimations.contentFadeIn} exiting={AppAnimations.contentFadeOut}>
          
          {logic.reminders.length > 0 && (
              <View style={styles.reminderList}>
                {logic.reminders.map((r) => (
                  <TouchableOpacity key={r.id} style={styles.reminderChip} onPress={() => logic.openEditReminder(r)}>
                    <Ionicons name="time-outline" size={14} color="#ccc" />
                    <Text style={styles.reminderText}>{r.time} min {r.type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
          )}

          <TouchableOpacity style={styles.addButton} onPress={logic.openAddReminder}>
            <Ionicons name="add-circle-outline" size={22} color="#4db6ac" />
            <Text style={styles.addButtonText}>Add Reminder</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <ReminderModal 
        visible={logic.modalVisible} 
        onClose={() => logic.setModalVisible(false)} 
        onSave={logic.saveReminder}
        onDelete={logic.deleteReminder}
        prayerName={name}
        activeMosque={activeMosque}
        initialData={logic.editingReminder}
      />
    </Animated.View>
  );
}

// ==========================================
// REMINDER MODAL COMPONENT
// ==========================================
function ReminderModal({ visible, onClose, onSave, onDelete, prayerName, activeMosque, initialData }: any) {
  const form = useReminderForm(visible, initialData, prayerName, activeMosque);

  // Define edge limits for UI disabling
  const isAtMin = form.minutes <= 10;
  const isAtMax = form.minutes >= form.maxLimit;

  return (
    <Modal transparent={true} visible={visible} animationType="none">
      <View style={styles.modalOverlay}>
        {form.showContent && (
          <>
            <Animated.View style={StyleSheet.absoluteFillObject} entering={AppAnimations.backdropFadeIn} exiting={AppAnimations.backdropFadeOut}>
              <TouchableOpacity style={styles.backdropTouchable} onPress={() => form.closeWithAnimation(onClose)} />
            </Animated.View>

            <Animated.View style={styles.modalContent} entering={AppAnimations.modalSlideUp} exiting={AppAnimations.modalSlideDown}>
              
              <Text style={styles.modalTitle}>{initialData ? `Edit ${prayerName}` : `Remind me for ${prayerName}`}</Text>

              <View style={styles.sliderContainer}>
                {/* ➖ MINUS BUTTON */}
                <TouchableOpacity 
                  onPress={form.decreaseMinutes} 
                  style={[styles.stepperBtn, isAtMin && styles.stepperBtnDisabled]}
                  disabled={isAtMin}
                >
                  <Ionicons name="remove" size={24} color={isAtMin ? "#888888" : "white"} />
                </TouchableOpacity>

                <View style={styles.valueBox}>
                  <Text style={styles.valueText}>{form.minutes}</Text>
                  <Text style={styles.unitText}>min</Text>
                </View>

                {/* ➕ PLUS BUTTON */}
                <TouchableOpacity 
                  onPress={form.increaseMinutes} 
                  style={[styles.stepperBtn, isAtMax && styles.stepperBtnDisabled]}
                  disabled={isAtMax}
                >
                  <Ionicons name="add" size={24} color={isAtMax ? "#888888" : "white"} />
                </TouchableOpacity>
              </View>

              <View style={styles.toggleContainer}>
                <TouchableOpacity style={[styles.typeBtn, form.type === 'Before' && styles.typeBtnActive]} onPress={() => form.setType('Before')}><Text style={[styles.typeText, form.type === 'Before' && styles.typeTextActive]}>Before</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.typeBtn, form.type === 'After' && styles.typeBtnActive]} onPress={() => form.setType('After')}><Text style={[styles.typeText, form.type === 'After' && styles.typeTextActive]}>After</Text></TouchableOpacity>
              </View>

              <View style={styles.modalButtons}>
                {initialData ? (
                  <TouchableOpacity style={styles.deleteButton} onPress={() => form.closeWithAnimation(onDelete)}><Text style={styles.deleteText}>Delete</Text></TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.cancelButton} onPress={() => form.closeWithAnimation(onClose)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
                )}
                <TouchableOpacity style={styles.saveButton} onPress={() => form.closeWithAnimation(() => onSave(form.minutes, form.type))}><Text style={styles.saveText}>{initialData ? "Update" : "Save"}</Text></TouchableOpacity>
              </View>

            </Animated.View>
          </>
        )}
      </View>
    </Modal>
  );
}

// ==========================================
// GENERAL TOGGLE COMPONENT
// ==========================================
function GeneralToggle({ label }: { label: string }) {
  const logic = useGeneralToggle();
  return (
    <TouchableOpacity style={styles.row} onPress={logic.toggle}>
      <Text style={styles.label}>{label}</Text>
      <Ionicons name={logic.isOn ? "checkbox" : "square-outline"} size={24} color={logic.isOn ? "#4db6ac" : "gray"} />
    </TouchableOpacity>
  );
}

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#003437' },
  scrollContent: { padding: 20, paddingTop: 10 },
  section: { marginBottom: 15, backgroundColor: 'rgba(0, 94, 91, 0.4)', borderRadius: 15, padding: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', color: '#4db6ac', marginBottom: 15, textTransform: 'uppercase' },
  prayerHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 45, paddingVertical: 5 },
  prayerHeader: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  headerControls: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.2)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  statusText: { color: '#ccc', fontSize: 11 },
  expandedContent: { marginTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 15 },
  addButton: { flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 10, width: '100%', paddingVertical: 12 },
  addButtonText: { color: '#4db6ac', fontWeight: '600', fontSize: 15 },
  reminderList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 },
  reminderChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#004d40', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, gap: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  reminderText: { color: '#e0e0e0', fontSize: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  label: { fontSize: 16, color: '#e0e0e0' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  backdropTouchable: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: { backgroundColor: '#004d40', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, paddingBottom: 40, width: '100%', elevation: 20 },
  modalTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
  sliderContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, marginBottom: 30 },
  stepperBtn: { backgroundColor: '#00695c', padding: 12, borderRadius: 12 },
  valueBox: { alignItems: 'center', minWidth: 70 },
  valueText: { color: 'white', fontSize: 36, fontWeight: 'bold' },
  unitText: { color: '#80cbc4', fontSize: 14, marginTop: -5 },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#003437', borderRadius: 12, padding: 5, marginBottom: 30 },
  typeBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  typeBtnActive: { backgroundColor: '#00695c' },
  typeText: { color: 'gray', fontWeight: '600' },
  typeTextActive: { color: 'white', fontWeight: 'bold' },
  modalButtons: { flexDirection: 'row', gap: 15 },
  cancelButton: { flex: 1, padding: 16, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#ccc' },
  cancelText: { color: '#ccc', fontWeight: 'bold', fontSize: 16 },
  deleteButton: { flex: 1, padding: 16, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#ff5252', backgroundColor: 'rgba(255, 82, 82, 0.1)' },
  deleteText: { color: '#ff5252', fontWeight: 'bold', fontSize: 16 },
  saveButton: { flex: 1, backgroundColor: '#4db6ac', padding: 16, alignItems: 'center', borderRadius: 12 },
  saveText: { color: '#003437', fontWeight: 'bold', fontSize: 16 },
  stepperBtnDisabled: { backgroundColor: '#263238', elevation: 0, shadowOpacity: 0 }, 
});