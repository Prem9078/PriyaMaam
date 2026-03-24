import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, StatusBar } from 'react-native';

const LOGO = require('../../assets/Logo.png');

// Words to reveal one by one
const WORDS = ['हिंदी', 'साहित्य', 'सरल', 'भाषा', 'में'];

export default function SplashScreen({ onFinish }) {
    const logoScale = useRef(new Animated.Value(0.4)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    // One opacity value per word
    const wordOpacities = useRef(WORDS.map(() => new Animated.Value(0))).current;
    const taglineOpacity = useRef(new Animated.Value(0)).current;
    const screenOpacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Build word-reveal animations: each word fades in 300ms, staggered by 350ms
        const wordAnims = wordOpacities.map((anim, i) =>
            Animated.timing(anim, {
                toValue: 1,
                duration: 300,
                delay: i * 350,
                useNativeDriver: true,
            })
        );

        Animated.sequence([
            // 1 — Logo springs in
            Animated.parallel([
                Animated.spring(logoScale, {
                    toValue: 1, tension: 60, friction: 6, useNativeDriver: true,
                }),
                Animated.timing(logoOpacity, {
                    toValue: 1, duration: 500, useNativeDriver: true,
                }),
            ]),

            // 2 — Words appear one by one (all kick off together but staggered via delay)
            Animated.parallel(wordAnims),

            // 3 — "Learn · Grow · Excel" fades in
            Animated.timing(taglineOpacity, {
                toValue: 1, duration: 400, useNativeDriver: true,
            }),

            // 4 — Hold
            Animated.delay(800),

            // 5 — Fade out
            Animated.timing(screenOpacity, {
                toValue: 0, duration: 450, useNativeDriver: true,
            }),
        ]).start(() => onFinish());
    }, []);

    return (
        <Animated.View style={[s.container, { opacity: screenOpacity }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Logo */}
            <Animated.Image
                source={LOGO}
                style={[s.logo, {
                    opacity: logoOpacity,
                    transform: [{ scale: logoScale }],
                }]}
                resizeMode="contain"
            />

            {/* Word-by-word reveal */}
            <View style={s.wordsRow}>
                {WORDS.map((word, i) => (
                    <Animated.Text
                        key={i}
                        style={[s.word, { opacity: wordOpacities[i] }]}
                    >
                        {word}{i < WORDS.length - 1 ? ' ' : ''}
                    </Animated.Text>
                ))}
            </View>

            {/* English tagline */}
            <Animated.Text style={[s.tagline, { opacity: taglineOpacity }]}>
                Learn · Grow · Succeed
            </Animated.Text>
        </Animated.View>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1, backgroundColor: '#fff',
        justifyContent: 'center', alignItems: 'center',
    },
    logo: {
        width: 260, height: 260,
    },
    wordsRow: {
        flexDirection: 'row', flexWrap: 'wrap',
        justifyContent: 'center', marginTop: 14,
        paddingHorizontal: 20,
    },
    word: {
        fontSize: 19,
        color: '#4B42D6',
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    tagline: {
        marginTop: 8,
        fontSize: 13,
        color: '#aaa',
        letterSpacing: 2,
        fontWeight: '400',
    },
});
