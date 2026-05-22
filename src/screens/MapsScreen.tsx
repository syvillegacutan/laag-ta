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

// Standard Google polyline decoder
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

  const getRoute = useCallback(async () => {
    if (!location || !destination.trim()) return;
    setLoading(true);
    setRoute(null);
    setRouteCoords([]);
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
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? `Server error ${response.status}`);

      const coords = decodePolyline(data.polyline);
      setRoute(data);
      setRouteCoords(coords);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Fit map to show the full route
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
    if (location) {
      mapRef.current?.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 400);
    }
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
      {/* Top panel: search + route info */}
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
              onSubmitEditing={getRoute}
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
            onPress={getRoute}
            disabled={!destination.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="navigate" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Route info strip */}
        {route && (
          <View style={styles.routeInfo}>
            <View style={styles.routeInfoItem}>
              <Ionicons name="navigate" size={14} color={COLORS.primary} />
              <Text style={styles.routeInfoValue}>{route.distance}</Text>
            </View>
            <View style={styles.routeInfoDivider} />
            <View style={styles.routeInfoItem}>
              <Ionicons name="time-outline" size={14} color={COLORS.primary} />
              <Text style={styles.routeInfoValue}>{route.duration}</Text>
            </View>
            <View style={styles.routeInfoDivider} />
            <Text style={styles.routeInfoAddress} numberOfLines={1}>
              {route.endAddress}
            </Text>
            <TouchableOpacity onPress={clearRoute} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
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

        {/* My location button — floats over bottom-right of map */}
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
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  routeInfoItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  routeInfoValue: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  routeInfoDivider: { width: 1, height: 16, backgroundColor: COLORS.primary + '40' },
  routeInfoAddress: { flex: 1, fontSize: 12, color: COLORS.textSecondary },
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
