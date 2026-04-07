import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import Logic & Component
import SortFilterView, { useMosqueData, COLORS, Mosque } from './SortFilterView';
import { getMosqueList, updateMosqueFavs } from '../../../services/database';

// Import the Animation Wrapper
import MosqueMenuAnimator from './animation';

// --- SUB-COMPONENTS (Kept local as they are specific to this view) ---

const TabSelector = ({ activeTab, onSelect }: any) => (
  <View style={styles.tabContainer}>
    {(['All', 'Favourites']).map((tab: any) => (
      <TouchableOpacity 
        key={tab} 
        style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]} 
        onPress={() => onSelect(tab)}
      >
        <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

const MosqueRow = ({ item, isSelected, onSelect, onFav }: any) => (
  <View style={styles.rowContainer}>
    <TouchableOpacity style={styles.nameArea} onPress={() => onSelect(item.name)}>
      <Text style={[styles.menuItemText, isSelected && styles.selectedText]} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.detailText}>{item.city} • {item.sect || "General"}</Text>
    </TouchableOpacity>

    <View style={styles.actionsArea}>
      <TouchableOpacity 
        style={[styles.iconBtn, { marginRight: 15 }]} 
        onPress={() => onFav(item.id)}
      >
        <Ionicons 
            name={item.isFav ? "heart" : "heart-outline"} 
            size={22} 
            color={item.isFav ? COLORS.danger : COLORS.textHighlight} 
        />
      </TouchableOpacity>
    </View>
  </View>
);

const ManualCalculationLink = ({ onSelect }: { onSelect: () => void }) => (
  <TouchableOpacity style={styles.manualLinkBtn} onPress={onSelect}>
    <Text style={styles.manualLinkText}>
      Can't find your mosque?{'\n'} 
      <Text style={styles.manualLinkHighlight}>Calculate prayers manually</Text>
    </Text>
  </TouchableOpacity>
);

// --- MAIN COMPONENT ---

interface MosqueMenuOverlayProps {
  selectedMosque: string;
  startY: number;
  onClose: () => void;
  onSelect: (mosque: string) => void;
}

export default function MosqueMenuOverlay({ selectedMosque, startY, onClose, onSelect }: MosqueMenuOverlayProps) {
    const [showFilters, setShowFilters] = useState(false);
    const [selectedName, setSelectedName] = useState(selectedMosque);
    
    // 1. STATE: Database Data
    const [dbMosques, setDbMosques] = useState<Mosque[]>([]);

    // 2. EFFECT: Load data from DB on mount
    useEffect(() => {
        const loadMosques = async () => {
            try {
                console.log("mosqueMenu:  📥 UI asking for mosques...");
                const data =  getMosqueList();
                console.log(`mosqueMenu:  📊 UI received ${data.length} mosques.`);
                
                if (data.length > 0) {
                    setDbMosques(data);
                }
            } catch (error) {
                console.error("mosqueMenu:  ❌ Error loading mosques:", error);
            }
        };

        loadMosques();
        const timer = setTimeout(loadMosques, 2000);
        return () => clearTimeout(timer);
    }, []);

    // 3. LOGIC HOOK
    const logic = useMosqueData(dbMosques);

    // --- Handle Fav Toggle ---
    const handleFavToggle = (id: string) => {
        logic.toggleFav(id);
        const mosque = logic.processedData.find(m => m.id === id);
        if (mosque) {
            const newStatus = !mosque.isFav; 
            updateMosqueFavs(mosque.name, newStatus);
        }
    };

    return (
        <MosqueMenuAnimator startY={startY} onClose={onClose}>
            {({ animateAndSelect }) => (
                // This inner function receives the animation triggers
                // 'animateAndSelect' will run the exit animation then fire the callback
                <>
                    {/* KEY FIX: key={dbMosques.length} forces update when data arrives */}
                    <View style={{ flex: 1 }} key={dbMosques.length}>
                        
                        {showFilters ? (
                            <SortFilterView 
                                visible={showFilters} 
                                onClose={() => setShowFilters(false)} 
                                logic={logic} 
                            />
                        ) : (
                            <>
                                {/* TOOLBAR */}
                                <View style={styles.toolBar}>
                                    <View style={styles.searchWrapper}>
                                        <Ionicons name="search" size={18} color="rgba(255,255,255,0.5)" style={{ marginRight: 5 }} />
                                        <TextInput 
                                            style={styles.searchInput}
                                            placeholder="Search..."
                                            placeholderTextColor="rgba(255,255,255,0.3)"
                                            value={logic.searchQuery}
                                            onChangeText={logic.setSearchQuery}
                                        />
                                    </View>
                                    <TouchableOpacity 
                                        style={[styles.toolBtn, logic.activeFilterCount > 0 && styles.toolBtnActive]} 
                                        onPress={() => setShowFilters(true)}
                                    >
                                        <Ionicons name="options" size={20} color={logic.activeFilterCount > 0 ? "white" : COLORS.textHighlight} />
                                        {logic.activeFilterCount > 0 && <View style={styles.filterDot} />}
                                    </TouchableOpacity>
                                </View>

                                {/* TABS */}
                                <TabSelector activeTab={logic.activeTab} onSelect={logic.setActiveTab} />
                                
                                {/* LIST */}
                                <View style={{ flex: 1 }}>
                                    <FlatList
                                        data={logic.processedData}
                                        keyExtractor={(item) => item.id.toString()} 
                                        indicatorStyle="white"
                                        contentContainerStyle={{ paddingBottom: 20 }}
                                        ListEmptyComponent={
                                            <Text style={styles.emptyText}>
                                                {dbMosques.length === 0 
                                                    ? "Loading Mosques..." 
                                                    : "No mosques found matching your search."
                                                }
                                            </Text>
                                        }
                                        renderItem={({ item }) => (
                                            <MosqueRow 
                                                item={item} 
                                                isSelected={selectedName === item.name} 
                                                onSelect={(name: string) => {
                                                    setSelectedName(name);
                                                    // Trigger animation, then call parent onSelect
                                                    animateAndSelect(() => onSelect(name));
                                                }}
                                                onFav={() => handleFavToggle(item.id)}
                                            />
                                        )}
                                    />
                                </View>

                                {/* FOOTER */}
                                <View style={styles.footerContainer}>
                                    <ManualCalculationLink 
                                        onSelect={() => {
                                            setSelectedName("Manual Calculations");
                                            animateAndSelect(() => onSelect("Manual Calculations"));
                                        }} 
                                    />
                                </View>
                            </>
                        )}
                    </View>
                </>
            )}
        </MosqueMenuAnimator>
    );
}

const styles = StyleSheet.create({
  toolBar: { flexDirection: 'row', gap: 8, marginTop: 5, marginBottom: 5, height: 40 },
  searchWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.panelBg, borderRadius: 8, paddingHorizontal: 10 },
  searchInput: { flex: 1, color: 'white', fontSize: 14 },
  toolBtn: { width: 40, backgroundColor: COLORS.panelBg, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  toolBtnActive: { backgroundColor: COLORS.accent },
  filterDot: { position: 'absolute', top: 5, right: 5, width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.warning },

  tabContainer: { flexDirection: 'row', marginBottom: 10, justifyContent: 'center', gap: 15 },
  tabBtn: { paddingVertical: 12, paddingHorizontal: 40, alignItems: 'center', justifyContent: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: COLORS.accent },
  tabText: { color: COLORS.textSub, fontWeight: '500', fontSize: 14 },
  tabTextActive: { color: COLORS.accent, fontWeight: 'bold' },

  rowContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  nameArea: { flex: 1, marginRight: 10 },
  detailText: { color: COLORS.textSub, fontSize: 11, marginTop: 2 },
  actionsArea: { flexDirection: 'row', gap: 15 }, 
  iconBtn: { padding: 2 }, 
  menuItemText: { color: COLORS.textMain, fontSize: 16 },
  selectedText: { color: 'white', fontWeight: 'bold' },
  emptyText: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 30, fontStyle: 'italic' },

  footerContainer: { marginTop: 10, gap: 10 }, 
  manualLinkBtn: { paddingVertical: 10, alignItems: 'center', marginBottom: 5 },
  manualLinkText: { color: COLORS.textSub, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  manualLinkHighlight: { color: COLORS.accent, textDecorationLine: 'underline', fontWeight: 'bold' },
});