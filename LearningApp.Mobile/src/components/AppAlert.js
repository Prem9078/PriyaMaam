/**
 * AppAlert — drop-in themed replacement for React Native's Alert.alert()
 *
 * Usage in any screen:
 *   import { showAlert } from '../../components/AppAlert';
 *   showAlert('Title', 'Message');
 *   showAlert('Confirm', 'Are you sure?', [
 *     { text: 'Cancel', style: 'cancel' },
 *     { text: 'Delete', style: 'destructive', onPress: () => doDelete() },
 *   ]);
 *
 * Mount <AppAlertHost /> once at the app root (inside App.js).
 */
import React, { useState, useEffect } from 'react';
import {
    Modal, View, Text, TouchableOpacity,
    StyleSheet, Animated, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PURPLE = '#4B42D6';

// ─── Singleton trigger ────────────────────────────────────────────────────────
let _setAlert = null;

/**
 * showAlert(title, message, buttons?)
 * Mirrors the Alert.alert() API exactly.
 */
export function showAlert(title, message, buttons = []) {
    if (_setAlert) {
        _setAlert({
            visible: true,
            title,
            message,
            buttons: buttons.length ? buttons : [{ text: 'OK' }],
        });
    }
}

// ─── Determine icon + accent colour from title ────────────────────────────────
function getStyle(title = '') {
    const t = title.toLowerCase();
    if (t.includes('error') || t.includes('failed') || t.includes('invalid'))
        return { icon: 'close-circle', color: '#E53935' };
    if (t.includes('success') || t.includes('saved') || t.includes('created') ||
        t.includes('done') || t.includes('verified') || t.includes('enrolled') ||
        t.includes('✅') || t.includes('🎉'))
        return { icon: 'checkmark-circle', color: '#2E7D32' };
    if (t.includes('delete') || t.includes('logout') || t.includes('remove') ||
        t.includes('confirm'))
        return { icon: 'warning', color: '#F57C00' };
    if (t.includes('incomplete') || t.includes('permission') || t.includes('otp'))
        return { icon: 'information-circle', color: PURPLE };
    return { icon: 'information-circle', color: PURPLE };
}

// ─── Host component — render once at root ────────────────────────────────────
export function AppAlertHost() {
    const [state, setState] = useState({
        visible: false, title: '', message: '', buttons: [],
    });
    const scaleAnim = React.useRef(new Animated.Value(0.85)).current;
    const opacityAnim = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        _setAlert = setState;
        return () => { _setAlert = null; };
    }, []);

    useEffect(() => {
        if (state.visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 7 }),
                Animated.timing(opacityAnim, { toValue: 1, useNativeDriver: true, duration: 180 }),
            ]).start();
        } else {
            scaleAnim.setValue(0.85);
            opacityAnim.setValue(0);
        }
    }, [state.visible]);

    const hide = () => setState(s => ({ ...s, visible: false }));

    const { icon, color } = getStyle(state.title);

    return (
        <Modal
            transparent
            visible={state.visible}
            animationType="none"
            onRequestClose={hide}
            statusBarTranslucent
        >
            <Animated.View style={[s.overlay, { opacity: opacityAnim }]}>
                <Animated.View style={[s.card, { transform: [{ scale: scaleAnim }] }]}>
                    {/* Icon */}
                    <View style={[s.iconWrap, { backgroundColor: color + '18' }]}>
                        <Ionicons name={icon} size={36} color={color} />
                    </View>

                    {/* Title */}
                    <Text style={s.title}>{state.title}</Text>

                    {/* Message */}
                    {!!state.message && (
                        <Text style={s.message}>{state.message}</Text>
                    )}

                    {/* Buttons */}
                    <View style={[s.btnRow, state.buttons.length === 1 && { justifyContent: 'center' }]}>
                        {state.buttons.map((btn, i) => {
                            const isDestructive = btn.style === 'destructive';
                            const isCancel = btn.style === 'cancel';
                            const isPrimary = !isDestructive && !isCancel;

                            return (
                                <TouchableOpacity
                                    key={i}
                                    style={[
                                        s.btn,
                                        state.buttons.length > 1 && { flex: 1 },
                                        isPrimary && { backgroundColor: PURPLE },
                                        isDestructive && { backgroundColor: '#E53935' },
                                        isCancel && { backgroundColor: '#F5F5F5' },
                                    ]}
                                    onPress={() => {
                                        hide();
                                        setTimeout(() => btn.onPress?.(), 200);
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[
                                        s.btnText,
                                        isCancel && { color: '#555' },
                                    ]}>
                                        {btn.text}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const { width } = Dimensions.get('window');

const s = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(10,8,40,0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    card: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        elevation: 12,
        shadowColor: PURPLE,
        shadowOpacity: 0.2,
        shadowRadius: 20,
    },
    iconWrap: {
        width: 70, height: 70, borderRadius: 35,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 14,
    },
    title: {
        fontSize: 18, fontWeight: '800', color: '#1a1a2e',
        textAlign: 'center', marginBottom: 8,
    },
    message: {
        fontSize: 14, color: '#666', textAlign: 'center',
        lineHeight: 20, marginBottom: 20,
    },
    btnRow: {
        flexDirection: 'row', gap: 10, width: '100%',
    },
    btn: {
        borderRadius: 14, paddingVertical: 13,
        alignItems: 'center', justifyContent: 'center',
        minWidth: 90,
    },
    btnText: {
        color: '#fff', fontWeight: '700', fontSize: 15,
    },
});
