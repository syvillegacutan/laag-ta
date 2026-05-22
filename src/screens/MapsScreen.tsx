import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../constants/colors';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
  const coords: { latitude: number; longitude: number }[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 32);
    lat += (result & 1) !== 0 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 32);
    lng += (result & 1) !== 0 ? ~(result >> 1) : result >> 1;

    coords.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return coords;
}

type TravelMode = 'driving' | 'walking' | 'transit';

const TRAVEL_MODES: {
  mode: TravelMode;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
}[] = [
  { mode: 'driving', icon: 'car',  label: 'Driving' },
  { mode: 'walking', icon: 'walk', label: 'Walking' },
  { mode: 'transit', icon: 'bus',  label: 'Transit' },
];

interface RouteResult {
  polyline: string;
  distance: string;
  duration: string;
  endAddress: string;
}

export default function MapsScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [travelMode, setTravelMode] = useState<TravelMode>('driving');
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setPermissionStatus(status);
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(loc);
    }
  }, []);

  const getRoute = useCallback(async (mode: TravelMode) => {
    if (!location || !destination.trim()) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const response = await fetch(`${API_URL}/api/directions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          },
          destination: destination.trim(),
          mode,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? `Server error ${response.status}`);

      const coords = decodePolyline(data.polyline);
      setRoute(data);
      setRouteCoords(coords);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const allCoords = [
        { latitude: location.coords.latitude, longitude: location.coords.longitude },
        ...coords,
      ];
      mapRef.current?.fitToCoordinates(allCoords, {
        edgePadding: { top: 60, right: 40, bottom: 40, left: 40 },
        animated: true,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Route not found', msg);
    } finally {
      setLoading(false);
    }
  }, [location, destination]);

  const clearRoute = () => {
    setRoute(null);
    setRouteCoords([]);
    setDestination('');
    setTravelMode('driving');
    if (location) {
      mapRef.current?.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 400);
    }
  };

  const handleModeChange = (mode: TravelMode) => {
    setTravelMode(mode);
    if (route) getRoute(mode);
  };

  if (permissionStatus === 'denied') {
    return (
      <View style={styles.centered}>
        <Ionicons name="location-off" size={64} color={COLORS.textMuted} />
        <Text style={styles.permissionTitle}>Location Access Needed</Text>
        <Text style={styles.permissionText}>
          Enable location access in your device settings to use route navigation.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={requestLocation}>
          <Text style={styles.primaryBtnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Getting your location…</Text>
      </View>
    );
  }

  const destCoord = routeCoords.length > 0 ? routeCoords[routeCoords.length - 1] : null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'height' : undefined}
    >
      {/* Top panel */}
      <SafeAreaView style={styles.topPanel}>
        {/* Search row */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Where do you want to go?"
              placeholderTextColor={COLORS.textMuted}
              value={destination}
              onChangeText={setDestination}
              returnKeyType="search"
              onSubmitEditing={() => getRoute(travelMode)}
              autoCorrect={false}
            />
            {destination.length > 0 && (
              <TouchableOpacity onPress={() => setDestination('')}>
                <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.routeBtn,
              (!destination.trim() || loading) && styles.routeBtnDisabled,
            ]}
            onPress={() => getRoute(travelMode)}
            disabled={!destination.trim() || loading}
          >
            {loading && !route ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="navigate" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Travel mode selector + address strip — shown once a route is found */}
        {route && (
          <>
            <View style={styles.modeRow}>
              {TRAVEL_MODES.map(({ mode, icon, label }) => {
                const isActive = travelMode === mode;
                return (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.modeBtn, isActive && styles.modeBtnActive]}
                    onPress={() => handleModeChange(mode)}
                    disabled={loading}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={icon}
                      size={22}
                      color={isActive ? '#fff' : COLORS.textMuted}
                    />
                    {isActive && loading ? (
                      <ActivityIndicator size="small" color="#fff" style={styles.modeSpinner} />
                    ) : isActive ? (
                      <Text style={styles.modeTime}>{route.duration}</Text>
                    ) : null}
                    <Text style={[styles.modeLabel, isActive && styles.modeLabelActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.routeInfo}>
              <Ionicons name="location" size={14} color={COLORS.primary} />
              <Text style={styles.routeInfoAddress} numberOfLines={1}>
                {route.endAddress}
              </Text>
              <Text style={styles.routeInfoDistance}>{route.distance}</Text>
              <TouchableOpacity onPress={clearRoute} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </SafeAreaView>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {routeCoords.length > 0 && (
            <Polyline
              coordinates={routeCoords}
              strokeColor={COLORS.primary}
              strokeWidth={4}
              lineDashPattern={undefined}
            />
          )}
          {destCoord && (
            <Marker
              coordinate={destCoord}
              title={route?.endAddress ?? destination}
              pinColor={COLORS.primary}
            />
          )}
        </MapView>

        {/* My location button */}
        <TouchableOpacity
          style={styles.myLocationBtn}
          onPress={() => {
            mapRef.current?.animateToRegion({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }, 400);
            Haptics.selectionAsync();
          }}
        >
          <Ionicons name="locate" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topPanel: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 0 : 12,
    paddingBottom: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 10,
  },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  myLocationBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text },
  routeBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  routeBtnDisabled: { opacity: 0.5, shadowOpacity: 0, elevation: 0 },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 3,
    minHeight: 74,
  },
  modeBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modeSpinner: { marginVertical: 2 },
  modeTime: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  modeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  modeLabelActive: {
    color: 'rgba(255,255,255,0.85)',
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  routeInfoAddress: { flex: 1, fontSize: 12, color: COLORS.textSecondary },
  routeInfoDistance: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  permissionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  permissionText: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  loadingText: { fontSize: 15, color: COLORS.textSecondary, marginTop: 12 },
});
