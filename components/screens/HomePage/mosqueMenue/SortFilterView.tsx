import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// --- SHARED CONFIGURATION & TYPES ---

export const COLORS = {
  primary: '#004d40',
  accent: '#26a69a',
  textMain: '#e0e0e0',
  textSub: 'rgba(255,255,255,0.5)',
  textHighlight: '#80cbc4',
  danger: '#ff5252',
  warning: '#ffd740',
  backdrop: 'rgba(0,0,0,0.6)',
  panelBg: 'rgba(0,0,0,0.2)',
};

export type TabType = 'All' | 'Favourites';
export type SortType = 'Name' | 'Distance' | 'Capacity';
export type OrderType = 'asc' | 'desc';

export interface Mosque {
  id: string;
  name: string;
  country: string;
  city: string;
  sect: string;
  origin: string;
  lang: string;
  distance: number;
  capacity: number;
  isFav: boolean;
}

// --- LOGIC HOOK (Moved Here) ---

export function useMosqueData(initialData: Mosque[]) {
  const [data, setData] = useState(initialData);
  useEffect(() => {
        setData(initialData);
    }, [initialData]);
    
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sorting & Filtering State
  const [sortBy, setSortBy] = useState<SortType>('Name');
  const [sortOrder, setSortOrder] = useState<OrderType>('asc');
  
  const [filters, setFilters] = useState({
    city: null as string | null,
    sect: null as string | null,
    origin: null as string | null,
    lang: null as string | null,
  });

  // Actions
  const toggleFav = (id: string) => setData(p => p.map(m => m.id === id ? { ...m, isFav: !m.isFav } : m));
  
  const updateFilter = (key: keyof typeof filters, value: string | null) => {
    setFilters(prev => ({ ...prev, [key]: prev[key] === value ? null : value }));
  };

  const resetFilters = () => {
    setFilters({ city: null, sect: null, origin: null, lang: null });
    setSortBy('Name');
    setSortOrder('asc');
  };

  // Derived Data
  const processedData = useMemo(() => {
    let result = data;

    // 1. Tabs
    if (activeTab === 'Favourites') result = result.filter(m => m.isFav);

    // 2. Search
    if (searchQuery) {
      result = result.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // 3. Filters
    if (filters.city) result = result.filter(m => m.city === filters.city);
    if (filters.sect) result = result.filter(m => m.sect === filters.sect);
    if (filters.origin) result = result.filter(m => m.origin === filters.origin);
    if (filters.lang) result = result.filter(m => m.lang === filters.lang);

    // 4. Sort
    return [...result].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'Name') comparison = a.name.localeCompare(b.name);
      else if (sortBy === 'Distance') comparison = a.distance - b.distance;
      else if (sortBy === 'Capacity') comparison = a.capacity - b.capacity;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [data, activeTab, searchQuery, sortBy, sortOrder, filters]);

  // Unique lists for filter chips
  const options = useMemo(() => ({
    city: [...new Set(initialData.map(m => m.city))],
    sect: [...new Set(initialData.map(m => m.sect))],
    origin: [...new Set(initialData.map(m => m.origin))],
    lang: [...new Set(initialData.map(m => m.lang))],
  }), [initialData]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return {
    processedData,
    activeTab, setActiveTab,
    searchQuery, setSearchQuery,
    sortBy, setSortBy,
    sortOrder, setSortOrder,
    filters, updateFilter, resetFilters, activeFilterCount,
    options,
    toggleFav
  };
}

// --- SUB-COMPONENTS (Internal UI) ---

const FilterChip = ({ label, isActive, onPress }: { label: string, isActive: boolean, onPress: () => void }) => (
  <TouchableOpacity 
    style={[styles.chip, isActive && styles.chipActive]}
    onPress={onPress} 
  >
    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const Section = ({ title, data, selected, onSelect }: any) => (
  <>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.chipRow}>
      {data.map((item: string) => (
        <FilterChip key={item} label={item} isActive={selected === item} onPress={() => onSelect(item)} />
      ))}
    </View>
  </>
);

// --- MAIN UI COMPONENT ---

interface SortFilterViewProps {
  visible: boolean;
  onClose: () => void;
  logic: ReturnType<typeof useMosqueData>; // Automatically types the logic prop
}

export default function SortFilterView({ visible, onClose, logic }: SortFilterViewProps) {
  if (!visible) return null;

  return (
    <View style={{ flex: 1 }}>
      {/* HEADER */}
      <View style={styles.filterHeader}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.filterTitle}>Sort & Filter</Text>
        <TouchableOpacity onPress={logic.resetFilters}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* CONTENT */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Sort By</Text>
        <View style={styles.chipRow}>
          {['Name', 'Distance', 'Capacity'].map((s) => (
             <FilterChip 
                key={s} 
                label={s} 
                isActive={logic.sortBy === s} 
                onPress={() => logic.setSortBy(s as SortType)} 
             />
          ))}
        </View>

        <Text style={styles.sectionTitle}>Order</Text>
        <View style={styles.chipRow}>
             <FilterChip label="Ascending" isActive={logic.sortOrder === 'asc'} onPress={() => logic.setSortOrder('asc')} />
             <FilterChip label="Descending" isActive={logic.sortOrder === 'desc'} onPress={() => logic.setSortOrder('desc')} />
        </View>
        
        <View style={styles.divider} />

        <Section title="City" data={logic.options.city} selected={logic.filters.city} onSelect={(v: string) => logic.updateFilter('city', v)} />
        <Section title="Sect" data={logic.options.sect} selected={logic.filters.sect} onSelect={(v: string) => logic.updateFilter('sect', v)} />
        <Section title="Origin" data={logic.options.origin} selected={logic.filters.origin} onSelect={(v: string) => logic.updateFilter('origin', v)} />
        <Section title="Language" data={logic.options.lang} selected={logic.filters.lang} onSelect={(v: string) => logic.updateFilter('lang', v)} />
      </ScrollView>

      {/* APPLY BUTTON */}
      <TouchableOpacity style={styles.applyBtn} onPress={onClose}>
        <Text style={styles.applyBtnText}>Apply ({logic.activeFilterCount} Filters)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  filterTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  resetText: { color: COLORS.danger, fontWeight: '600' },
  sectionTitle: { color: COLORS.textHighlight, fontSize: 12, fontWeight: 'bold', marginTop: 15, marginBottom: 8, textTransform: 'uppercase' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: COLORS.panelBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 5 },
  chipActive: { backgroundColor: COLORS.accent },
  chipText: { color: '#b2dfdb', fontSize: 13 },
  chipTextActive: { color: 'white', fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 15 },
  applyBtn: { backgroundColor: COLORS.accent, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  applyBtnText: { color: 'white', fontWeight: 'bold' },
});