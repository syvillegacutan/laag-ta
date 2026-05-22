import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  FlatList,
  Linking,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../constants/colors';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

interface Place {
  id: string;
  name: string;
  type: string;
  rating: number | null;
  ratingCount: number;
  vicinity: string;
  lat: number;
  lng: number;
  openNow?: boolean;
}

interface Category {
  key: string;
  label: string;
  icon: string;
  type: string;
}

const CATEGORIES: Category[] = [
  { key: 'restaurant', label: 'Food', icon: '🍽️', type: 'restaurant' },
  { key: 'lodging', label: 'Hotels', icon: '🏨', type: 'lodging' },
  { key: 'hospital', label: 'Medical', icon: '🏥', type: 'hospital' },
  { key: 'convenience_store', label: 'Store', icon: '🏪', type: 'convenience_store' },
  { key: 'atm', label: 'ATM', icon: '💳', type: 'atm' },
  { key: 'tourist_attraction', label: 'Sights', icon: '🗺️', type: 'tourist_attraction' },
  { key: 'cafe', label: 'Cafe', icon: '☕', type: 'cafe' },
  { key: 'pharmacy', label: 'Pharmacy', icon: '💊', type: 'pharmacy' },
];

export default function NearbyScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setPermissionStatus(status);
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation(loc);
    }
  }, []);

  useEffect(() => {
    if (location) fetchNearby(selectedCategory);
  }, [location, selectedCategory]);

  const fetchNearby = useCallback(async (cat: Category) => {
    if (!location) return;
    setLoading(true);
    setPlaces([]);
    try {
      const response = await fetch(`${API_URL}/api/nearby`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          type: cat.type,
          radius: 1500,
        }),
      });
      if (!response.ok) throw new Error('Server error');
      const data = await response.json();
      setPlaces(data.places ?? []);
      if (data.places?.length > 0) {
        mapRef.current?.fitToCoordinates(
          data.places.map((p: Place) => ({ latitude: p.lat, longitude: p.lng })),
          { edgePadding: { top: 40, right: 40, bottom: 40, left: 40 }, animated: true }
        );
      }
    } catch {
      Alert.alert('Could not load places', 'Make sure your backend is running and has a valid Google Places API key.');
    } finally {
      setLoading(false);
    }
  }, [location]);

  const openDirections = (place: Place) => {
    const label = encodeURIComponent(place.name);
    const url = Platform.select({
      ios: `maps://?q=${label}&ll=${place.lat},${place.lng}`,
      android: `geo:${place.lat},${place.lng}?q=${place.lat},${place.lng}(${label})`,
      default: `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`,
    });
    Linking.openURL(url!).catch(() =>
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`)
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const focusPlace = (place: Place) => {
    setSelectedPlace(place);
    mapRef.current?.animateToRegion({
      latitude: place.lat,
      longitude: place.lng,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    }, 500);
    Haptics.selectionAsync();
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    return (
      <View style={styles.starsRow}>
        <Ionicons name="star" size={12} color="#F59E0B" />
        <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
      </View>
    );
  };

  if (permissionStatus === 'denied') {
    return (
      <View style={styles.centered}>
        <Ionicons name="location-off" size={64} color={COLORS.textMuted} />
        <Text style={styles.permissionTitle}>Location Access Needed</Text>
        <Text style={styles.permissionText}>
          Laag Ta! needs your location to find nearby places. Please enable it in your device settings.
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={requestLocation}>
          <Text style={styles.retryBtnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation
          showsMyLocationButton
        >
          {places.map(place => (
            <Marker
              key={place.id}
              coordinate={{ latitude: place.lat, longitude: place.lng }}
              title={place.name}
              description={place.vicinity}
              pinColor={selectedPlace?.id === place.id ? COLORS.primaryDark : COLORS.primary}
              onPress={() => setSelectedPlace(place)}
            />
          ))}
        </MapView>
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
        contentContainerStyle={styles.catContent}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.catChip, selectedCategory.key === cat.key && styles.catChipActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={styles.catChipIcon}>{cat.icon}</Text>
            <Text style={[styles.catChipText, selectedCategory.key === cat.key && styles.catChipTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Places list */}
      {loading ? (
        <View style={styles.listLoading}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.loadingText}>Finding nearby {selectedCategory.label.toLowerCase()}...</Text>
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>{selectedCategory.icon}</Text>
              <Text style={styles.emptyText}>No {selectedCategory.label.toLowerCase()} found nearby.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.placeCard, selectedPlace?.id === item.id && styles.placeCardSelected]}
              onPress={() => focusPlace(item)}
              activeOpacity={0.85}
            >
              <View style={styles.placeIconBox}>
                <Text style={styles.placeIcon}>{selectedCategory.icon}</Text>
              </View>
              <View style={styles.placeInfo}>
                <Text style={styles.placeName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.placeType}>{item.type.replace(/_/g, ' ')}</Text>
                <View style={styles.placeMeta}>
                  {renderStars(item.rating)}
                  {item.ratingCount > 0 && (
                    <Text style={styles.ratingCount}>({item.ratingCount})</Text>
                  )}
                  {item.openNow !== undefined && (
                    <Text style={[styles.openStatus, item.openNow ? styles.openNow : styles.closedNow]}>
                      {item.openNow ? 'Open' : 'Closed'}
                    </Text>
                  )}
                </View>
                <Text style={styles.placeVicinity} numberOfLines={1}>{item.vicinity}</Text>
              </View>
              <TouchableOpacity style={styles.directionsBtn} onPress={() => openDirections(item)}>
                <Ionicons name="navigate" size={16} color={COLORS.primary} />
                <Text style={styles.directionsBtnText}>Go</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  mapContainer: { height: 240 },
  map: { flex: 1 },
  catScroll: { maxHeight: 56, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  catContent: { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catChipIcon: { fontSize: 13 },
  catChipText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  catChipTextActive: { color: '#fff' },
  listContent: { padding: 12, gap: 10, paddingBottom: 30 },
  placeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  placeCardSelected: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  placeIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeIcon: { fontSize: 22 },
  placeInfo: { flex: 1, gap: 2 },
  placeName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  placeType: { fontSize: 12, color: COLORS.textSecondary, textTransform: 'capitalize' },
  placeMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  ratingCount: { fontSize: 11, color: COLORS.textMuted },
  openStatus: { fontSize: 11, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  openNow: { backgroundColor: COLORS.successBg, color: COLORS.success },
  closedNow: { backgroundColor: COLORS.errorBg, color: COLORS.error },
  placeVicinity: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  directionsBtn: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.primaryBg,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  directionsBtnText: { fontSize: 10, fontWeight: '700', color: COLORS.primary },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  permissionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  permissionText: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  loadingText: { fontSize: 15, color: COLORS.textSecondary, marginTop: 12 },
  listLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 15, color: COLORS.textMuted, textAlign: 'center' },
});
